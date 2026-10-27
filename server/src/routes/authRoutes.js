import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { rateLimit } from 'express-rate-limit'
import { User, publicUser } from '../models.js'
import { authenticate, createSession, csrf, logout } from '../auth.js'
import { choice, email, HttpError, password, profileInput } from '../validation.js'

const router = Router()
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Too many account attempts. Please try again in 15 minutes.' } })
// A fixed, valid hash keeps password checking comparable for unknown email addresses.
const dummyHash = bcrypt.hashSync('ecocycle-timing-placeholder', 12)

router.post('/register', authLimit, async (req, res) => {
  const address = email(req.body.email)
  const secret = password(req.body.password)
  const role = choice(req.body.role, 'role', ['user', 'collector'])
  const profile = profileInput(req.body)
  if (await User.exists({ email: address })) throw new HttpError(409, 'An account with this email already exists.', { email: 'Try logging in with this email.' })
  const user = await User.create({ ...profile, email: address, role, passwordHash: await bcrypt.hash(secret, 12) })
  res.status(201).json(await createSession(req, res, user))
})

router.post('/login', authLimit, async (req, res) => {
  const address = email(req.body.email)
  const secret = password(req.body.password)
  const role = req.body.role === undefined ? undefined : choice(req.body.role, 'role', ['user', 'collector'])
  const user = await User.findOne({ email: address }).select('+passwordHash')
  const matches = await bcrypt.compare(secret, user?.passwordHash || dummyHash)
  if (!user || !matches || role && user.role !== role) throw new HttpError(401, 'Email or password is incorrect.')
  res.json(await createSession(req, res, user))
})

router.use(authenticate, csrf)
router.get('/me', (req, res) => res.json({ user: publicUser(req.user), csrfToken: req.session.csrfToken }))
router.post('/logout', logout)
router.patch('/profile', async (req, res) => {
  // Email and role are deliberately not mutable through the profile endpoint.
  if (['email', 'role', 'password', 'passwordHash'].some(key => key in req.body)) throw new HttpError(422, 'Only your name, phone and district can be updated here.')
  const user = await User.findByIdAndUpdate(req.user._id, { $set: profileInput(req.body) }, { returnDocument: 'after', runValidators: true })
  res.json({ user: publicUser(user) })
})

export default router
