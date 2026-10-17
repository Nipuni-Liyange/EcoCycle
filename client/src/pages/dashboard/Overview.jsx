import { ArrowRight, CalendarDays, CheckCheck, Clock3, ClipboardList, Leaf, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { dashboardPath, useAuth } from '../../context/authContext'
import useApi from '../../hooks/useApi'
import { EmptyState, ErrorState, LoadingState } from '../../components/app/Feedback'
import RequestTable from '../../components/app/RequestTable'
import SiteImage from '../../components/SiteImage'
import { images } from '../../data/siteContent'

export default function Overview() {
  const { user } = useAuth()
  const collector = user.role === 'collector'
  const base = dashboardPath(user)
  const stats = useApi('/pickups/stats')
  const recent = useApi('/pickups?limit=5')
  const cards = [[ClipboardList, collector ? 'Total collections' : 'Total requests', 'total'], [Clock3, collector ? 'Available requests' : 'Pending requests', collector ? 'available' : 'pending'], [CalendarDays, 'Scheduled pickups', 'scheduled'], [CheckCheck, 'Completed collections', 'completed']]
  return <>
    <div className="app-heading"><div><span className="eyebrow">EVERY ITEM IS A NEW OPPORTUNITY</span><h1>Hello, {user.name.split(' ')[0]}<span className="greeting-dot">.</span></h1><p>{collector ? 'A clear view of your collections and what comes next.' : 'Small steps, a better planet. Let’s keep the cycle going.'}</p></div><Link className="button" to={collector ? `${base}/available` : `${base}/requests/new`}><Plus size={17} />{collector ? 'Find a collection' : 'Create request'}</Link></div>
    {stats.loading ? <LoadingState /> : stats.error ? <ErrorState message={stats.error} retry={stats.reload} /> : <div className="stats-grid">{cards.map(([Icon, label, key]) => <article className="stat-card" key={key}><span className="stat-icon"><Icon size={21} strokeWidth={1.6} /></span><span>{label}</span><strong>{stats.data[key]}</strong><small>{key === 'completed' ? 'Collected or recycled' : 'Across your EcoCycle journey'}</small></article>)}</div>}
    <section className="dashboard-banner"><div><span className="eyebrow"><Leaf size={15} />ONE PICKUP AT A TIME</span><h2>{collector ? 'Make the next connection.' : 'Less clutter. More possibility.'}</h2><p>{collector ? 'Find electronics in your area and help give them a thoughtful next chapter.' : 'That old laptop or forgotten phone could have a better next chapter.'}</p><Link to={collector ? `${base}/available` : `${base}/requests/new`}>{collector ? 'Browse available requests' : 'Schedule your next pickup'}<ArrowRight size={17} /></Link></div><SiteImage image={collector ? images.collection : images.impact} /></section>
    <section className="app-panel"><div className="panel-heading"><div><h2>{collector ? 'Recent collections' : 'Recent requests'}</h2><p>Your latest activity, in one place.</p></div><Link to={`${base}/requests`}>View all <ArrowRight size={15} /></Link></div>{recent.loading ? <LoadingState /> : recent.error ? <ErrorState message={recent.error} retry={recent.reload} /> : recent.data.requests.length ? <RequestTable requests={recent.data.requests} base={base} /> : <EmptyState description={collector ? 'Accept an available pickup to start your collection journey.' : 'Your first pickup is a small step toward a better cycle.'} to={collector ? `${base}/available` : `${base}/requests/new`} action={collector ? 'Browse requests' : 'Create your first request'} />}</section>
  </>
}
