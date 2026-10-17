import { useEffect, useRef, useState } from 'react'
import { api, errorMessage, setCsrfToken } from '../lib/api'
import { AuthContext } from './authContext'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const generation = useRef(0)
  function refresh() { setLoading(true); setError(''); setRevision(value => value + 1) }
  useEffect(() => {
    const controller = new AbortController()
    const current = generation.current
    api.get('/auth/me', { signal: controller.signal }).then(({ data }) => {
      if (controller.signal.aborted || current !== generation.current) return
      setUser(data.user); setCsrfToken(data.csrfToken); setLoading(false)
    }).catch(err => {
      if (controller.signal.aborted || current !== generation.current) return
      setUser(null); setCsrfToken(''); setLoading(false)
      if (err.response?.status !== 401) setError(errorMessage(err))
    })
    return () => controller.abort()
  }, [revision])
  useEffect(() => {
    const expired = () => { setUser(null); setCsrfToken('') }
    window.addEventListener('ecocycle:expired', expired)
    return () => window.removeEventListener('ecocycle:expired', expired)
  }, [])
  async function authenticate(mode, values) {
    const { data } = await api.post(`/auth/${mode}`, values)
    generation.current += 1
    setLoading(false)
    setUser(data.user)
    setCsrfToken(data.csrfToken)
    setError('')
    return data.user
  }
  async function logout() {
    await api.post('/auth/logout', {})
    setUser(null)
    setCsrfToken('')
  }
  return <AuthContext.Provider value={{ user, setUser, loading, error, refresh, authenticate, logout }}>{children}</AuthContext.Provider>
}
