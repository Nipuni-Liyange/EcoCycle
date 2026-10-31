import { Plus, RefreshCw, Search } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { dashboardPath, useAuth } from '../../context/authContext'
import { EmptyState, ErrorState, LoadingState } from '../../components/app/Feedback'
import RequestTable from '../../components/app/RequestTable'
import TrackingList from '../../components/app/TrackingList'
import useApi from '../../hooks/useApi'
import { statusLabels } from '../../lib/format'

export default function Requests({ scope = 'mine', tracking = false }) {
  const { user } = useAuth()
  const base = dashboardPath(user)
  const collector = user.role === 'collector'
  const available = scope === 'available'
  const history = scope === 'history'
  const [params, setParams] = useSearchParams()
  const query = new URLSearchParams(params)
  query.set('scope', scope)
  const { data, loading, error, reload } = useApi(`/pickups?${query}`)
  const options = useApi('/pickups/options')
  const statuses = available ? ['pending'] : history ? ['recycled'] : scope === 'active'
    ? statusLabels.filter(status => status !== 'recycled' && (!collector || status !== 'pending')) : statusLabels
  const title = available ? 'Find your next collection.' : history ? 'Every collection counts.' : tracking ? 'Follow the next chapter.' : collector ? 'Your active collections.' : 'Your pickup requests.'
  const description = available ? 'Explore pending pickups. Accept the ones you can collect.'
    : history ? 'Your completed recycling journeys, kept together for reference.'
      : tracking ? 'Follow your active pickups from request to recycling. Completed pickups stay in My Requests.'
        : collector ? 'Manage your accepted, scheduled and collected pickups. Recycled items move to Collection History.'
          : 'Manage all your requests, including completed pickups. You can edit or delete a request while it is pending.'
  const emptyTitle = available ? 'No available pickups right now.' : history ? 'Your collection history starts here.' : tracking ? 'No active pickups right now.' : collector ? 'No active collections yet.' : 'No requests here yet.'
  const emptyDescription = available ? 'New requests will appear when people submit pickups.'
    : history ? 'Collections appear here once you mark them as recycled.'
      : tracking ? 'Create a pickup to follow its progress, or visit My Requests to see completed pickups.'
        : collector ? 'Accept an available pickup to start your next collection.' : 'Create your first request to give your old electronics a new beginning.'
  const filtered = !!(params.get('q') || params.get('status') || params.get('district'))
  const countLabel = tracking ? data?.total === 1 ? 'active pickup' : 'active pickups'
    : collector && !available ? data?.total === 1 ? 'active collection' : 'active collections'
      : data?.total === 1 ? 'request' : 'requests'
  function filter(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    next.delete('page'); setParams(next, { replace: true })
  }
  return <>
    <div className="app-heading"><div><span className="eyebrow">{available ? 'AVAILABLE REQUESTS' : history ? 'COLLECTION HISTORY' : tracking ? 'PICKUP TRACKING' : collector ? 'MY COLLECTIONS' : 'MY REQUESTS'}</span><h1>{title}</h1><p>{description}</p></div>
      {!collector && <Link className="button" to={`${base}/requests/new`}><Plus size={17} />Create request</Link>}
    </div>
    <section className="app-panel" aria-label={tracking ? 'Active pickup tracking' : history ? 'Completed collections' : 'Pickup requests'}>
      <form className="request-filters" onSubmit={event => { event.preventDefault(); filter('q', new FormData(event.currentTarget).get('q').trim()) }}>
        <div className="search-box"><Search size={18} /><input name="q" type="search" aria-label="Search requests" placeholder="Search items or locations…" defaultValue={params.get('q') || ''} maxLength={100} key={params.get('q') || ''} /><button type="submit">Search</button></div>
        {history ? <select aria-label="Sort by recycling completion date" value={params.get('sort') || 'newest'} onChange={event => filter('sort', event.target.value)}><option value="newest">Newest completed first</option><option value="oldest">Oldest completed first</option></select>
          : <select aria-label="Filter by status" value={params.get('status') || ''} onChange={event => filter('status', event.target.value)} disabled={available}><option value="">{available ? 'Pending requests' : scope === 'active' ? 'All active statuses' : 'All statuses'}</option>{statuses.map(status => <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>)}</select>}
        {available && <select aria-label="Filter by district" value={params.get('district') || ''} onChange={event => filter('district', event.target.value)}><option value="">All districts</option>{options.data?.districts.map(district => <option key={district}>{district}</option>)}</select>}
      </form>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} retry={reload} /> : <>
        <div className="list-count"><span role="status">{history ? `${data.completedTotal} completed ${data.completedTotal === 1 ? 'collection' : 'collections'}${filtered ? ` · ${data.total} matching` : ''}` : `${data.total} ${countLabel}`}{params.get('q') && ` for “${params.get('q')}”`}</span>
          {params.toString() && <button className="link-button" onClick={() => setParams({})}>Clear filters</button>}
          <button className="link-button list-refresh" onClick={reload}><RefreshCw size={14} />{tracking ? 'Refresh status' : 'Refresh'}</button>
        </div>
        {data.requests.length ? tracking ? <TrackingList requests={data.requests} base={base} /> : <RequestTable requests={data.requests} base={base} history={history} />
          : <EmptyState title={filtered ? 'No matching requests.' : emptyTitle} description={filtered ? 'Try a different search or clear your filters.' : emptyDescription}
            to={filtered || available || history ? undefined : tracking ? `${base}/requests` : collector ? `${base}/available` : `${base}/requests/new`}
            action={tracking ? 'View My Requests' : collector ? 'Browse available pickups' : 'Create a request'} />}
        {data.pages > 1 && <div className="pagination"><button disabled={data.page <= 1} onClick={() => setParams({ ...Object.fromEntries(params), page: data.page - 1 })}>Previous</button><span>Page {data.page} of {data.pages}</span><button disabled={data.page >= data.pages} onClick={() => setParams({ ...Object.fromEntries(params), page: data.page + 1 })}>Next</button></div>}
      </>}
    </section>
  </>
}
