import { Recycle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Brand({ className = '', onClick }) {
  return <Link className={`brand ${className}`} to="/" onClick={onClick} aria-label="EcoCycle home"><span className="brand-mark"><Recycle size={21} strokeWidth={2.4} aria-hidden="true" /></span><span>eco<span>cycle</span></span></Link>
}
