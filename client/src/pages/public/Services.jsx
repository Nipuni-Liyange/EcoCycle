import { useState } from 'react'
import { ArrowRight, ClipboardList, Search, ShieldCheck, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import SectionTitle from '../../components/SectionTitle'
import SiteImage from '../../components/SiteImage'
import FormInput from '../../components/FormInput'
import CallToAction from '../../components/CallToAction'
import { categories, images } from '../../data/siteContent'

export default function Services() {
  const [query, setQuery] = useState('')
  const filtered = categories.filter(category => `${category.label} ${category.description}`.toLowerCase().includes(query.trim().toLowerCase()))
  return <>
    <PageHeader label="Services" title={<>Less clutter.<br /><em>More circular thinking.</em></>}>From the devices you used every day to the accessories you forgot you owned. Find a more thoughtful next step for your electronics.</PageHeader>
    <section className="section-wrap services-overview"><div className="service-grid">{[[ClipboardList, 'For your home', 'Describe your unwanted electronics and request a collection from your location.'], [Truck, 'For recycling collectors', 'Find suitable requests by category and location, and coordinate collection.'], [ShieldCheck, 'For a clearer process', 'Assigned collectors report each step, from scheduling to recycling.']].map(([Icon, title, text]) => <article className="service-card" key={title}><Icon size={27} aria-hidden="true" /><h2>{title}</h2><p>{text}</p></article>)}</div><p className="notice">Availability depends on participating collectors. Confirm any costs and collection arrangements before pickup.</p></section>
    <section className="section-wrap accepted-guide" aria-labelledby="category-heading"><div className="section-heading"><div><SectionTitle>KNOW YOUR E-WASTE</SectionTitle><h2 id="category-heading">A place for your <em>old tech.</em></h2></div><p>Browse item categories and prepare your items. Final acceptance will be confirmed by the collector.</p></div><div className="category-search"><Search size={21} aria-hidden="true" /><FormInput id="category-search" type="search" label="Search accepted item categories" placeholder="Try phones, batteries, cables…" value={query} onChange={event => setQuery(event.target.value)} /></div><p className="search-count" role="status" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'category' : 'categories'}{query.trim() ? ` matching “${query.trim()}”` : ' to explore'}</p><div className="guide-grid">{filtered.map(({ id, label, icon: Icon, tone, description, preparation }) => <article className="guide-card" id={id} key={id} tabIndex={-1}><span className={`category-icon ${tone}`}><Icon size={26} aria-hidden="true" /></span><h3>{label}</h3><p>{description}</p><div className="preparation-tip"><span>BEFORE COLLECTION</span><p>{preparation}</p></div></article>)}</div>{filtered.length === 0 && <div className="empty-state"><Search size={32} aria-hidden="true" /><h3>No matching category</h3><p>Try a broader item name, or browse all seven categories.</p><button type="button" className="button" onClick={() => setQuery('')}>Clear search</button></div>}</section>
    <section className="collector-feature section-wrap"><SiteImage image={images.collection} sizes="(max-width: 760px) 100vw, 40vw" /><div className="prose"><SectionTitle>FOR COLLECTORS</SectionTitle><h2>Help the next cycle<br /><em>get moving.</em></h2><p>Register as a Recycling Collector to find suitable pickups and coordinate your work. Collectors join directly and are not independently verified by EcoCycle.</p><Link className="text-link" to="/register?role=collector">Explore collector accounts <ArrowRight size={17} aria-hidden="true" /></Link></div></section><CallToAction />
  </>
}
