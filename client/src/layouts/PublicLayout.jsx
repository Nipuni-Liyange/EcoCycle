import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import useRouteAccessibility from '../hooks/useRouteAccessibility'

export default function PublicLayout() {
  const { pathname } = useLocation()
  useRouteAccessibility()
  return <div className="site-shell" id="top"><a className="skip-link" href="#main-content">Skip to content</a><Navbar key={pathname} /><main id="main-content" tabIndex={-1}><Outlet /></main><Footer /></div>
}
