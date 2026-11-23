import { useState } from 'react'
import Avatar from '../../components/Avatar'
import Button from '../../components/Button'
import ExclusionsEditor from '../../components/ExclusionsEditor'
import FixedAssignmentsEditor from '../../components/FixedAssignmentsEditor'
import Field from '../../components/Field'

export default function StepPeople({ data, onChange, errors, error }) {
  const [draft, setDraft] = useState('')
  const [dupe, setDupe] = useState(false)

  const add = () => {
    const name = draft.trim()
    if (!name) return
    if (data.people.some((p) => p.toLowerCase() === name.toLowerCase())) {
      setDupe(true)
      return
    }
    setDupe(false)
    onChange({ people: [...data.people, name] })
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-2">
        <Field
          className="flex-1"
          label="Nombre"
          placeholder="Ana López"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            setDupe(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          error={dupe ? 'Ese nombre ya está en la lista. Agrega un apellido para distinguirlos.' : undefined}
          autoFocus
        />
        {!dupe && (
          <Button onClick={add} disabled={!draft.trim()} className="mb-0 shrink-0">
            Agregar
          </Button>
        )}
      </div>
      {dupe && (
        <Button variant="secondary" onClick={() => setDupe(false)}>
          Entendido
        </Button>
      )}
      {errors.people && <p className="text-[0.8125rem] text-danger">{errors.people}</p>}
      {error && (
        <p role="alert" className="rounded-2xl bg-blush px-4 py-3 text-sm font-bold text-danger">
          {error}
        </p>
      )}
      {data.people.length === 0 ? (
        <p className="text-sm text-text-2">Agrega a todos los que participan, incluyéndote.</p>
      ) : (
        <ul className="flex flex-col">
          {data.people.map((p) => (
            <li key={p} className="flex items-center gap-3 border-b border-separator py-2">
              <Avatar name={p} />
              <span className="flex-1 truncate font-semibold">{p}</span>
              <button
                type="button"
                aria-label={`Quitar a ${p}`}
                onClick={() =>
                  onChange({
                    people: data.people.filter((x) => x !== p),
                    exclusions: data.exclusions.filter((pair) => !pair.includes(p)),
                    fixedAssignments: data.fixedAssignments.filter((pair) => !pair.includes(p)),
                  })
                }
                className="min-h-11 px-2 text-sm text-text-2"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
      {data.people.length >= 4 && (
        <div className="mt-2 flex flex-col gap-3 rounded-2xl bg-cream p-4">
          <h3 className="font-hand text-[1.5rem] leading-none">¿Alguien no debe tocarse?</h3>
          <p className="text-sm text-text-2">Por ejemplo, una pareja. Esas personas nunca se regalarán entre sí.</p>
          <ExclusionsEditor
            people={data.people.map((name) => ({ key: name, name }))}
            pairs={data.exclusions}
            fixedPairs={data.fixedAssignments}
            onChange={(exclusions) => onChange({ exclusions })}
          />
        </div>
      )}
      {data.people.length >= 3 && (
        <div className="flex flex-col gap-3 rounded-2xl bg-cream p-4">
          <h3 className="font-hand text-[1.5rem] leading-none">¿Quieres decidir un regalo a mano?</h3>
          <p className="text-sm text-text-2">
            Por ejemplo, que a José le toque Ana. El resto del sorteo se hace al azar alrededor de esa regla, y los demás verán su resultado
            como siempre.
          </p>
          <FixedAssignmentsEditor
            people={data.people.map((name) => ({ key: name, name }))}
            pairs={data.fixedAssignments}
            exclusions={data.exclusions}
            onChange={(fixedAssignments) => onChange({ fixedAssignments })}
          />
        </div>
      )}
    </div>
  )
}
