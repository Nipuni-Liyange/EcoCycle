export class HttpError extends Error {
  constructor(status, message, fields) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

export const categories = ['mobile-phones', 'laptops', 'batteries', 'chargers', 'keyboards', 'cables', 'other-electronics']
export const conditions = ['working', 'needs-repair', 'not-working']
export const statuses = ['pending', 'accepted', 'scheduled', 'collected', 'recycled']
export const districts = ['Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya']

export function text(value, field, min = 1, max = 200) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
    throw new HttpError(422, `Check ${field}.`, { [field]: `Enter ${min}–${max} characters.` })
  }
  return value.trim()
}

export function email(value) {
  const result = text(value, 'email', 3, 254).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new HttpError(422, 'Enter a valid email address.', { email: 'Enter a valid email address.' })
  return result
}

export function password(value) {
  if (typeof value !== 'string' || value.length < 8 || Buffer.byteLength(value, 'utf8') > 72) {
    throw new HttpError(422, 'Use a password with at least 8 characters and no more than 72 UTF-8 bytes.', { password: 'Use at least 8 characters (maximum 72 UTF-8 bytes).' })
  }
  return value
}

export function choice(value, field, options) {
  if (!options.includes(value)) throw new HttpError(422, `Choose a valid ${field}.`, { [field]: 'Choose an option from the list.' })
  return value
}

export function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export function dateOnly(value, field = 'preferredDate') {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) {
    throw new HttpError(422, 'Choose a valid pickup date.', { [field]: 'Choose a valid date.' })
  }
  if (value < today()) throw new HttpError(422, 'Pickup dates cannot be in the past.', { [field]: 'Choose today or a future date.' })
  return value
}

export function imageData(value) {
  if (value === undefined || value === null || value === '') return ''
  if (typeof value !== 'string' || value.length > 2800000) throw new HttpError(422, 'Choose an image smaller than 2 MB.')
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)
  if (!match) throw new HttpError(422, 'Use a JPEG, PNG or WebP image.')
  const bytes = Buffer.from(match[2], 'base64')
  const signatures = {
    jpeg: bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
    png: bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    webp: bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP',
  }
  if (bytes.length > 2 * 1024 * 1024 || !signatures[match[1]]) throw new HttpError(422, 'The image is invalid or exceeds 2 MB.')
  return value
}

export function pickupInput(body) {
  const quantity = body.quantity
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) throw new HttpError(422, 'Quantity must be a whole number from 1 to 999.', { quantity: 'Enter a whole number from 1 to 999.' })
  return {
    category: choice(body.category, 'category', categories),
    itemName: text(body.itemName, 'itemName', 2, 120), quantity,
    condition: choice(body.condition, 'condition', conditions),
    description: text(body.description ?? '', 'description', 0, 2000),
    district: choice(body.district, 'district', districts),
    city: text(body.city, 'city', 2, 100),
    address: text(body.address, 'address', 5, 500),
    preferredDate: dateOnly(body.preferredDate),
  }
}

export function profileInput(body) {
  const result = { name: text(body.name, 'name', 2, 80), phone: text(body.phone ?? '', 'phone', 0, 25), district: body.district || '' }
  if (result.phone && !/^[+\d ()-]{7,25}$/.test(result.phone)) throw new HttpError(422, 'Enter a valid phone number.', { phone: 'Use 7–25 phone number characters.' })
  if (result.district) choice(result.district, 'district', districts)
  return result
}
