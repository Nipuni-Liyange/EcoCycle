import { ArrowUpRight, Laptop, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { categories } from '../../data/siteContent'
import { formatDate } from '../../lib/format'
import StatusBadge from './StatusBadge'
import { PrivatePhoto } from './PhotoGallery'

export default function RequestTable({ requests, base }) {
  return <div className="request-table-wrap"><table className="request-table"><thead><tr><th scope="col">Item</th><th scope="col">Location</th><th scope="col">Pickup date</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Details</span></th></tr></thead><tbody>{requests.map(item => {
    const category = categories.find(value => value.id === item.category)
    const Icon = category?.icon || Laptop
    return <tr key={item._id}><td><Link className="table-item" to={`${base}/requests/${item._id}`}><span className={`item-icon${item.photos?.length ? ' has-photo' : ''}`}>{item.photos?.length ? <PrivatePhoto key={item.photos[0].id} photo={item.photos[0]} className="request-thumbnail" alt={`${item.itemName}, first of ${item.photos.length} photos`} /> : <Icon size={22} strokeWidth={1.5} />}</span><span><strong>{item.itemName}</strong><small>{category?.label} · {item.quantity} {item.quantity === 1 ? 'item' : 'items'}{item.photos?.length > 0 && <span className="table-photo-count"> · {item.photos.length} {item.photos.length === 1 ? 'photo' : 'photos'}</span>}</small></span></Link></td><td data-label="Location"><span className="table-location"><MapPin size={13} />{item.city}</span><small>{item.district}</small></td><td data-label="Pickup date">{formatDate(item.scheduledAt || item.preferredDate)}<small>{item.scheduledAt ? 'Confirmed' : 'Preferred'}</small></td><td data-label="Status"><StatusBadge status={item.status} /></td><td><Link className="table-open" to={`${base}/requests/${item._id}`} aria-label={`View ${item.itemName}`}><ArrowUpRight size={19} /></Link></td></tr>
  })}</tbody></table></div>
}
