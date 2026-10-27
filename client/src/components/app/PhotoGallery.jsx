import { useState } from 'react'
import { ImageOff } from 'lucide-react'

export function PrivatePhoto({ photo, alt, className }) {
  const [failed, setFailed] = useState(false)
  return failed ? <span className={`${className || ''} photo-unavailable`} role="img" aria-label="Photo unavailable. Refresh to try again."><ImageOff size={20} /></span>
    : <img className={className} src={photo.url} alt={alt} loading="lazy" onError={() => setFailed(true)} />
}

export default function PhotoGallery({ photos = [], itemName }) {
  if (!photos.length) return null
  return <section className="photo-gallery" aria-label="E-waste photos">
    <h3>Photos <span>{photos.length}</span></h3>
    <div className="photo-gallery-grid">{photos.map((photo, index) => <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer" aria-label={`Open photo ${index + 1} of ${itemName} in a new tab`}><PrivatePhoto photo={photo} alt={`${itemName}, photo ${index + 1}`} /><span>View photo {index + 1} ↗</span></a>)}</div>
  </section>
}
