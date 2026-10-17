import { ArrowRight, MessageCircle, PackageSearch } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import SectionTitle from '../../components/SectionTitle'
import FaqList from '../../components/FaqList'

export default function Contact() {
  return <>
    <PageHeader label="Contact" title={<>A few questions?<br /><em>Let’s make things clearer.</em></>}>Start with the practical details: what belongs in the collection, how it will work, and what to expect.</PageHeader>
    <section className="contact-section section-wrap"><aside className="contact-card"><MessageCircle size={32} strokeWidth={1.5} aria-hidden="true" /><h2>Good conversations<br />start with clarity.</h2><p>Our support channel is not open yet. Official contact details will be published here when the service launches.</p><p className="muted-note">No messages or personal details are collected on this page.</p><div className="contact-item-help"><PackageSearch size={24} aria-hidden="true" /><h3>Wondering about an item?</h3><p>Explore the categories and preparation guidance.</p><Link className="text-link" to="/services">Find your electronics <ArrowRight size={16} aria-hidden="true" /></Link></div></aside><div><SectionTitle>COMMON QUESTIONS</SectionTitle><h2 className="faq-heading">A little less <em>uncertainty.</em></h2><FaqList /></div></section>
  </>
}
