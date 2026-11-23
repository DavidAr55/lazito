import { Link } from 'react-router'
import { GiftBox } from './Art'

// Marca provisional: moño de regalo + "lazito" en Gaegu (la tipografía del logotipo en el manual).
export default function Logo() {
  return (
    <Link to="/" className="inline-flex items-center gap-2 text-text no-underline" aria-label="Lazito, inicio">
      <GiftBox className="size-9" />
      <span className="font-num text-[2.25rem] leading-none font-bold">lazito</span>
    </Link>
  )
}
