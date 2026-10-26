
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { connectDatabase, getDatabaseFailureAdvice } from './database.js'

dotenv.config({ path: new URL('../.env', import.meta.url), quiet: true })
const { createApp } = await import('./app.js')
const PORT = process.env.PORT || 5000

try {
  await connectDatabase()
  console.log('MongoDB connected successfully')
  const server = createApp().listen(PORT, () => console.log(`EcoCycle API listening on port ${PORT}`))
  const shutdown = () => server.close(async () => { await mongoose.disconnect(); process.exit(0) })
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  server.on('error', () => { console.error('The API could not start. Check whether its port is already in use.'); process.exit(1) })
} catch (error) {
  console.error(`MongoDB connection failed. ${getDatabaseFailureAdvice(error)}`)
  console.error('For local development without Atlas, run npm run dev:local.')
  await mongoose.disconnect()
  process.exitCode = 1
}
