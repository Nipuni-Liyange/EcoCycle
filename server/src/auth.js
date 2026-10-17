import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { Session, publicUser } from './models.js'
import { HttpError } from './validation.js'

const lifetime = 7 * 24 * 60 * 60 * 1000
const cookieName = process.env.NODE_ENV === 'production' ? '__Host-ecocycle' : 'ecocycle_session'
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' }
const digest = token => createHash('sha256').update(token).digest('hex')

function readToken(req) {
  const value = (req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1)
  return /^[a-f0-9]{64}$/.test(value || '') ? value : null
}

export async function createSession(req, res, user) {
  const existing = readToken(req)
  if (existing) await Session.deleteOne({ tokenHash: digest(existing) })
  const token = randomBytes(32).toString('hex')
  const csrfToken = randomBytes(32).toString('hex')
  await Session.create({ tokenHash: digest(token), user: user._id, csrfToken, expiresAt: new Date(Date.now() + lifetime) })
  res.cookie(cookieName, token, { ...cookieOptions, maxAge: lifetime })
  return { user: publicUser(user), csrfToken }
}

export async function authenticate(req, res, next) {
  const token = readToken(req)
  if (!token) throw new HttpError(401, 'Please log in to continue.')
  const session = await Session.findOne({ tokenHash: digest(token), expiresAt: { $gt: new Date() } }).populate('user')
  if (!session?.user) throw new HttpError(401, 'Your session has expired. Please log in again.')
  req.user = session.user
  req.session = session
  next()
}

export function authorize(role) {
  return (req, res, next) => {
    if (req.user.role !== role) throw new HttpError(403, 'This action is not available for your account role.')
    next()
  }
}

export function csrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  const incoming = req.get('X-CSRF-Token') || ''
  const expected = req.session.csrfToken
  if (Buffer.byteLength(incoming) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(incoming), Buffer.from(expected))) {
    throw new HttpError(403, 'Your security token is invalid. Refresh the page and try again.')
  }
  next()
}

export async function logout(req, res) {
  await Session.deleteOne({ _id: req.session._id })
  res.clearCookie(cookieName, cookieOptions).status(204).end()
}
