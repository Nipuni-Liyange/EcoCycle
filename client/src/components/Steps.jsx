import { ArrowUpRight } from 'lucide-react'
import { steps } from '../data/siteContent'

export default function Steps({ detailed = false }) {
  return <ol className={detailed ? 'journey-list' : 'steps-grid'}>{steps.map(({ number, title, description, detail }) => <li className="step-item" key={number}><span className="step-number" aria-hidden="true">{number}</span><span className="step-arrow" aria-hidden="true"><ArrowUpRight size={18} /></span><h3>{title}</h3><p>{description}</p>{detailed && <p className="step-detail">{detail}</p>}</li>)}</ol>
}
