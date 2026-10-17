import { useRef, useState } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import Brand from './Brand'
import { dashboardPath, useAuth } from '../context/authContext'

const links = [['/', 'Home'], ['/how-it-works', 'How It Works'], ['/about', 'About']]

export default function Navbar() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const toggle = useRef(null)
  function handleKeyDown(event) {
    if (event.key === 'Escape' && open) {
      setOpen(false)
      toggle.current?.focus()
    }
  }
  return (
    <header className="site-header" onKeyDown={handleKeyDown}>
      <Brand onClick={() => setOpen(false)} />
      <button ref={toggle} className="menu-toggle" type="button" aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(!open)}>
        {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
      </button>
      <nav id="main-navigation" className={`main-nav${open ? ' is-open' : ''}`} aria-label="Main navigation">
        {links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>{label}</NavLink>)}
        <div className="nav-actions">
          {user ? <NavLink className="button button-small" to={dashboardPath(user)} onClick={() => setOpen(false)}>My dashboard <ArrowUpRight size={16} aria-hidden="true" /></NavLink> : <><NavLink className="login-link" to="/login" onClick={() => setOpen(false)}>Login</NavLink><NavLink className="button button-small" to="/register" onClick={() => setOpen(false)}>Register <ArrowUpRight size={16} aria-hidden="true" /></NavLink></>}
        </div>
      </nav>
    </header>
  )
}
