import { useState } from 'react'
import { CircuitBoard } from 'lucide-react'

export default function SiteImage({ image, className = '', priority = false, sizes = '(max-width: 760px) 100vw, 50vw', position, decorative = false }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <div className={`image-fallback ${className}`} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : image.alt} aria-hidden={decorative || undefined}><CircuitBoard size={64} strokeWidth={1} /><span>A better next life for electronics.</span></div>
  return <img className={className} src={image.src} srcSet={image.small ? `${image.small} 640w, ${image.src} ${image.width}w` : undefined} sizes={image.small ? sizes : undefined} width={image.width} height={image.height} alt={decorative ? '' : image.alt} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async" style={position ? { objectPosition: position } : undefined} onError={() => setFailed(true)} />
}
