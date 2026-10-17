export default function Field({ label, id, error, hint, as = 'input', children, ...props }) {
  const Control = as
  return <div className={`app-field ${props.className || ''}`}><label htmlFor={id}>{label}{props.required && <span aria-hidden="true"> *</span>}</label><Control {...props} className={undefined} id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}>{children}</Control>{error ? <small className="field-error" id={`${id}-error`}>{error}</small> : hint ? <small id={`${id}-hint`}>{hint}</small> : null}</div>
}
