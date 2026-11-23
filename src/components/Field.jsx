import { useId } from 'react'

export default function Field({ label, hint, error, multiline = false, className = '', ...props }) {
  const id = useId()
  const describedBy = error || hint ? `${id}-msg` : undefined
  const Tag = multiline ? 'textarea' : 'input'
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-[0.9375rem] font-bold">
        {label}
      </label>
      <Tag
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        rows={multiline ? 3 : undefined}
        className={`w-full rounded-2xl border-2 bg-bg px-4 text-base outline-none transition-colors placeholder:text-text-2/70 focus:border-rose focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action ${
          multiline ? 'py-3' : 'h-13'
        } ${error ? 'border-danger' : 'border-separator'}`}
        {...props}
      />
      {(error || hint) && (
        <p id={`${id}-msg`} className={`text-sm ${error ? 'text-danger' : 'text-text-2'}`}>
          {error || hint}
        </p>
      )}
    </div>
  )
}
