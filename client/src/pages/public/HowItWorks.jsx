import { Check, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import SiteImage from '../../components/SiteImage'
import SectionTitle from '../../components/SectionTitle'
import Steps from '../../components/Steps'
import Button from '../../components/Button'
import { images } from '../../data/siteContent'

export default function HowItWorks() {
  return <>
    <PageHeader label="How it works" title={<>From your drawer<br /><em>to a better destination.</em></>}>A straightforward collection journey, with a little care at every step. Here is how EcoCycle is designed to work.</PageHeader>
    <section className="journey-section section-wrap"><div><p className="notice">Create a request, connect with a collector, and follow your pickup from your dashboard.</p><Steps detailed /></div><aside className="journey-visual"><SiteImage image={images.collection} priority /><div className="journey-caption"><span className="eyebrow">A CONNECTED APPROACH</span><h2>Good things<br /><em>are on the way.</em></h2><p>People, collectors and responsible recycling, brought a little closer together.</p><small className="image-context">Illustrative collection imagery.</small></div></aside></section>
    <section className="preparation-section section-wrap" id="prepare"><div><SectionTitle>BEFORE THE HANDOFF</SectionTitle><h2>A little preparation.<br /><em>A smoother pickup.</em></h2><p>Once your pickup is confirmed, these details will help your collector plan.</p><Link className="text-link" to="/services">Browse item guidance <ArrowRight size={16} aria-hidden="true" /></Link></div><ul className="checklist">{['List the item names, quantities and condition.', 'Back up your data and follow manufacturer guidance to remove personal information.', 'Remove SIM and memory cards from your devices.', 'Group loose accessories and keep the items accessible.', 'Flag damaged batteries or unusual items so specialist handling can be arranged.', 'Confirm the collection date and any costs before the pickup.'].map(item => <li key={item}><Check size={19} aria-hidden="true" /><span>{item}</span></li>)}</ul></section>
    <section className="status-section section-wrap"><SectionTitle>FOLLOW THE JOURNEY</SectionTitle><h2>Every step, <em>a little clearer.</em></h2><p>Your request will move through these stages as the collector updates its progress.</p><ol className="status-track">{['Pending', 'Accepted', 'Scheduled', 'Collected', 'Recycled'].map((status, index) => <li key={status}><span>{String(index + 1).padStart(2, '0')}</span>{status}</li>)}</ol><p className="muted-note">Open a request in your dashboard to see its latest status and activity timeline.</p><Button to="/register">Create your account</Button></section>
  </>
}
