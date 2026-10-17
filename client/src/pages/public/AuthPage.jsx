import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, Leaf, LockKeyhole, Truck, UserRound } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { dashboardPath, useAuth } from '../../context/authContext'
import { errorMessage } from '../../lib/api'
import SiteImage from '../../components/SiteImage'
import Field from '../../components/app/Field'
import { FormError } from '../../components/app/Feedback'
import { images } from '../../data/siteContent'

export default function AuthPage({ mode }) {
  const login = mode === 'login'
  const [params] = useSearchParams()
  const { user, authenticate } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [role, setRole] = useState(params.get('role') === 'collector' ? 'collector' : 'user')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState({})
  if (user) return <Navigate to={params.get('intent') === 'pickup' && user.role === 'user' ? '/dashboard/requests/new' : dashboardPath(user)} replace />
  async function submit(event) {
    event.preventDefault()
    const form = Object.fromEntries(new FormData(event.currentTarget))
    setFields({}); setError('')
    if (!login && form.password !== form.confirmPassword) { setFields({ confirmPassword: 'Your passwords do not match.' }); return }
    setBusy(true)
    try {
      const account = await authenticate(mode, { ...form, role })
      const from = location.state?.from
      const base = dashboardPath(account)
      navigate(account.role === 'user' && params.get('intent') === 'pickup' ? `${base}/requests/new` : from?.startsWith(`${base}/`) ? from : base, { replace: true })
    } catch (err) { setError(errorMessage(err)); setFields(err.response?.data?.fields || {}) }
    finally { setBusy(false) }
  }
  const query = params.toString() ? `?${params}` : ''
  return <section className="auth-layout section-wrap">
    <div className="auth-form-panel"><span className="eyebrow"><Leaf size={16} />A little better, together</span><h1>{login ? 'Welcome back.' : 'Join the next cycle.'}</h1><p className="auth-intro">{login ? 'Your pickups, your progress, a healthier planet.' : 'A new beginning for your old electronics starts here.'}</p>
      <form onSubmit={submit} className="app-form" aria-label={login ? 'Login' : 'Register'}>
        {!login && <fieldset className="role-picker"><legend>I’m joining as a</legend>{[['user', UserRound, 'General User', 'Give old tech a new life'], ['collector', Truck, 'Recycling Collector', 'Help make it happen']].map(([value, Icon, title, subtitle]) => <label className={role === value ? 'selected' : ''} key={value}><input type="radio" name="accountRole" value={value} checked={role === value} onChange={() => setRole(value)} /><Icon size={23} aria-hidden="true" /><strong>{title}</strong><span>{subtitle}</span></label>)}</fieldset>}
        <FormError message={error} />
        {!login && <Field id="name" name="name" label="Full name" autoComplete="name" placeholder="Your name" required minLength={2} maxLength={80} error={fields.name} />}
        <Field id="email" name="email" label="Email address" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} error={fields.email} />
        <div className="password-field"><Field id="password" name="password" label="Password" type={show ? 'text' : 'password'} autoComplete={login ? 'current-password' : 'new-password'} placeholder={login ? 'Enter your password' : 'At least 8 characters'} required minLength={8} maxLength={72} error={fields.password} /><button type="button" className="password-toggle" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
        {!login && <Field id="confirmPassword" name="confirmPassword" label="Confirm password" type={show ? 'text' : 'password'} autoComplete="new-password" required minLength={8} maxLength={72} error={fields.confirmPassword} />}
        <button className="button auth-submit" disabled={busy}>{busy ? 'One moment…' : login ? 'Log in' : 'Create account'}<ArrowRight size={18} aria-hidden="true" /></button>
      </form>
      <p className="auth-switch">{login ? 'New to EcoCycle?' : 'Already part of the cycle?'} <Link to={`${login ? '/register' : '/login'}${query}`} state={location.state}>{login ? 'Create an account' : 'Log in'}</Link></p>
      <p className="auth-security"><LockKeyhole size={14} aria-hidden="true" />Your account. Securely connected.</p>
    </div>
    <aside className="auth-photo"><SiteImage image={images.sorting} priority /><div><span className="eyebrow">SMALL ACTIONS. SHARED RESPONSIBILITY.</span><h2>Old electronics.<br /><em>New possibilities.</em></h2><p>Make room for better. Join people and collectors giving e-waste a thoughtful next chapter.</p><span className="auth-photo-icon"><Leaf size={27} /></span></div></aside>
  </section>
}
