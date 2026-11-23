import { GiftBox } from './Art'

// Progreso del asistente: una fila de regalitos sobre una barra que se llena.
export default function GiftProgress({ count, current, className = '' }) {
  return (
    <div
      role="progressbar"
      aria-label="Progreso"
      aria-valuemin={1}
      aria-valuemax={count}
      aria-valuenow={current + 1}
      className={className}
    >
      <div className="grid" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
        {Array.from({ length: count }, (_, i) => {
          const done = i <= current
          return (
            <GiftBox
              key={i}
              body={done ? 'var(--rose)' : 'var(--cream)'}
              lid={done ? 'var(--cream)' : 'var(--blush)'}
              ribbon={done ? 'var(--blush)' : 'var(--cream)'}
              className={`mx-auto size-10 origin-bottom transition-transform duration-500 motion-reduce:transition-none ${
                i === current ? 'scale-110' : done ? '' : 'opacity-70'
              }`}
            />
          )
        })}
      </div>
      <div className="relative mt-1 h-2.5 rounded-full bg-blush">
        <div
          className="h-full rounded-full bg-rose transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${((current + 0.5) / count) * 100}%` }}
        />
      </div>
    </div>
  )
}
