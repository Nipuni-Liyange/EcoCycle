import { useEffect, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { FormError } from './Feedback'

export default function ConfirmDialog({ open, onClose, onConfirm, busy, error, title, children, action = 'Delete request' }) {
  const dialog = useRef(null)
  useEffect(() => {
    const element = dialog.current
    if (open && !element.open) element.showModal()
    if (!open && element.open) element.close()
  }, [open])
  return <dialog ref={dialog} className="confirm-dialog" aria-labelledby="dialog-title" onCancel={event => { event.preventDefault(); if (!busy) onClose() }}><button className="dialog-close" aria-label="Close confirmation" onClick={onClose} disabled={busy}><X size={20} /></button><span className="dialog-icon"><AlertTriangle size={27} /></span><h2 id="dialog-title">{title}</h2><p>{children}</p><FormError message={error} /><div className="form-actions"><button type="button" className="button button-outline" autoFocus onClick={onClose} disabled={busy}>Keep request</button><button type="button" className="button button-danger" onClick={onConfirm} disabled={busy}>{busy ? 'Deleting…' : action}</button></div></dialog>
}
