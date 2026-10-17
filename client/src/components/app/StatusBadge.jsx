export default function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}><span aria-hidden="true" />{status?.charAt(0).toUpperCase() + status?.slice(1)}</span>
}
