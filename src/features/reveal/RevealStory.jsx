import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import Button from '../../components/Button'
import { GiftBox } from '../../components/Art'
import { formatDate, formatMoney } from '../../lib/format'
import Confetti from './Confetti'

const INTRO_MS = 2800
const HOLD_MS = 1800
const R = 88
const CIRC = 2 * Math.PI * R

// La revelación siempre es cacao: sus componentes usan estos tokens aunque el sistema esté en modo claro.
const COCOA_TOKENS = {
  '--bg': '#573a32',
  '--surface': '#6d4a40',
  '--blush': '#7a4f55',
  '--cream': '#6d4a40',
  '--rose': '#e8a9ae',
  '--text': '#f5ece3',
  '--text-2': '#d9c4b8',
  '--primary': '#f5ece3',
  '--primary-press': '#ffffff',
  '--on-primary': '#573a32',
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Story a pantalla completa en 3 pasos: intro, mantener presionado, resultado.
export default function RevealStory({ group, receiverName, onDone }) {
  const [step, setStep] = useState(0)
  const [holdProgress, setHoldProgress] = useState(0)
  const [holding, setHolding] = useState(false)
  const [reduced] = useState(prefersReducedMotion)

  // Paso 0: avanza solo, o al tocar la pantalla.
  useEffect(() => {
    if (step !== 0) return
    const timer = setTimeout(() => setStep(1), INTRO_MS)
    return () => clearTimeout(timer)
  }, [step])

  // Paso 1: el progreso sube mientras se mantiene presionado y se conserva al soltar.
  useEffect(() => {
    if (step !== 1 || !holding) return
    let last = performance.now()
    let raf
    const tick = (now) => {
      const dt = now - last
      last = now
      let reached = false
      setHoldProgress((p) => {
        const next = Math.min(1, p + dt / HOLD_MS)
        reached = next >= 1
        return next
      })
      if (reached) setStep(2)
      else raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [step, holding])

  const startHold = () => (reduced ? setStep(2) : setHolding(true))
  const stopHold = () => setHolding(false)
  const onKeyDown = (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
      e.preventDefault()
      startHold()
    }
  }
  const onKeyUp = (e) => {
    if (e.key === ' ' || e.key === 'Enter') stopHold()
  }

  return (
    <div style={COCOA_TOKENS} className="fixed inset-0 z-40 flex flex-col bg-[#573a32] text-[#f5ece3]">
      <div className="flex justify-center gap-2 pt-6" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step + 1}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-2.5 rounded-full transition-all duration-500 ${i === step ? 'w-10 bg-[#e8a9ae]' : i < step ? 'w-2.5 bg-[#e8a9ae]' : 'w-2.5 bg-[#f5ece3]/25'}`} />
        ))}
      </div>

      <div
        className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-6 text-center"
        onClick={step === 0 ? () => setStep(1) : undefined}
        aria-live="polite"
      >
        {step === 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-3">
            <GiftBox className="size-36" />
            <p className="font-hand text-3xl text-[#d9c4b8]">Te invitan al intercambio</p>
            <h1 className="font-hand text-[4rem] leading-[0.95] font-bold [overflow-wrap:anywhere] sm:text-[5.5rem]">{group.name}</h1>
            <p className="text-[#d9c4b8]">
              {formatDate(group.eventDate)}. Hasta {formatMoney(group.budget)}. Temática: {group.theme}.
            </p>
          </motion.div>
        )}

        {step === 1 && (
          <>
            <button
              type="button"
              aria-label="Mantén presionado para revelar a quién le regalas"
              onPointerDown={startHold}
              onPointerUp={stopHold}
              onPointerLeave={stopHold}
              onPointerCancel={stopHold}
              onKeyDown={onKeyDown}
              onKeyUp={onKeyUp}
              onContextMenu={(e) => e.preventDefault()}
              className="relative grid size-56 touch-none select-none place-items-center rounded-full outline-offset-8"
            >
              <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
                <circle cx="100" cy="100" r={R} fill="none" stroke="#f5ece3" strokeOpacity="0.18" strokeWidth="7" strokeDasharray="2 12" strokeLinecap="round" />
                <circle
                  cx="100"
                  cy="100"
                  r={R}
                  fill="none"
                  stroke="#e8a9ae"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - holdProgress)}
                />
              </svg>
              <motion.span
                aria-hidden="true"
                animate={holding ? { scale: [1, 1.1, 1], rotate: [0, -6, 6, 0] } : { scale: 1 }}
                transition={holding ? { duration: 0.5, repeat: Infinity } : {}}
              >
                <GiftBox className="size-28" />
              </motion.span>
            </button>
            <p className="font-hand text-3xl">{reduced ? 'Toca para revelar' : 'Mantén presionado para revelar'}</p>
          </>
        )}

        {step === 2 && (
          <>
            <Confetti />
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 160 }}
              className="flex flex-col items-center gap-2"
            >
              <p className="font-hand text-4xl text-[#d9c4b8]">Le regalas a</p>
              <p className="-rotate-2 font-hand text-[5rem] leading-[0.9] font-bold [overflow-wrap:anywhere] sm:text-[7.5rem]">{receiverName}</p>
              <p className="mt-4 text-[#d9c4b8]">
                Temática: {group.theme}. Hasta {formatMoney(group.budget)}.
              </p>
            </motion.div>
            <Button className="mt-4" onClick={onDone}>
              Ir al grupo
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
