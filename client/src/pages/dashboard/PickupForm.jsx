import { useState } from 'react'
import { ArrowLeft, ArrowRight, ImagePlus, Leaf } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, errorMessage } from '../../lib/api'
import { categories } from '../../data/siteContent'
import { conditionLabels, today } from '../../lib/format'
import useApi from '../../hooks/useApi'
import Field from '../../components/app/Field'
import { ErrorState, FormError, LoadingState } from '../../components/app/Feedback'

export default function PickupForm() {
  const { id } = useParams()
  const options = useApi('/pickups/options')
  if (options.loading) return <LoadingState />
  if (options.error) return <ErrorState message={options.error} retry={options.reload} />
  return id ? <EditPickup id={id} options={options.data} /> : <PickupEditor key="new" options={options.data} />
}

function EditPickup({ id, options }) {
  const { data, loading, error, reload } = useApi(`/pickups/${id}`)
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} retry={reload} />
  if (data.request.status !== 'pending') return <ErrorState message="Only pending requests can be edited. Open the request to see its current status." retry={reload} />
  return <PickupEditor key={`${id}-${data.request.__v}`} initial={data.request} options={options} />
}

function PickupEditor({ initial, options }) {
  const navigate = useNavigate()
  const [image, setImage] = useState(initial?.image || '')
  const [imageBusy, setImageBusy] = useState(false)
  const [imageError, setImageError] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState({})
  const [values, setValues] = useState(initial || { category: '', itemName: '', quantity: 1, condition: '', description: '', district: '', city: '', address: '', preferredDate: '' })
  function field(name) { return { id: name, name, value: values[name], onChange: event => setValues({ ...values, [name]: event.target.value }), error: fields[name] } }
  async function readImage(event) {
    const file = event.target.files[0]
    setImageError('')
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { setImageError('Choose a JPEG, PNG or WebP image smaller than 2 MB.'); event.target.value = ''; return }
    setImageBusy(true)
    try {
      const result = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file) })
      setImage(result)
    } catch { setImageError('This image could not be read. Try another file.') }
    finally { setImageBusy(false) }
  }
  async function submit(event) {
    event.preventDefault()
    const submitted = Object.fromEntries(new FormData(event.currentTarget))
    setValues(current => ({ ...current, ...submitted }))
    setBusy(true); setError(''); setFields({})
    try {
      const payload = { ...submitted, quantity: Number(submitted.quantity), image, version: initial?.__v }
      const { data } = initial ? await api.patch(`/pickups/${initial._id}`, payload) : await api.post('/pickups', payload)
      navigate(`/dashboard/requests/${data.request._id}`, { state: { message: initial ? 'Your request has been updated.' : 'Your pickup request has been created.' } })
    } catch (err) { setError(errorMessage(err)); setFields(err.response?.data?.fields || {}) }
    finally { setBusy(false) }
  }
  return <><Link className="back-link" to={initial ? `/dashboard/requests/${initial._id}` : '/dashboard/requests'}><ArrowLeft size={16} />{initial ? 'Back to request' : 'All requests'}</Link><div className="app-heading"><div><span className="eyebrow">{initial ? 'UPDATE YOUR DETAILS' : 'GIVE TECH ANOTHER CHANCE'}</span><h1>{initial ? 'Edit your pickup.' : 'Start a new cycle.'}</h1><p>Tell us a little about your electronics. We’ll help you connect with a collector.</p></div></div>
    <div className="form-layout"><form className="app-panel pickup-form app-form" onSubmit={submit}><FormError message={error} /><fieldset><legend><span>01</span> Your electronics</legend><div className="form-grid"><Field {...field('category')} label="Item category" as="select" required><option value="">Choose a category</option>{categories.filter(category => options.categories.includes(category.id)).map(category => <option key={category.id} value={category.id}>{category.label}</option>)}</Field><Field {...field('itemName')} label="Item name" placeholder="e.g. Dell laptop and charger" minLength={2} maxLength={120} required /><Field {...field('quantity')} label="Quantity" type="number" min={1} max={999} step={1} required /><Field {...field('condition')} label="Condition" as="select" required><option value="">Choose a condition</option>{options.conditions.map(value => <option key={value} value={value}>{conditionLabels[value]}</option>)}</Field></div><Field {...field('description')} label="Description" as="textarea" rows={4} maxLength={2000} placeholder="Tell the collector about your items, damage, or any handling needs." hint="Please keep contact and address details in their dedicated fields." /></fieldset>
      <fieldset><legend><span>02</span> Collection details</legend><div className="form-grid"><Field {...field('district')} label="District" as="select" required><option value="">Choose your district</option>{options.districts.map(district => <option key={district}>{district}</option>)}</Field><Field {...field('city')} label="City" minLength={2} maxLength={100} placeholder="Your city" required /></div><Field {...field('address')} label="Pickup address" as="textarea" rows={3} minLength={5} maxLength={500} placeholder="House number, street, and useful directions" required hint="Your exact address is shared with your assigned collector after acceptance." /><Field {...field('preferredDate')} label="Preferred pickup date" type="date" min={today()} required hint="Your collector will confirm the date and time before pickup." /></fieldset>
      <fieldset><legend><span>03</span> Add a photo <small>Optional</small></legend><label className="upload-zone" htmlFor="pickup-image"><ImagePlus size={27} strokeWidth={1.5} /><strong>{imageBusy ? 'Reading your photo…' : 'Give your collector a clearer picture'}</strong><span>JPEG, PNG or WebP · Up to 2 MB</span><input id="pickup-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={readImage} disabled={busy || imageBusy} /></label><FormError message={imageError} />{image && <div className="upload-preview"><img src={image} alt="Your electronics" /><button className="link-button" type="button" onClick={() => setImage('')}>Remove photo</button></div>}</fieldset><div className="form-actions"><Link className="button button-outline" to={initial ? `/dashboard/requests/${initial._id}` : '/dashboard/requests'}>Cancel</Link><button className="button" disabled={busy || imageBusy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Submit request'}<ArrowRight size={17} /></button></div>
    </form><aside className="form-aside"><Leaf size={30} strokeWidth={1.3} /><h2>A little preparation.<br />A better pickup.</h2><ul><li>Back up and remove personal data from your devices.</li><li>Group cables and accessories together.</li><li>Mention damaged batteries or items needing special care.</li></ul><p>You can edit or delete this request while it is pending.</p><Link to="/how-it-works#prepare">Read the preparation guide <ArrowRight size={15} /></Link></aside></div>
  </>
}
