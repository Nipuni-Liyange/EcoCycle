import { useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Check, MapPin, Pencil, Trash2, Truck, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { dashboardPath, useAuth } from '../../context/authContext'
import { api, errorMessage } from '../../lib/api'
import { conditionLabels, formatDate } from '../../lib/format'
import { categories } from '../../data/siteContent'
import useApi from '../../hooks/useApi'
import Field from '../../components/app/Field'
import StatusBadge from '../../components/app/StatusBadge'
import PhotoGallery from '../../components/app/PhotoGallery'
import PickupProgress from '../../components/app/PickupProgress'
import PickupTimeline from '../../components/app/PickupTimeline'
import ConfirmDialog from '../../components/app/ConfirmDialog'
import { ErrorState, FormError, LoadingState } from '../../components/app/Feedback'

export default function RequestDetails() {
  const { id } = useParams()
  const { data, loading, error, reload } = useApi(`/pickups/${id}`)
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} retry={reload} />
  return <Details key={`${id}-${data.request.__v}`} item={data.request} reload={reload} />
}

function Details({ item, reload }) {
  const { user } = useAuth()
  const base = dashboardPath(user)
  const collector = user.role === 'collector'
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  async function action(path, payload = {}) {
    setError(''); setBusy(true)
    try { await api.post(`/pickups/${item._id}/${path}`, payload); reload() }
    catch (err) { setError(errorMessage(err)) }
    finally { setBusy(false) }
  }
  async function remove() {
    setBusy(true); setDeleteError('')
    try { await api.delete(`/pickups/${item._id}`, { data: {} }); navigate(`${base}/requests`, { replace: true }) }
    catch (err) { setDeleteError(errorMessage(err)) }
    finally { setBusy(false) }
  }
  const category = categories.find(value => value.id === item.category)
  const CategoryIcon = category?.icon || Truck
  const backTo = collector ? item.status === 'pending' ? `${base}/available` : item.status === 'recycled' ? `${base}/history` : `${base}/requests`
    : location.state?.from === `${base}/tracking` ? `${base}/tracking` : `${base}/requests`
  const backLabel = backTo.endsWith('/history') ? 'Back to collection history' : backTo.endsWith('/tracking') ? 'Back to tracking' : 'Back to requests'
  return <><Link className="back-link" to={backTo}><ArrowLeft size={16} />{backLabel}</Link>{location.state?.message && <p className="success-notice" role="status"><Check size={18} />{location.state.message}</p>}<div className="app-heading"><div><span className="eyebrow">REQUEST #{item._id.slice(-8).toUpperCase()}</span><h1>{item.itemName}</h1><p>Submitted {formatDate(item.createdAt)} · {item.quantity} {item.quantity === 1 ? 'item' : 'items'}</p></div><StatusBadge status={item.status} /></div>
    <section className="app-panel progress-panel"><div className="panel-heading"><div><h2>Your pickup journey</h2><p>Progress reported by your collector.</p></div><button className="link-button" onClick={reload}>Refresh status</button></div><PickupProgress status={item.status} /></section>
    <div className="detail-grid"><div><section className="app-panel detail-panel"><h2><CategoryIcon size={22} />Item details</h2><dl className="details-list"><div><dt>Category</dt><dd>{category?.label}</dd></div><div><dt>Condition</dt><dd>{conditionLabels[item.condition]}</dd></div><div><dt>Quantity</dt><dd>{item.quantity}</dd></div><div><dt>Description</dt><dd className="preserve-lines">{item.description || 'No additional details provided.'}</dd></div></dl><PhotoGallery photos={item.photos} itemName={item.itemName} /></section><section className="app-panel detail-panel"><h2><MapPin size={22} />Collection details</h2><dl className="details-list"><div><dt>Location</dt><dd>{item.city}, {item.district}</dd></div><div><dt>Pickup address</dt><dd className="preserve-lines">{item.address || 'The address will be shared after you accept this request.'}</dd></div><div><dt>Preferred date</dt><dd>{formatDate(item.preferredDate)}</dd></div><div><dt>Confirmed pickup</dt><dd>{formatDate(item.scheduledAt, true)}{item.scheduledAt && <small>Sri Lanka time</small>}</dd></div></dl></section><section className="app-panel detail-panel"><h2>Activity timeline</h2><PickupTimeline events={item.timeline} /></section></div>
      <aside><section className="app-panel detail-panel"><h2><UserRound size={21} />{collector && item.user?.name ? 'Requested by' : 'Your collector'}</h2>{(collector ? item.user?.name : item.collector?.name) ? <div className="contact-person"><strong>{collector ? item.user.name : item.collector.name}</strong><a href={`mailto:${collector ? item.user.email : item.collector.email}`}>{collector ? item.user.email : item.collector.email}</a>{(collector ? item.user.phone : item.collector.phone) && <a href={`tel:${(collector ? item.user.phone : item.collector.phone).replace(/[^+\d]/g, '')}`}>{collector ? item.user.phone : item.collector.phone}</a>}<p>Coordinate the details before collection.</p></div> : <p className="muted-copy">{collector ? 'Contact details are shared with the assigned collector after acceptance.' : 'Your request is waiting for a collector. Check back for updates.'}</p>}</section>
      <section className="app-panel detail-panel actions-panel"><h2>Next steps</h2><FormError message={error} />{!collector && item.status === 'pending' ? <><Link className="button" to={`${base}/requests/${item._id}/edit`}><Pencil size={16} />Edit request</Link><button className="button button-outline danger-text" onClick={() => setDeleting(true)}><Trash2 size={16} />Delete request</button><p>You can make changes until a collector accepts.</p></> : !collector ? <p>Your collector will update the request as your items move through the cycle.</p> : item.status === 'pending' ? <><p>Accept this request if you can collect these items from {item.city}.</p><button className="button" onClick={() => action('accept')} disabled={busy}>{busy ? 'Accepting…' : 'Accept request'}<ArrowRight size={16} /></button></> : ['accepted', 'scheduled'].includes(item.status) ? <><form className="app-form" onSubmit={event => { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); action('schedule', { scheduledAt: new Date(`${values.date}T${values.time}:00+05:30`).toISOString(), note: values.note }) }}><Field id="schedule-date" name="date" label="Pickup date" type="date" required /><Field id="schedule-time" name="time" label="Pickup time (Sri Lanka)" type="time" required /><Field id="schedule-note" name="note" label="Collection note (optional)" as="textarea" rows={3} maxLength={500} /><button className="button" disabled={busy}><CalendarDays size={16} />{busy ? 'Saving…' : item.status === 'scheduled' ? 'Reschedule pickup' : 'Confirm schedule'}</button></form>{item.status === 'scheduled' && <button className="button button-outline" onClick={() => action('status', { status: 'collected' })} disabled={busy}><Check size={16} />Mark as collected</button>}</> : item.status === 'collected' ? <><p>Update this request once recycling is complete.</p><button className="button" onClick={() => action('status', { status: 'recycled' })} disabled={busy}>{busy ? 'Updating…' : 'Mark as recycled'}<Check size={16} /></button></> : <p>This collection is complete. Thank you for keeping materials in the cycle.</p>}</section>
      </aside></div><ConfirmDialog open={deleting} onClose={() => { setDeleting(false); setDeleteError('') }} onConfirm={remove} busy={busy} error={deleteError} title="Delete this request?">This will permanently delete your pending request for {item.itemName}. You can create a new request whenever you’re ready.</ConfirmDialog>
  </>
}
