export default function SectionTitle({ number, children, light = false }) {
  return <div className={`section-kicker${light ? ' light-kicker' : ''}`}>{number && <span>{number}</span>}<span className="kicker-rule" aria-hidden="true" />{children}</div>
}
