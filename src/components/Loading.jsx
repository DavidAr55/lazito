import { BLOB_PATHS } from './blobPaths'

// Mancha rosa girando despacio.
export default function Loading() {
  return (
    <div role="status" aria-label="Cargando" className="grid min-h-dvh place-items-center">
      <svg viewBox="0 0 520 520" aria-hidden="true" className="size-20 animate-spin [animation-duration:3s] motion-reduce:animate-pulse">
        <path d={BLOB_PATHS.big} fill="var(--blush)" stroke="var(--rose)" strokeWidth="18" />
      </svg>
    </div>
  )
}
