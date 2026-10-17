import { useState } from 'react'
import { Check, LockKeyhole, UserRound } from 'lucide-react'
import { useAuth } from '../../context/authContext'
import { api, errorMessage } from '../../lib/api'
import { formatDate } from '../../lib/format'
import useApi from '../../hooks/useApi'
import Field from '../../components/app/Field'
import { FormError } from '../../components/app/Feedback'

export default function Profile() {
  const { user, setUser } = useAuth()
  const options = useApi('/pickups/options')
  const [values, setValues] = useState({ name: user.name, phone: user.phone, district: user.district })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [fields, setFields] = useState({})
  const field = name => ({ id: name, name, value: values[name] || '', onChange: event => { setValues({ ...values, [name]: event.target.value }); setSaved(false) }, error: fields[name] })
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setSaved(false); setFields({})
    try { const { data } = await api.patch('/auth/profile', values); setUser(data.user); setSaved(true) }
    catch (err) { setError(errorMessage(err)); setFields(err.response?.data?.fields || {}) }
    finally { setBusy(false) }
  }
  return <><div className="app-heading"><div><span className="eyebrow">YOUR ACCOUNT</span><h1>A little about you.</h1><p>Keep your details up to date for a smoother collection.</p></div></div><div className="profile-layout"><aside className="app-panel profile-card"><span className="profile-avatar">{user.name.slice(0, 1).toUpperCase()}</span><h2>{user.name}</h2><span className="role-label">{user.role === 'collector' ? 'Recycling Collector' : 'General User'}</span><p>Part of the cycle since<br />{formatDate(user.createdAt)}</p></aside><form className="app-panel profile-form app-form" onSubmit={submit}><h2><UserRound size={21} />Personal information</h2><FormError message={error} />{saved && <p className="success-notice" role="status"><Check size={18} />Your profile has been saved.</p>}<Field {...field('name')} label="Full name" autoComplete="name" required minLength={2} maxLength={80} /><Field id="profile-email" label="Email address" type="email" value={user.email} readOnly hint="Your sign-in email is fixed for this account." /><div className="form-grid"><Field {...field('phone')} label="Phone number (optional)" type="tel" autoComplete="tel" maxLength={25} placeholder="e.g. +94 77 123 4567" /><Field {...field('district')} label="District (optional)" as="select" disabled={options.loading || !!options.error}><option value="">Choose a district</option>{options.data?.districts.map(district => <option key={district}>{district}</option>)}</Field></div>{options.error && <p className="field-error">District options could not load. <button type="button" className="link-button" onClick={options.reload}>Retry</button></p>}<p className="account-assurance"><LockKeyhole size={17} />Your account role is fixed after registration.</p><div className="form-actions"><button className="button" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}<Check size={17} /></button></div></form></div></>
}
