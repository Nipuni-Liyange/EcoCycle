import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import SectionTitle from './SectionTitle'

export default function PageHeader({ label, title, children }) {
  return <section className="page-header section-wrap"><nav className="breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">{label}</span></nav><SectionTitle>{label}</SectionTitle><h1>{title}</h1>{children && <p className="page-description">{children}</p>}</section>
}
