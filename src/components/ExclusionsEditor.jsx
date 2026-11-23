import { useId, useState } from 'react'
import Button from './Button'

const SELECT =
  'h-13 w-full rounded-2xl border-2 border-separator bg-bg px-4 text-base outline-none transition-colors focus:border-rose focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action'

// Parejas que no deben tocarse. `people` = [{ key, name }]; `pairs` = [[keyA, keyB]].
// `fixedPairs` = regalos decididos a mano [quien regala, quien recibe]; una exclusión no puede contradecirlos.
export default function ExclusionsEditor({ people, pairs, onChange, fixedPairs = [] }) {
  const id = useId()
  const [first, setFirst] = useState('')
  const [second, setSecond] = useState('')
  const [error, setError] = useState('')

  const nameOf = (key) => people.find((p) => p.key === key)?.name ?? ''
  const isSame = (a, b, pair) => (pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a)

  const add = () => {
    if (!first || !second) return setError('Elige a las dos personas.')
    if (first === second) return setError('Elige dos personas distintas.')
    if (pairs.some((pair) => isSame(first, second, pair))) return setError('Esa pareja ya está en la lista.')
    const clash = fixedPairs.find((pair) => isSame(first, second, pair))
    if (clash) return setError(`Ya decidiste que ${nameOf(clash[0])} le regala a ${nameOf(clash[1])}. Quita esa regla primero.`)
    onChange([...pairs, [first, second]])
    setFirst('')
    setSecond('')
    setError('')
  }

  const options = (
    <>
      <option value="">Elige…</option>
      {people.map((p) => (
        <option key={p.key} value={p.key}>
          {p.name}
        </option>
      ))}
    </>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-a`} className="text-[0.9375rem] font-bold">
            Persona
          </label>
          <select id={`${id}-a`} value={first} onChange={(e) => { setFirst(e.target.value); setError('') }} className={SELECT}>
            {options}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-b`} className="text-[0.9375rem] font-bold">
            No se toca con
          </label>
          <select id={`${id}-b`} value={second} onChange={(e) => { setSecond(e.target.value); setError('') }} className={SELECT}>
            {options}
          </select>
        </div>
      </div>
      <Button variant="secondary" onClick={add}>
        Agregar exclusión
      </Button>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {pairs.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {pairs.map((pair) => (
            <li key={pair.join('|')}>
              <button
                type="button"
                aria-label={`Quitar la exclusión de ${nameOf(pair[0])} y ${nameOf(pair[1])}`}
                onClick={() => onChange(pairs.filter((p) => p !== pair))}
                className="min-h-10 rounded-full bg-blush px-4 py-1 text-sm font-bold"
              >
                {nameOf(pair[0])} y {nameOf(pair[1])} ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
