import mongoose from 'mongoose'
import sharp from 'sharp'
import { HttpError, imageData } from './validation.js'

export const MAX_PHOTOS = 3
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024
export const MAX_IMAGE_PIXELS = 24_000_000
let processing = 0

const invalid = message => new HttpError(422, message, { photos: message })

export async function processPhoto(dataUrl) {
  try { imageData(dataUrl) } // Bounded base64 input, declared MIME and file signature.
  catch (error) { throw invalid(error.message) }
  if (!dataUrl) throw invalid('Choose a non-empty JPG, PNG or WebP photo.')
  const [, format, encoded] = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(dataUrl)
  const bytes = Buffer.from(encoded, 'base64')
  if (bytes.toString('base64') !== encoded) throw invalid('The photo encoding is invalid. Choose the original image file.')
  if (processing >= 2) throw new HttpError(503, 'Photo processing is busy. Please try saving again shortly.')
  processing += 1
  try {
    const image = sharp(bytes, { failOn: 'warning', limitInputPixels: MAX_IMAGE_PIXELS })
    const metadata = await image.metadata()
    if (metadata.format !== format || (metadata.pages || 1) !== 1) {
      throw invalid('Use a still JPG, PNG or WebP photo. Animated images are not supported.')
    }
    // Re-encoding decodes actual pixels and removes source metadata (including
    // EXIF/GPS), filenames and trailing content. Never keepMetadata().
    const { data, info } = await image.rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 }).timeout({ seconds: 10 }).toBuffer({ resolveWithObject: true })
    if (data.length > MAX_IMAGE_BYTES) throw invalid('This photo is too complex. Choose a smaller image.')
    return { _id: new mongoose.Types.ObjectId(), data, contentType: 'image/webp', width: info.width, height: info.height, size: data.length }
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw invalid('This photo could not be processed. Use an undamaged JPG, PNG or WebP image up to 2 MB and 24 megapixels.')
  } finally {
    processing -= 1
  }
}

// Omitted photos preserve the current set; [] explicitly removes it. Every
// retained ID must belong to this exact pickup, never another user's upload.
export async function photoChanges(body, current) {
  const hasPhotos = Object.hasOwn(body, 'photos')
  const hasImage = Object.hasOwn(body, 'image')
  if (!hasPhotos && !hasImage) return undefined
  if (hasPhotos && hasImage) throw invalid('Send photos or the legacy image field, not both.')
  const entries = hasPhotos ? body.photos : body.image === '' || body.image === null ? [] : [{ dataUrl: body.image }]
  if (!Array.isArray(entries) || entries.length > MAX_PHOTOS) throw invalid('Choose up to three photos per pickup request.')
  const output = []
  const retained = new Set()
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) || Object.keys(entry).length !== 1) throw invalid('Each photo must be a new image or an existing photo ID.')
    if (Object.hasOwn(entry, 'dataUrl')) {
      output.push(await processPhoto(entry.dataUrl))
      continue
    }
    const id = entry.id
    if (typeof id !== 'string' || retained.has(id)) throw invalid('Choose each saved photo only once.')
    retained.add(id)
    if (id === 'legacy' && current?.image) {
      output.push(await processPhoto(current.image))
      continue
    }
    const photo = current?.photos?.find(item => item._id.toString() === id)
    if (!photo?.data) throw invalid('A selected photo does not belong to this request. Refresh and try again.')
    output.push({ _id: photo._id, data: Buffer.from(photo.data), contentType: photo.contentType, width: photo.width, height: photo.height, size: photo.size })
  }
  return { photos: output, image: '' }
}

export function photoReferences(item) {
  const result = (item.photos || []).map(photo => ({
    id: photo._id.toString(), url: `/api/pickups/${item._id}/photos/${photo._id}`,
    width: photo.width, height: photo.height, size: photo.size,
  }))
  if (item.image || item.hasLegacyImage) result.push({ id: 'legacy', url: `/api/pickups/${item._id}/photos/legacy` })
  return result
}
