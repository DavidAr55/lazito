import { BLOB_PATHS } from './blobPaths'

// Ilustraciones propias en SVG: línea café a mano, manchas orgánicas y formas de sticker.
// Los colores salen de los tokens del tema, así que se adaptan al modo oscuro.
const INK = 'var(--text)'

const STROKE = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' }

export function Blob({ d = BLOB_PATHS.big, fill = 'var(--blush)', className = '' }) {
  return (
    <svg viewBox="0 0 520 520" aria-hidden="true" className={className}>
      <path d={d} fill={fill} />
    </svg>
  )
}

// Regalo con moño. Se puede anidar dentro de otro <svg> (x, y, width, height).
export function GiftBox({ body = 'var(--rose)', lid = 'var(--cream)', ribbon = 'var(--blush)', ...props }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" {...props}>
      <g {...STROKE}>
        <path d="M14 44C13 60 14 76 15 88C15 91 17 92 20 92L80 92C83 92 85 91 85 88C86 76 87 60 86 44Z" fill={body} />
        <path d="M8 30C8 27 10 26 13 26L87 26C90 26 92 27 92 30L92 42C92 45 90 46 87 46L13 46C10 46 8 45 8 42Z" fill={lid} />
        <path d="M44 26L56 26L56 92L44 92Z" fill={ribbon} />
        <path d="M50 26C38 6 20 12 28 24C32 29 44 27 50 26Z" fill={lid} />
        <path d="M50 26C62 6 80 12 72 24C68 29 56 27 50 26Z" fill={lid} />
        <circle cx="50" cy="26" r="4.5" fill={ribbon} />
      </g>
    </svg>
  )
}

export function Heart({ fill = 'var(--rose)', ...props }) {
  return (
    <svg viewBox="-24 -22 48 46" aria-hidden="true" {...props}>
      <path d="M0 -6C-6 -17 -23 -9 -12 6L0 19L12 6C23 -9 6 -17 0 -6Z" fill={fill} {...STROKE} strokeWidth={2.5} />
    </svg>
  )
}

export function Sparkle({ fill = 'var(--cream)', ...props }) {
  return (
    <svg viewBox="-16 -16 32 32" aria-hidden="true" {...props}>
      <path d="M0 -14C2 -4 4 -2 14 0C4 2 2 4 0 14C-2 4 -4 2 -14 0C-4 -2 -2 -4 0 -14Z" fill={fill} {...STROKE} strokeWidth={2.2} />
    </svg>
  )
}

// Lazo suelto de listón
export function Loop({ stroke = 'var(--rose)', ...props }) {
  return (
    <svg viewBox="0 0 160 70" aria-hidden="true" {...props}>
      <path
        d="M6 50C30 10 52 8 56 28C60 50 26 56 30 36C34 14 78 6 100 30C116 46 140 46 154 18"
        fill="none"
        stroke={stroke}
        strokeWidth={5}
        strokeLinecap="round"
      />
    </svg>
  )
}

// Composición principal: mancha grande con una pila de regalos, lazo, corazones y destellos.
export function HeroArt({ className = '' }) {
  return (
    <svg viewBox="0 0 520 520" role="img" aria-label="Pila de regalos con moños" className={className}>
      <path d={BLOB_PATHS.big} fill="var(--blush)" />
      <path d={BLOB_PATHS.side} fill="var(--cream)" opacity="0.9" transform="translate(70 90) scale(0.62)" />
      <Loop x="36" y="360" width="190" height="84" stroke="var(--rose)" />
      <g>
        <GiftBox x="110" y="190" width="250" height="250" body="var(--rose)" lid="var(--cream)" ribbon="var(--blush)" />
        <g transform="rotate(7 390 340)">
          <GiftBox x="300" y="270" width="170" height="170" body="var(--cream)" lid="var(--blush)" ribbon="var(--rose)" />
        </g>
        <g transform="rotate(-9 215 150)">
          <GiftBox x="160" y="95" width="120" height="120" body="var(--blush)" lid="var(--rose)" ribbon="var(--cream)" />
        </g>
      </g>
      <Heart x="360" y="120" width="54" height="52" fill="var(--rose)" />
      <Heart x="86" y="150" width="34" height="33" fill="var(--cream)" />
      <Sparkle x="412" y="196" width="40" height="40" fill="var(--cream)" />
      <Sparkle x="60" y="270" width="30" height="30" fill="var(--rose)" />
      <Sparkle x="300" y="60" width="26" height="26" fill="var(--cream)" />
    </svg>
  )
}

// Fila decorativa de regalitos (pie de página)
export function GiftRow({ className = '' }) {
  const set = [
    ['var(--rose)', 'var(--cream)', 'var(--blush)'],
    ['var(--cream)', 'var(--blush)', 'var(--rose)'],
    ['var(--blush)', 'var(--rose)', 'var(--cream)'],
    ['var(--rose)', 'var(--blush)', 'var(--cream)'],
    ['var(--cream)', 'var(--rose)', 'var(--blush)'],
  ]
  return (
    <div aria-hidden="true" className={`flex items-end justify-center gap-3 ${className}`}>
      {set.map(([body, lid, ribbon], i) => (
        <GiftBox
          key={i}
          body={body}
          lid={lid}
          ribbon={ribbon}
          className={`${i % 2 ? 'size-9 -rotate-6' : 'size-11 rotate-3'}`}
        />
      ))}
    </div>
  )
}
