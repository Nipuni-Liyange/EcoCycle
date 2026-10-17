import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import SiteImage from './SiteImage'

export default function EWasteCard({ category }) {
  const { id, label, icon: Icon, tone, image, position } = category
  return <Link className={`ewaste-card ${tone}`} to={`/services#${id}`}>
    <div className="category-media">{image ? <SiteImage image={image} position={position} decorative sizes="(max-width: 540px) 50vw, (max-width: 1000px) 33vw, 25vw" /> : <div className={`category-illustration ${tone}`} aria-hidden="true"><span className="illustration-orbit" /><Icon size={64} strokeWidth={1.2} /></div>}</div>
    <div className="category-label"><span><Icon size={18} aria-hidden="true" />{label}</span><ArrowUpRight size={18} aria-hidden="true" /></div>
  </Link>
}
