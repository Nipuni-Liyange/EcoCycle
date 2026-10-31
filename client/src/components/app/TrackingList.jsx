import { ArrowUpRight, Laptop } from 'lucide-react'
import { Link } from 'react-router-dom'
import { categories } from '../../data/siteContent'
import { formatDate } from '../../lib/format'
import { PrivatePhoto } from './PhotoGallery'
import PickupProgress from './PickupProgress'
import PickupTimeline from './PickupTimeline'
import StatusBadge from './StatusBadge'

const descriptions = {
  pending: 'Waiting for a collector to accept your request.',
  accepted: 'A collector has accepted your request. A pickup date will be confirmed next.',
  scheduled: 'Pickup scheduled. Your collector will collect the items at the confirmed time.',
  collected: 'Your items have been collected. Recycling completion is the next step.',
  recycled: 'Your collector has reported that recycling is complete.',
}

export default function TrackingList({ requests, base }) {
  return <div className="tracking-list">{requests.map(item => {
    const category = categories.find(value => value.id === item.category)
    const Icon = category?.icon || Laptop
    return <article className="tracking-card" key={item._id} aria-labelledby={`tracking-${item._id}`}>
      <div className="tracking-card-heading"><span className="tracking-photo">{item.photos?.length
        ? <PrivatePhoto key={item.photos[0].id} photo={item.photos[0]} alt={item.itemName} /> : <Icon size={28} />}</span>
        <div><h2 id={`tracking-${item._id}`}>{item.itemName}</h2><p>{category?.label} · {item.quantity} {item.quantity === 1 ? 'item' : 'items'}</p></div>
        <StatusBadge status={item.status} />
      </div>
      <p className="tracking-description">{descriptions[item.status]}</p>
      <PickupProgress status={item.status} />
      <dl className="tracking-facts">
        <div><dt>Pickup location</dt><dd>{item.city}, {item.district}</dd></div>
        <div><dt>{item.scheduledAt ? 'Confirmed pickup' : 'Preferred pickup'}</dt><dd>{formatDate(item.scheduledAt || item.preferredDate, !!item.scheduledAt)}{item.scheduledAt && <small>Sri Lanka time</small>}</dd></div>
        <div><dt>Your collector</dt><dd>{item.collector?.name ? <>
          <strong>{item.collector.name}</strong>
          {item.collector.email && <a href={`mailto:${item.collector.email}`}>{item.collector.email}</a>}
          {item.collector.phone && <a href={`tel:${item.collector.phone.replace(/[^+\d]/g, '')}`}>{item.collector.phone}</a>}
        </> : item.status === 'pending' ? 'Not assigned yet' : 'Collector details unavailable'}</dd></div>
      </dl>
      {!!item.timeline?.length && <details className="tracking-timeline"><summary>Activity timeline ({item.timeline.length})</summary><PickupTimeline events={item.timeline} /></details>}
      <div className="tracking-card-footer"><Link className="button button-outline" to={`${base}/requests/${item._id}`} state={{ from: `${base}/tracking` }}>View details<ArrowUpRight size={16} /></Link></div>
    </article>
  })}</div>
}
