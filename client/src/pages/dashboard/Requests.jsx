import { Plus, Search } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { dashboardPath, useAuth } from '../../context/authContext'
import { EmptyState, ErrorState, LoadingState } from '../../components/app/Feedback'
import RequestTable from '../../components/app/RequestTable'
import useApi from '../../hooks/useApi'
import { statusLabels } from '../../lib/format'

export default function Requests({ scope = 'mine', tracking = false }) {
  const { user } = useAuth()
  const base = dashboardPath(user)
  const collector = user.role === 'collector'
  const [params, setParams] = useSearchParams()
  const query = new URLSearchParams(params)
  query.set('scope', scope)
  const { data, loading, error, reload } = useApi(`/pickups?${query}`)
  const options = useApi('/pickups/options')
  const title = scope === 'available' ? 'Find your next collection.' : scope === 'history' ? 'Every collection counts.' : tracking ? 'Follow the next chapter.' : collector ? 'Your collections.' : 'Your pickup requests.'
  function filter(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    next.delete('page'); setParams(next, { replace: true })
  }
  return <><div className="app-heading"><div><span className="eyebrow">{scope === 'available' ? 'AVAILABLE REQUESTS' : scope === 'history' ? 'COLLECTION HISTORY' : tracking ? 'PICKUP TRACKING' : 'YOUR ACTIVITY'}</span><h1>{title}</h1><p>{scope === 'available' ? 'Explore pending pickups. Accept the ones you can collect.' : 'View the details, follow progress, and plan your next step.'}</p></div>{!collector && <Link className="button" to={`${base}/requests/new`}><Plus size={17} />Create request</Link>}</div><section className="app-panel"><form className="request-filters" onSubmit={event => { event.preventDefault(); filter('q', new FormData(event.currentTarget).get('q').trim()) }}><div className="search-box"><Search size={18} /><input name="q" type="search" aria-label="Search requests" placeholder="Search items or locations…" defaultValue={params.get('q') || ''} maxLength={100} key={params.get('q') || ''} /><button type="submit">Search</button></div><select aria-label="Filter by status" value={params.get('status') || ''} onChange={event => filter('status', event.target.value)} disabled={scope === 'available'}><option value="">{scope === 'available' ? 'Pending requests' : 'All statuses'}</option>{(scope === 'history' ? ['collected', 'recycled'] : statusLabels).map(status => <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>)}</select>{scope === 'available' && <select aria-label="Filter by district" value={params.get('district') || ''} onChange={event => filter('district', event.target.value)}><option value="">All districts</option>{options.data?.districts.map(district => <option key={district}>{district}</option>)}</select>}</form>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} retry={reload} /> : <><div className="list-count" role="status">{data.total} {data.total === 1 ? 'request' : 'requests'}{params.get('q') && ` matching “${params.get('q')}”`}{params.toString() && <button className="link-button" onClick={() => setParams({})}>Clear filters</button>}</div>{data.requests.length ? <RequestTable requests={data.requests} base={base} /> : <EmptyState title="No requests here yet." description={params.toString() ? 'Try a different search or clear your filters.' : scope === 'available' ? 'New requests will appear when people submit pickups.' : scope === 'history' ? 'Completed collections will appear here as you update their status.' : 'Create or accept a pickup request to start your journey.'} />}{data.pages > 1 && <div className="pagination"><button disabled={data.page <= 1} onClick={() => setParams({ ...Object.fromEntries(params), page: data.page - 1 })}>Previous</button><span>Page {data.page} of {data.pages}</span><button disabled={data.page >= data.pages} onClick={() => setParams({ ...Object.fromEntries(params), page: data.page + 1 })}>Next</button></div>}</>}
    </section></>
}
