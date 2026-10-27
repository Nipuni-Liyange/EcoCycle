import { ArrowUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import Brand from './Brand'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand-block"><Brand className="footer-brand" /><p>Good for your space.<br />Better for the next cycle.</p></div>
        <nav className="footer-column" aria-label="Footer navigation"><span className="footer-label">EXPLORE</span><Link to="/about">Our mission</Link><Link to="/#how-it-works">Collection steps</Link><Link to="/services">Accepted items</Link></nav>
        <div className="footer-column"><span className="footer-label">LET’S KEEP IT CIRCULAR</span><Link to="/contact">Contact & common questions</Link><span>Connect with your assigned collector from your dashboard.</span></div>
        <a className="back-top" href="#top" aria-label="Back to top"><ArrowUp size={19} aria-hidden="true" /></a>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} EcoCycle. A little better, together.</span><span>Thoughtful recycling starts with us.</span></div>
    </footer>
  )
}
