import { AlertCircle, LoaderCircle, PackageOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LoadingState() {
  return <div className="app-feedback" role="status"><LoaderCircle className="spin" size={28} aria-hidden="true" /><p>Loading your EcoCycle…</p></div>
}
export function ErrorState({ message, retry }) {
  return <div className="app-feedback error-state" role="alert"><AlertCircle size={28} aria-hidden="true" /><h2>Something needs another try.</h2><p>{message}</p>{retry && <button className="button" onClick={retry}>Try again</button>}</div>
}
export function EmptyState({ title = 'A new cycle starts here.', description, to, action }) {
  return <div className="app-feedback empty-state"><span className="empty-icon"><PackageOpen size={34} strokeWidth={1.4} aria-hidden="true" /></span><h2>{title}</h2><p>{description}</p>{to && <Link className="button" to={to}>{action}</Link>}</div>
}
export function FormError({ message }) {
  return message ? <div className="form-alert" role="alert"><AlertCircle size={18} aria-hidden="true" /><span>{message}</span></div> : null
}
