export const statusLabels = ['pending', 'accepted', 'scheduled', 'collected', 'recycled']
export function formatDate(value, time = false) {
  if (!value) return 'Not arranged yet'
  const date = new Date(value.length === 10 ? `${value}T12:00:00+05:30` : value)
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', day: 'numeric', month: 'short', year: 'numeric', ...(time ? { hour: '2-digit', minute: '2-digit' } : {}) }).format(date)
}
export function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}
export const conditionLabels = { working: 'Working', 'needs-repair': 'Needs repair', 'not-working': 'Not working' }
