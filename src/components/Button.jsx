const VARIANTS = {
  primary: 'bg-primary text-on-primary hover:bg-primary-press',
  secondary: 'bg-blush text-text hover:bg-blush/70',
  ghost: 'text-action underline-offset-4 hover:underline',
  danger: 'bg-danger-solid text-white hover:bg-danger-solid/90',
}

function Chevron() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5">
      <path d="M7 4l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Button({
  variant = 'primary',
  full = false,
  chevron = false,
  type = 'button',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-13 items-center gap-2 rounded-2xl px-6 text-base font-bold transition-colors disabled:pointer-events-none disabled:opacity-40 ${
        full ? 'w-full' : ''
      } ${chevron ? 'justify-between' : 'justify-center'} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
      {chevron && <Chevron />}
    </button>
  )
}
