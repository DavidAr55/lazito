import { useId, useState } from 'react'
import Button from './Button'

const SELECT =
  'h-13 w-full rounded-2xl border-2 border-separator bg-bg px-4 text-base outline-none transition-colors focus:border-rose focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action'

// Regalos decididos a mano: "quien regala → a quién". `people` = [{ key, name }]; `pairs` = [[giverKey, receiverKey]].
// `exclusions` = pares que no deben tocarse; una regla no puede contradecirlas.
export default function FixedAssignmentsEditor({ people, pairs, onChange, exclusions = [] }) {
  const id = useId()
  const [giver, setGiver] = useState('')
  const [receiver, setReceiver] = useState('')
  const [error, setError] = useState('')

  const nameOf = (key) => people.find((p) => p.key === key)?.name ?? ''

  const add = () => {
    if (!giver || !receiver) return setError('Elige a las dos personas.')
    if (giver === receiver) return setError('Nadie puede regalarse a sí mismo.')
    if (exclusions.some((pair) => pair.includes(giver) && pair.includes(receiver))) {
      return setError(`${nameOf(giver)} y ${nameOf(receiver)} están en la lista de personas que no deben tocarse. Quita esa exclusión primero.`)
    }
    if (pairs.some((pair) => pair[0] === giver)) return setError(`${nameOf(giver)} ya tiene una regla: solo puede regalarle a una persona.`)
    if (pairs.some((pair) => pair[1] === receiver)) return setError(`A ${nameOf(receiver)} ya le regala otra persona: solo una puede regalarle.`)
    onChange([...pairs, [giver, receiver]])
    setGiver('')
    setReceiver('')
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
          <label htmlFor={`${id}-giver`} className="text-[0.9375rem] font-bold">
            Quién regala
          </label>
          <select
            id={`${id}-giver`}
            value={giver}
            onChange={(e) => {
              setGiver(e.target.value)
              setError('')
            }}
            className={SELECT}
          >
            {options}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-receiver`} className="text-[0.9375rem] font-bold">
            A quién le regala
          </label>
          <select
            id={`${id}-receiver`}
            value={receiver}
            onChange={(e) => {
              setReceiver(e.target.value)
              setError('')
            }}
            className={SELECT}
          >
            {options}
          </select>
        </div>
      </div>
      <Button variant="secondary" onClick={add}>
        Agregar regla
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
                aria-label={`Quitar la regla: ${nameOf(pair[0])} le regala a ${nameOf(pair[1])}`}
                onClick={() => onChange(pairs.filter((p) => p !== pair))}
                className="min-h-10 rounded-full bg-blush px-4 py-1 text-sm font-bold"
              >
                {nameOf(pair[0])} → {nameOf(pair[1])} ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
