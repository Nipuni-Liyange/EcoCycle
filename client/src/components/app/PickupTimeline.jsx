import { formatDate } from '../../lib/format'

export default function PickupTimeline({ events = [] }) {
  if (!events.length) return <p className="muted-copy">No activity has been recorded yet.</p>
  return <ol className="activity-timeline">{[...events].reverse().map((event, index) =>
    <li key={`${event.at}-${index}`}><span className="timeline-dot" /><div>
      <strong>{event.status.charAt(0).toUpperCase() + event.status.slice(1)}</strong>
      {event.at ? <time dateTime={event.at}>{formatDate(event.at, true)} · Sri Lanka time</time> : <p>Date not recorded</p>}
      {event.note && <p>{event.note}</p>}
    </div></li>,
  )}</ol>
}
