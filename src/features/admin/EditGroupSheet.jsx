import { useState } from 'react'
import Button from '../../components/Button'
import Sheet from '../../components/Sheet'
import StepDetails from '../create/StepDetails'
import StepTheme from '../create/StepTheme'

function Form({ group, onSave }) {
  const [data, setData] = useState({
    name: group.name,
    eventDate: group.eventDate,
    budget: String(group.budget),
    theme: group.theme,
    themeDescription: group.themeDescription,
    categories: group.categories.map((c) => c.label),
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const patch = (p) => {
    setData((d) => ({ ...d, ...p }))
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const message = await onSave(data)
    if (message) {
      setError(message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <StepDetails data={data} onChange={patch} errors={{}} />
      <StepTheme data={data} onChange={patch} errors={{}} />
      <p className="text-sm text-text-2">
        Si quitas una categoría, los productos que ya la usaban se quedan sin categoría.
      </p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" full disabled={busy}>
        {busy ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </form>
  )
}

export default function EditGroupSheet({ group, open, onClose, onSave }) {
  return (
    <Sheet open={open} onClose={onClose} title="Editar intercambio">
      {open && <Form group={group} onSave={onSave} />}
    </Sheet>
  )
}
