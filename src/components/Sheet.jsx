import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useDragControls } from 'motion/react'

// Distancia (px) o velocidad (px/s) hacia abajo a partir de la cual soltar cierra la hoja.
const CLOSE_DISTANCE = 110
const CLOSE_VELOCITY = 600

// En escritorio la hoja es un cuadro centrado y no se arrastra.
const isDesktop = () => window.matchMedia('(min-width: 640px)').matches

export default function Sheet({ open, onClose, title, children }) {
  const panel = useRef(null)
  const dragControls = useDragControls()

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    const prev = document.activeElement
    document.addEventListener('keydown', onKey)
    panel.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [open, onClose])

  // El arrastre solo empieza desde la manija y el título: el resto del contenido se desplaza y se edita con normalidad.
  const startDrag = (event) => {
    if (!isDesktop()) dragControls.start(event)
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-[#2b1d19]/60"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-[28px] bg-bg px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] shadow-card outline-none sm:rounded-[28px]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 380 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            dragSnapToOrigin
            onDragEnd={(_, info) => {
              if (info.offset.y > CLOSE_DISTANCE || info.velocity.y > CLOSE_VELOCITY) onClose()
            }}
          >
            <div data-sheet-handle onPointerDown={startDrag} className="-mx-6 touch-none px-6 pb-1 sm:touch-auto">
              <div className="mx-auto h-1.5 w-12 rounded-full bg-blush mt-3 sm:hidden" />
              <h2 className="mt-4 mb-4 font-hand text-[2rem] leading-none font-bold">{title}</h2>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
