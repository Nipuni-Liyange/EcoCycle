import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Button({ to, children, light = false, className = '' }) {
  return <Link to={to} className={`button${light ? ' button-light' : ''} ${className}`}>{children}<ArrowRight size={17} aria-hidden="true" /></Link>
}
