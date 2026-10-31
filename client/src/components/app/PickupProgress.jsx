import { Check } from 'lucide-react'
import { statusLabels } from '../../lib/format'

export default function PickupProgress({ status }) {
  const stage = statusLabels.indexOf(status)
  return <ol className="pickup-progress" aria-label="Pickup progress">{statusLabels.map((value, index) =>
    <li key={value} className={index <= stage ? 'reached' : ''} aria-current={index === stage ? 'step' : undefined}>
      <span aria-hidden="true">{index < stage ? <Check size={17} /> : index + 1}</span>
      <strong>{value.charAt(0).toUpperCase() + value.slice(1)}</strong>
    </li>,
  )}</ol>
}
