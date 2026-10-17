import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const titles = { '/': 'Give your old tech a better next life', '/about': 'About us', '/how-it-works': 'How it works', '/services': 'Services & accepted electronics', '/contact': 'Contact & common questions', '/login': 'Login', '/register': 'Register' }

export default function useRouteAccessibility() {
  const { pathname, hash } = useLocation()
  const previousRoute = useRef(`${pathname}${hash}`)
  useEffect(() => {
    const appTitle = pathname.includes('/profile') ? 'My profile' : pathname.includes('/requests/new') ? 'New pickup request' : pathname.endsWith('/edit') ? 'Edit request' : pathname.includes('/requests/') ? 'Pickup details & tracking' : pathname.includes('/tracking') ? 'Pickup tracking' : pathname.includes('/available') ? 'Available requests' : pathname.includes('/history') ? 'Collection history' : pathname.includes('/requests') ? 'My requests' : pathname.startsWith('/collector') ? 'Collector dashboard' : pathname.startsWith('/dashboard') ? 'My dashboard' : null
    document.title = `EcoCycle | ${titles[pathname] || appTitle || 'Page not found'}`
    const route = `${pathname}${hash}`
    const changed = previousRoute.current !== route
    previousRoute.current = route
    const frame = requestAnimationFrame(() => {
      const target = hash ? document.getElementById(hash.slice(1)) : document.getElementById('main-content')
      if (hash && target) target.scrollIntoView({ behavior: 'instant', block: 'start' })
      else window.scrollTo({ top: 0, behavior: 'instant' })
      if (changed) {
        if (target && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
        target?.focus({ preventScroll: true })
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash])
}
