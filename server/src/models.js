import mongoose from 'mongoose'
import { categories, conditions, districts, statuses } from './validation.js'

const { Schema } = mongoose

const userSchema = new Schema({
  name: { type: String, required: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'collector'], required: true, immutable: true },
  phone: { type: String, default: '' },
  district: { type: String, enum: ['', ...districts], default: '' },
}, { timestamps: true })

const sessionSchema = new Schema({
  tokenHash: { type: String, required: true, unique: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  csrfToken: { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
})

// Binary data stays inside the pickup's atomic MongoDB document. API responses
// expose only each photo's ID, dimensions and authenticated URL.
const photoSchema = new Schema({
  data: { type: Buffer, required: true, select: false },
  contentType: { type: String, enum: ['image/webp'], required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  size: { type: Number, required: true, max: 2 * 1024 * 1024 },
})

const pickupSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  collector: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  category: { type: String, enum: categories, required: true },
  itemName: { type: String, required: true, maxlength: 120 },
  quantity: { type: Number, required: true, min: 1, max: 999 },
  condition: { type: String, enum: conditions, required: true },
  description: { type: String, maxlength: 2000, default: '' },
  district: { type: String, enum: districts, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  preferredDate: { type: String, required: true },
  image: { type: String, default: '', select: false },
  photos: { type: [photoSchema], default: [], validate: value => value.length <= 3 },
  status: { type: String, enum: statuses, default: 'pending' },
  scheduledAt: { type: Date, default: null },
  timeline: [{ _id: false, status: { type: String, enum: statuses, required: true }, at: { type: Date, default: Date.now }, note: { type: String, maxlength: 500, default: '' } }],
}, { timestamps: true })
pickupSchema.index({ user: 1, createdAt: -1 })
pickupSchema.index({ collector: 1, status: 1, createdAt: -1 })
pickupSchema.index({ status: 1, district: 1, createdAt: -1 })

export const User = mongoose.model('User', userSchema)
export const Session = mongoose.model('Session', sessionSchema)
export const Pickup = mongoose.model('Pickup', pickupSchema)
export const initializeModels = () => Promise.all([User.init(), Session.init(), Pickup.init()])

export function publicUser(user) {
  return { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, district: user.district, createdAt: user.createdAt }
}
