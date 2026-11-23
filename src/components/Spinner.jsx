import { BLOB_PATHS } from './blobPaths'

// Mancha girando; hereda el color del texto. Se oculta a lectores de pantalla: el texto de al lado dice qué pasa.
export default function Spinner({ className = 'size-5' }) {
  return (
    <svg viewBox="0 0 520 520" aria-hidden="true" className={`${className} animate-spin [animation-duration:1.4s] motion-reduce:animate-pulse`}>
      <path d={BLOB_PATHS.big} fill="none" stroke="currentColor" strokeWidth="70" strokeDasharray="900 700" strokeLinecap="round" />
    </svg>
  )
}
