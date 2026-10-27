import { useRef, useState } from 'react'
import { ArrowUpRight, CircleHelp, ClipboardList, History, LayoutDashboard, Leaf, LogOut, Menu, PackageSearch, Plus, UserRound, X } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Brand from '../components/Brand'
import { dashboardPath, useAuth } from '../context/authContext'
import { errorMessage } from '../lib/api'
import useRouteAccessibility from '../hooks/useRouteAccessibility'
import { FormError } from '../components/app/Feedback'

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const collector = user.role === 'collector'
  const base = dashboardPath(user)
  const { pathname } = useLocation()
  const [openAt, setOpenAt] = useState(null)
  const menu = useRef(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  useRouteAccessibility()
  const links = collector ? [[base, 'Overview', LayoutDashboard], [`${base}/available`, 'Available requests', PackageSearch], [`${base}/requests`, 'My collections', ClipboardList], [`${base}/history`, 'Collection history', History], [`${base}/profile`, 'My profile', UserRound]] : [[base, 'Overview', LayoutDashboard], [`${base}/requests/new`, 'New pickup', Plus], [`${base}/requests`, 'My requests', ClipboardList], [`${base}/tracking`, 'Pickup tracking', History], [`${base}/profile`, 'My profile', UserRound]]
  async function signOut() {
    setBusy(true)
    try { await logout(); navigate('/login') } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }
  return <div className="dashboard-shell" id="top" onKeyDown={event => { if (event.key === 'Escape' && openAt !== null) { setOpenAt(null); menu.current?.focus() } }}><a className="skip-link" href="#main-content">Skip to content</a>
    <aside className={`dashboard-sidebar ${openAt === pathname ? 'is-open' : ''}`} id="dashboard-nav">
      <Brand />
      <span className="workspace-label">{collector ? 'COLLECTOR WORKSPACE' : 'YOUR ECOCYCLE'}</span>
      <nav aria-label="Dashboard navigation">{links.map(([to, label, Icon]) => <NavLink to={to} key={to} end onClick={() => setOpenAt(null)}><Icon size={18} aria-hidden="true" />{label}</NavLink>)}</nav>
      <div className="sidebar-bottom">
        <Link className="sidebar-guide" to="/how-it-works"><Leaf size={18} aria-hidden="true" /><span>Collection guide</span><ArrowUpRight size={14} aria-hidden="true" /></Link>
        <Link className="sidebar-help" to="/contact"><CircleHelp size={18} />Help & guidance</Link>
        <button className="signout" disabled={busy} onClick={signOut}><LogOut size={18} />{busy ? 'Signing out…' : 'Log out'}</button>
      </div>
    </aside>
    <div className="dashboard-body"><header className="dashboard-topbar"><div><button ref={menu} className="dashboard-menu" aria-label={openAt === pathname ? 'Close dashboard navigation' : 'Open dashboard navigation'} aria-expanded={openAt === pathname} aria-controls="dashboard-nav" onClick={() => setOpenAt(openAt === pathname ? null : pathname)}>{openAt === pathname ? <X /> : <Menu />}</button><span>{collector ? 'Recycling Collector' : 'General User'}</span></div><Link className="profile-chip" to={`${base}/profile`}><span>{user.name.slice(0, 1).toUpperCase()}</span><div><strong>{user.name}</strong><small>My account</small></div></Link></header><main className="dashboard-main" id="main-content" tabIndex={-1}><FormError message={error} /><Outlet /></main><footer className="dashboard-footer">EcoCycle <span>A little better, together.</span><Link to="/">Back to website <ArrowUpRight size={13} /></Link></footer></div>
  </div>
}
