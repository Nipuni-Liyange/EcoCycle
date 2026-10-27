import { BatteryCharging, Cable, CircuitBoard, Keyboard, Laptop, PlugZap, Smartphone } from 'lucide-react'

// Only user-supplied assets are used. Source notes are in public/images/README.md.
export const images = {
  hero: { src: '/images/ewaste-hero.webp', small: '/images/ewaste-hero-640.webp', width: 1440, height: 803, alt: 'Discarded laptops, phones, circuit boards and cables at an industrial site' },
  impact: { src: '/images/discarded-electronics.webp', small: '/images/discarded-electronics-640.webp', width: 735, height: 412, alt: 'An overhead view of discarded laptops, screens and electronic components' },
  sorting: { src: '/images/electronics-sorting-team.webp', small: '/images/electronics-sorting-team-640.webp', width: 1100, height: 836, alt: 'Workers wearing gloves and masks sort electronic components on a conveyor' },
  facility: { src: '/images/recycling-facility.webp', width: 510, height: 572, alt: 'Workers sorting laptops and electronic equipment into large containers inside a recycling facility' },
  collection: { src: '/images/electronics-collection-truck.webp', small: '/images/electronics-collection-truck-640.webp', width: 736, height: 736, alt: 'A collection truck loaded with old computers beside electronics collection boxes' },
  overview: { src: '/images/ewaste-overview.webp', width: 735, height: 412, alt: 'An overhead view of discarded laptops, screens and electronic components' },
  batteries: { src: '/images/batteries.webp', width: 1024, height: 576, alt: 'Batteries prepared for electronic waste collection' },
  chargers: { src: '/images/chargers.webp', width: 665, height: 443, alt: 'Chargers and power adapters for electronic devices' },
  accessories: { src: '/images/accessories.webp', width: 1020, height: 650, alt: 'Electronic accessories collected for recycling' },
  cables: { src: '/images/cables.webp', width: 1200, height: 630, alt: 'Cables collected for electronic waste recycling' },
}

export const categories = [
  { id: 'mobile-phones', label: 'Mobile phones', icon: Smartphone, tone: 'mint', image: images.hero, position: '56% 58%', description: 'Smartphones, older handsets and tablets that are ready for their next chapter.', preparation: 'Back up your files, sign out of accounts, follow the manufacturer’s reset instructions and remove SIM and memory cards.' },
  { id: 'laptops', label: 'Laptops', icon: Laptop, tone: 'lime', image: images.impact, position: '54% 40%', description: 'Unused or non-working laptops and their electronic components.', preparation: 'Back up personal files and remove personal information using the manufacturer’s guidance before collection.' },
  { id: 'batteries', label: 'Batteries', icon: BatteryCharging, tone: 'peach', image: images.batteries, description: 'Household and device batteries, subject to collector confirmation.', preparation: 'Describe the battery type and condition. Damaged or swollen batteries need specialist handling; confirm suitable arrangements before any pickup.' },
  { id: 'chargers', label: 'Chargers', icon: PlugZap, tone: 'blue', image: images.chargers, description: 'Phone chargers, laptop adapters and unused power supplies.', preparation: 'Keep adapters together and tell the collector about any visible damage.' },
  { id: 'keyboards', label: 'Accessories', icon: Keyboard, tone: 'yellow', image: images.accessories, description: 'Wired and wireless keyboards, mice and small computer accessories.', preparation: 'Group accessories together and mention whether they contain batteries.' },
  { id: 'cables', label: 'Cables', icon: Cable, tone: 'blue', image: images.cables, description: 'USB leads, charging cables and other unused electronic connections.', preparation: 'Bundle loose cables so they are easier to count and handle.' },
  { id: 'other-electronics', label: 'Other electronic devices', icon: CircuitBoard, tone: 'mint', image: images.impact, position: '15% 55%', description: 'Small electronic devices, circuit boards and computer peripherals.', preparation: 'Include the item name, size and condition so a collector can confirm whether it is suitable.' },
]

export const steps = [
  { number: '01', title: 'Submit Request', description: 'Tell us about your electronics, your location and your preferred collection date.', detail: 'Create a General User account, add your items and include an optional photo. You can edit or delete pending requests.' },
  { number: '02', title: 'Connect with Collector', description: 'A recycling collector can accept a suitable request in your area.', detail: 'Collectors register directly. EcoCycle does not independently verify them. Your exact pickup address is shared with your assigned collector after acceptance.' },
  { number: '03', title: 'Schedule and Track Pickup', description: 'Confirm the date and follow your items through collection and recycling.', detail: 'Your collector confirms the schedule and reports each status update. Discuss any costs and special handling needs before pickup.' },
]

export const faqs = [
  { question: 'Can I book a pickup now?', answer: 'Create a General User account and submit a pickup request from your dashboard. A collector can accept your request and confirm a suitable collection time.' },
  { question: 'Which areas will EcoCycle cover?', answer: 'Collection availability depends on collectors serving your district and city. Submit your location with your request; a pickup is confirmed only when a collector accepts and schedules it.' },
  { question: 'Will there be a collection fee?', answer: 'Pricing has not been announced. Any cost and collection arrangements will need to be confirmed before a pickup is scheduled.' },
  { question: 'What should I do with personal data on my devices?', answer: 'Back up anything you want to keep and use your device manufacturer’s instructions to remove personal information, sign out and reset the device. Remove SIM and memory cards. EcoCycle does not currently offer a certified data-erasure service.' },
  { question: 'Can recycling collectors join?', answer: 'Yes. Register directly as a Recycling Collector to browse and accept suitable pickups. EcoCycle does not independently verify collectors.' },
  { question: 'Are all electronics accepted?', answer: 'The Services page lists the item categories. Final acceptance will depend on the item type, condition and collector capability. Items requiring specialist handling must be discussed before collection.' },
]
