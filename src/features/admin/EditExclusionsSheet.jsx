import { useState } from 'react'
import Button from '../../components/Button'
import ExclusionsEditor from '../../components/ExclusionsEditor'
import Sheet from '../../components/Sheet'

function Form({ group, onSave }) {
  const [pairs, setPairs] = useState(group.exclusions)
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
      <p className="text-text-2">Esas personas nunca se regalarán entre sí. Al guardar se vuelve a sortear.</p>
      <ExclusionsEditor
        people={group.participants.map((p) => ({ key: p.id, name: p.name }))}
        pairs={pairs}
        fixedPairs={group.fixedAssignments}
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

export default function EditExclusionsSheet({ group, open, onClose, onSave }) {
  return (
    <Sheet open={open} onClose={onClose} title="Quién no debe tocarse">
      {open && <Form group={group} onSave={onSave} />}
    </Sheet>
  )
}
