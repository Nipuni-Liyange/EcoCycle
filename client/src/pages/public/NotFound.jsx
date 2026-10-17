import { Recycle } from 'lucide-react'
import Button from '../../components/Button'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return <section className="not-found section-wrap"><span className="error-code">404</span><Recycle size={48} strokeWidth={1.2} aria-hidden="true" /><h1>A little <em>off the cycle.</em></h1><p>We couldn’t find that page. Let’s get you back to a better destination.</p><Button to="/">Back to EcoCycle</Button><Link className="text-link" to="/services">Explore accepted items</Link></section>
}
