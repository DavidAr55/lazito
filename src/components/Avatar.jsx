// Avatar en forma de mancha orgánica. La forma depende del nombre para que no se vean todos iguales.
const BLOBS = [
  'rounded-[58%_42%_55%_45%/48%_55%_45%_52%]',
  'rounded-[46%_54%_42%_58%/55%_44%_56%_45%]',
  'rounded-[52%_48%_60%_40%/42%_58%_42%_58%]',
]

const SIZES = {
  sm: 'size-12 text-xl',
  md: 'size-20 text-3xl',
  lg: 'size-28 text-5xl',
}

function initials(name) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

function shapeFor(name) {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.codePointAt(0)) % 997
  return BLOBS[hash % BLOBS.length]
}

// ring: 'active' (ya entró: rosa lleno) | 'seen' (todavía no: contorno punteado) | 'none'
export default function Avatar({ name, size = 'sm', ring = 'none', glyph, className = '' }) {
  const style =
    ring === 'active'
      ? 'bg-blush border-2 border-rose text-text'
      : ring === 'seen'
        ? 'border-2 border-dashed border-text-2/50 bg-transparent text-text-2'
        : 'bg-cream text-text'
  return (
    <span
      role="img"
      aria-label={name}
      className={`inline-grid shrink-0 place-items-center font-hand leading-none font-bold ${shapeFor(name)} ${SIZES[size]} ${style} ${className}`}
    >
      <span aria-hidden="true">{glyph ?? initials(name)}</span>
    </span>
  )
}
