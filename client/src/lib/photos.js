export const MAX_PHOTOS = 3
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function serializePhotos(photos) {
  return Promise.all(photos.map(photo => photo.file ? new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ dataUrl: reader.result })
    reader.onerror = reader.onabort = () => reject(new Error('A selected photo could not be read. Remove it and choose the file again.'))
    reader.readAsDataURL(photo.file)
  }) : { id: photo.id }))
}
