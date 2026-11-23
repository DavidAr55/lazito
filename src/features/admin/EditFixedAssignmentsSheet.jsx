import { useState } from 'react'
import Button from '../../components/Button'
import FixedAssignmentsEditor from '../../components/FixedAssignmentsEditor'
import Sheet from '../../components/Sheet'

function Form({ group, onSave }) {
  const [pairs, setPairs] = useState(group.fixedAssignments)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    const message = await onSave(pairs)
    if (message) {
      setError(message)
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-text-2">
        Decide a mano quién le regala a quién. Solo tú ves estas reglas; el resto del sorteo se hace al azar y al guardar se vuelve a sortear.
      </p>
      <FixedAssignmentsEditor
        people={group.participants.map((p) => ({ key: p.id, name: p.name }))}
        pairs={pairs}
        exclusions={group.exclusions}
        onChange={(next) => {
          setPairs(next)
          setError('')
        }}
      />
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <Button full onClick={submit} disabled={busy}>
        {busy ? 'Guardando…' : 'Guardar y volver a sortear'}
      </Button>
    </div>
  )
}

export default function EditFixedAssignmentsSheet({ group, open, onClose, onSave }) {
  return (
    <Sheet open={open} onClose={onClose} title="Regalos decididos a mano">
      {open && <Form group={group} onSave={onSave} />}
    </Sheet>
  )
}
