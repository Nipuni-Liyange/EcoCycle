import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import mongoose from 'mongoose'
import authRoutes from './routes/authRoutes.js'
import pickupRoutes from './routes/pickupRoutes.js'
import { HttpError } from './validation.js'

export function createApp() {
  const app = express()
  const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(origin => origin.trim())
  app.disable('x-powered-by')
  if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1)
  app.use(helmet())
  app.use(cors({ origin(origin, done) { done(null, !origin || origins.includes(origin)) }, credentials: true }))
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store')
    // JSON-only writes and Origin checks protect login/registration before a
    // session exists. Authenticated writes also require a CSRF token.
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      if (req.get('Origin') && !origins.includes(req.get('Origin'))) throw new HttpError(403, 'This origin is not allowed.')
      if (req.get('Sec-Fetch-Site') === 'cross-site') throw new HttpError(403, 'Cross-site requests are not allowed.')
      if (!req.is('application/json')) throw new HttpError(415, 'Send requests as application/json.')
    }
    next()
  })
  app.use(express.json({ limit: '3mb' }))
  app.use('/api', (req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) throw new HttpError(422, 'Send a JSON object with the required fields.')
    next()
  })
  app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 240, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Too many requests. Please try again shortly.' } }))
  app.get('/', (req, res) => res.send('EcoCycle Backend is Running Successfully!'))
  app.get('/api/health', (req, res) => res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({ status: mongoose.connection.readyState === 1 ? 'ok' : 'unavailable', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }))
  app.use('/api', (req, res, next) => {
    if (mongoose.connection.readyState !== 1) throw new HttpError(503, 'The database is temporarily unavailable. Please try again shortly.')
    next()
  })
  app.use('/api/auth', authRoutes)
  app.use('/api/pickups', pickupRoutes)
  app.use((req, res) => res.status(404).json({ message: 'Endpoint not found.' }))
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error)
    if (error.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.', fields: { email: 'Try logging in instead.' } })
    if (error.type === 'entity.too.large') return res.status(413).json({ message: 'The image is too large. Choose a file smaller than 2 MB.' })
    if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'The request contains invalid JSON.' })
    if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(422).json({ message: 'Please check the supplied values.' })
    if (error instanceof HttpError) return res.status(error.status).json({ message: error.message, fields: error.fields })
    // Driver errors may contain credentials: never log raw errors or requests.
    console.error('Request failed. Category:', ['MongoServerSelectionError', 'MongoNetworkError', 'MongooseServerSelectionError'].includes(error.name) ? 'database' : 'internal')
    res.status(503).json({ message: 'The service is temporarily unavailable. Please try again.' })
  })
  return app
}
