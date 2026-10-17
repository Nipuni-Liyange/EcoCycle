import { ArrowDown, ArrowRight, Check, Leaf, Recycle } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'
import CallToAction from '../../components/CallToAction'
import EWasteCard from '../../components/EWasteCard'
import SectionTitle from '../../components/SectionTitle'
import SiteImage from '../../components/SiteImage'
import Steps from '../../components/Steps'
import { categories, images } from '../../data/siteContent'

export default function Home() {
  return <div className="compact-home">
    <section className="hero-section" id="home">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-line" />A cleaner cycle starts here</div>
        <h1>Recycle your<br className="mobile-line-break" /> e-waste.<br /><span>Protect our planet.</span></h1>
        <p className="hero-description">Old tech deserves a better ending. A simpler way to connect with recycling collectors, clear your space, and give valuable materials a new beginning.</p>
        <div className="hero-actions"><Button to="/register?intent=pickup">Schedule a Pickup</Button><Link className="text-link" to="/about">Discover EcoCycle <ArrowDown size={16} aria-hidden="true" /></Link></div>
        <div className="hero-proof"><div className="proof-icons" aria-hidden="true"><span><Leaf size={15} /></span><span><Recycle size={15} /></span><span><Check size={15} /></span></div><p><strong>A thoughtful next step</strong><br />for the tech you no longer need</p></div>
      </div>
      <div className="hero-visual"><SiteImage image={images.hero} priority sizes="(max-width: 760px) 100vw, 48vw" /><div className="image-caption"><span className="caption-icon"><Leaf size={21} aria-hidden="true" /></span><span><strong>Make room for better.</strong><small>Old electronics. New possibilities.</small></span></div><div className="visual-index"><span>01</span> / A NEW CYCLE</div></div>
      <a className="scroll-cue" href="#how-it-works"><span />Scroll to explore</a>
    </section>
    <section className="process-section" id="how-it-works"><div className="section-wrap process-inner"><SectionTitle number="01" light>A BETTER WAY FORWARD</SectionTitle><div className="process-heading"><h2>Good things happen<br />when we <em>pass it on.</em></h2><p>Three simple steps. One better destination for the devices you no longer use.</p></div><Steps /><Link className="text-link light-link" to="/how-it-works">Explore the collection journey <ArrowRight size={17} aria-hidden="true" /></Link></div></section>
    <section className="accepted-section section-wrap" id="accepted"><div className="accepted-heading"><div><SectionTitle number="02">GIVE TECH ANOTHER CHANCE</SectionTitle><h2>What can we <em>collect?</em></h2></div><p>Everyday devices, forgotten accessories, and the tech tucked away in your drawers. Find a responsible next step for your old tech.</p></div><div className="category-grid">{categories.filter(category => category.id !== 'other-electronics').map(category => <EWasteCard key={category.id} category={category} />)}</div><p className="category-note">Item acceptance and local availability will be confirmed by a collector before scheduling.</p></section>
    <CallToAction />
  </div>
}
