import { Plus } from 'lucide-react'
import { faqs } from '../data/siteContent'

export default function FaqList({ limit }) {
  return <div className="faq-list">{faqs.slice(0, limit).map(({ question, answer }) => <details className="faq-item" key={question}><summary>{question}<Plus size={19} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div>
}
