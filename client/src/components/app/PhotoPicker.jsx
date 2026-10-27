import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { MAX_PHOTOS, MAX_PHOTO_BYTES, PHOTO_TYPES } from '../../lib/photos'
import { FormError } from './Feedback'

export default function PhotoPicker({ photos, onChange, disabled, error }) {
  const [selectionError, setSelectionError] = useState('')
  const previewUrls = useRef(new Set())
  useEffect(() => {
    const urls = previewUrls.current
    return () => urls.forEach(url => URL.revokeObjectURL(url))
  }, [])

  function choose(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    setSelectionError('')
    if (files.length + photos.length > MAX_PHOTOS) {
      setSelectionError('You can add up to three photos. Remove a photo before choosing more.')
      return
    }
    if (files.some(file => !PHOTO_TYPES.includes(file.type) || file.size === 0 || file.size > MAX_PHOTO_BYTES)) {
      setSelectionError('Choose JPG, PNG or WebP photos, each no larger than 2 MB. Empty files cannot be uploaded.')
      return
    }
    const added = files.map(file => {
      const url = URL.createObjectURL(file)
      previewUrls.current.add(url)
      return { key: crypto.randomUUID(), file, url }
    })
    onChange([...photos, ...added])
  }

  function remove(index) {
    const photo = photos[index]
    if (photo.file) {
      URL.revokeObjectURL(photo.url)
      previewUrls.current.delete(photo.url)
    }
    setSelectionError('')
    onChange(photos.filter((_, position) => position !== index))
  }

  return <div className="photo-picker">
    <label className="upload-zone" htmlFor="pickup-photos">
      <ImagePlus size={27} strokeWidth={1.5} />
      <strong>Give your collector a clearer picture</strong>
      <span id="photo-guidance">Up to 3 photos · JPG, PNG or WebP · 2 MB each</span>
      <input id="pickup-photos" type="file" multiple accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" aria-describedby="photo-guidance photo-count" onChange={choose} disabled={disabled || photos.length === MAX_PHOTOS} />
    </label>
    <p className="photo-count" id="photo-count" role="status">{photos.length} of {MAX_PHOTOS} photos selected{photos.length === MAX_PHOTOS ? ' · Remove one to replace it.' : ''}</p>
    <FormError message={selectionError || error} />
    {photos.length > 0 && <ul className="photo-preview-grid">{photos.map((photo, index) => <li key={photo.id || photo.key} className="photo-preview-card">
      <img src={photo.url} alt={`E-waste preview ${index + 1}`} />
      <div><span title={photo.file?.name}>{photo.file?.name || `Saved photo ${index + 1}`}</span><button type="button" className="photo-remove" aria-label={`Remove photo ${index + 1}`} disabled={disabled} onClick={() => remove(index)}><Trash2 size={15} /></button></div>
    </li>)}</ul>}
    <p className="photo-privacy">Photos are visible to you and collectors considering your pending request. After acceptance, only you and your assigned collector can view them. Keep personal information out of photos.</p>
  </div>
}
