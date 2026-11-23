import { motion } from 'motion/react'
import { Heart, Sparkle } from '../../components/Art'

const COLORS = ['#ffdce8', '#e8a9ae', '#f5ece3', '#bf7e82']

// Piezas lanzadas desde el centro; los ángulos y distancias son fijos para que sea determinista.
const PIECES = Array.from({ length: 26 }, (_, i) => {
  const angle = (i / 26) * Math.PI * 2 + (i % 3) * 0.12
  const dist = 130 + ((i * 53) % 150)
  return { i, x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, r: ((i * 97) % 90) - 45 }
})

export default function Confetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[40%]">
      {PIECES.map(({ i, x, y, r }) => {
        const fill = COLORS[i % COLORS.length]
        const Shape = i % 3 === 0 ? Heart : Sparkle
        return (
          <motion.span
            key={i}
            className="absolute -ml-3 -mt-3 block"
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.4 }}
            animate={{ x, y: y + 50, opacity: 0, rotate: r, scale: 1 }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
          >
            <Shape className={i % 2 ? 'size-5' : 'size-7'} fill={fill} />
          </motion.span>
        )
      })}
    </div>
  )
}
