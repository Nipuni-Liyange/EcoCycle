import { Leaf } from 'lucide-react'
import Button from './Button'
import SectionTitle from './SectionTitle'

export default function CallToAction() {
  return <section className="cta-section section-wrap" id="get-started"><div className="cta-leaf" aria-hidden="true"><Leaf size={120} strokeWidth={0.8} /></div><div className="cta-copy"><SectionTitle number="↗" light>SMALL ACTION, LASTING IMPACT</SectionTitle><h2>Ready to clear<br />the <em>right way?</em></h2><p>Make space at home and keep valuable materials in the cycle.</p></div><Button to="/register?intent=pickup" light>Schedule a Pickup</Button></section>
}
