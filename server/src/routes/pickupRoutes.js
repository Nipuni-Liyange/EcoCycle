import { Router } from 'express'
import mongoose from 'mongoose'
import { Pickup } from '../models.js'
import { authenticate, authorize, csrf } from '../auth.js'
import { categories, choice, conditions, districts, HttpError, pickupInput, statuses, text } from '../validation.js'

const router = Router()
router.use(authenticate, csrf)
router.get('/options', (req, res) => res.json({ categories, conditions, districts, statuses }))

function ownScope(user) {
  return user.role === 'collector' ? { collector: user._id } : { user: user._id }
}

function visible(pickup, viewer) {
  const item = typeof pickup.toObject === 'function' ? pickup.toObject() : { ...pickup }
  if (viewer.role === 'collector' && !item.collector) {
    delete item.address
    delete item.user
  }
  return item
}

router.get('/stats', async (req, res) => {
  const rows = await Pickup.aggregate([{ $match: ownScope(req.user) }, { $group: { _id: '$status', count: { $sum: 1 } } }])
  const counts = Object.fromEntries(statuses.map(status => [status, 0]))
  rows.forEach(row => { counts[row._id] = row.count })
  const available = req.user.role === 'collector' ? await Pickup.countDocuments({ status: 'pending', collector: null }) : undefined
  res.json({ ...counts, total: rows.reduce((sum, row) => sum + row.count, 0), completed: counts.collected + counts.recycled, available })
})

router.get('/', async (req, res) => {
  const available = req.query.scope === 'available'
  if (available && req.user.role !== 'collector') throw new HttpError(403, 'Only collectors can browse available requests.')
  const filter = available ? { status: 'pending', collector: null } : ownScope(req.user)
  if (req.query.scope === 'history') filter.status = { $in: ['collected', 'recycled'] }
  if (req.query.status) {
    choice(req.query.status, 'status', statuses)
    if (available && req.query.status !== 'pending') throw new HttpError(422, 'Only pending requests are available.')
    if (req.query.scope === 'history' && !['collected', 'recycled'].includes(req.query.status)) throw new HttpError(422, 'History contains collected and recycled requests.')
    filter.status = req.query.status
  }
  if (req.query.district) filter.district = choice(req.query.district, 'district', districts)
  if (req.query.q) {
    const query = text(req.query.q, 'search', 1, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.$or = ['itemName', 'city', 'district', 'category'].map(field => ({ [field]: { $regex: query, $options: 'i' } }))
  }
  const page = Math.max(1, Math.min(100000, Number.parseInt(req.query.page, 10) || 1))
  const limit = Math.max(1, Math.min(50, Number.parseInt(req.query.limit, 10) || 10))
  const [requests, total] = await Promise.all([
    Pickup.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Pickup.countDocuments(filter),
  ])
  res.json({ requests: requests.map(item => visible(item, req.user)), total, page, pages: Math.ceil(total / limit) })
})

router.post('/', authorize('user'), async (req, res) => {
  const request = await Pickup.create({ ...pickupInput(req.body), user: req.user._id, timeline: [{ status: 'pending', note: 'Pickup request submitted.' }] })
  res.status(201).json({ request })
})

router.param('id', (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) throw new HttpError(404, 'Pickup request not found.')
  next()
})

router.get('/:id', async (req, res) => {
  const scope = req.user.role === 'collector' ? { $or: [{ collector: req.user._id }, { status: 'pending', collector: null }] } : { user: req.user._id }
  const request = await Pickup.findOne({ _id: req.params.id, ...scope }).select('+image').populate('collector', 'name email phone').lean()
  if (!request) throw new HttpError(404, 'Pickup request not found.')
  if (req.user.role === 'collector' && request.collector) await Pickup.populate(request, { path: 'user', select: 'name email phone' })
  res.json({ request: visible(request, req.user) })
})

router.patch('/:id', authorize('user'), async (req, res) => {
  const input = pickupInput(req.body)
  if (!Number.isInteger(req.body.version)) throw new HttpError(422, 'Reload this request before saving your changes.')
  const request = await Pickup.findOneAndUpdate({ _id: req.params.id, user: req.user._id, status: 'pending', collector: null, __v: req.body.version }, { $set: input, $inc: { __v: 1 } }, { returnDocument: 'after', runValidators: true }).select('+image')
  if (!request) throw new HttpError(409, 'This request has changed or is no longer pending. Refresh it before editing.')
  res.json({ request })
})

router.delete('/:id', authorize('user'), async (req, res) => {
  const request = await Pickup.findOneAndDelete({ _id: req.params.id, user: req.user._id, status: 'pending', collector: null })
  if (!request) throw new HttpError(409, 'Only your own pending requests can be deleted. Refresh to see the latest status.')
  res.status(204).end()
})

router.post('/:id/accept', authorize('collector'), async (req, res) => {
  const request = await Pickup.findOneAndUpdate({ _id: req.params.id, status: 'pending', collector: null }, {
    $set: { collector: req.user._id, status: 'accepted' }, $inc: { __v: 1 }, $push: { timeline: { status: 'accepted', at: new Date(), note: 'Accepted by a recycling collector.' } },
  }, { returnDocument: 'after' })
  if (!request) throw new HttpError(409, 'This request is no longer available. Another collector may have accepted it.')
  res.json({ request })
})

router.post('/:id/schedule', authorize('collector'), async (req, res) => {
  const raw = req.body.scheduledAt
  const at = new Date(typeof raw === 'string' ? raw : NaN)
  if (!Number.isFinite(at.getTime()) || at.getTime() <= Date.now()) throw new HttpError(422, 'Choose a future pickup date and time.', { scheduledAt: 'Choose a future date and time.' })
  const note = text(req.body.note ?? '', 'note', 0, 500)
  const request = await Pickup.findOneAndUpdate({ _id: req.params.id, collector: req.user._id, status: { $in: ['accepted', 'scheduled'] } }, {
    $set: { status: 'scheduled', scheduledAt: at }, $inc: { __v: 1 }, $push: { timeline: { status: 'scheduled', at: new Date(), note: `Pickup arranged for ${at.toISOString()}.${note ? ` ${note}` : ''}` } },
  }, { returnDocument: 'after', runValidators: true })
  if (!request) throw new HttpError(409, 'Only your accepted or scheduled collections can be scheduled.')
  res.json({ request })
})

router.post('/:id/status', authorize('collector'), async (req, res) => {
  const status = choice(req.body.status, 'status', ['collected', 'recycled'])
  const note = text(req.body.note ?? '', 'note', 0, 500)
  const request = await Pickup.findOneAndUpdate({ _id: req.params.id, collector: req.user._id, status: status === 'collected' ? 'scheduled' : 'collected' }, {
    $set: { status }, $inc: { __v: 1 }, $push: { timeline: { status, at: new Date(), note: note || (status === 'collected' ? 'Items collected.' : 'Recycling completed, as reported by the collector.') } },
  }, { returnDocument: 'after' })
  if (!request) throw new HttpError(409, 'This status change is not allowed. Refresh the request to see its current stage.')
  res.json({ request })
})

export default router
