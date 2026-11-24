import { useState } from 'react'
import Button from '../../components/Button'
import Field from '../../components/Field'

const MAX = 500

// Comentario general de la wishlist. Con `onSave` se edita (es el mío); sin él, se lee (es de quien me toca).
export default function WishlistNote({ note, onSave, name }) {
  const [draft, setDraft] = useState(note)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  if (!onSave) {
    if (!note) return null
    return (
      <div className="mt-5 rounded-2xl bg-cream p-4">
        <h3 className="font-hand text-[1.5rem] leading-none">Lo que {name ?? 'esa persona'} quiere que sepas</h3>
        <p className="mt-2 whitespace-pre-line text-text">{note}</p>
      </div>
    )
  }

  const dirty = draft.trim() !== note.trim()
  const save = async () => {
    setBusy(true)
    setError('')
    try {
      const value = await onSave(draft)
      setDraft(value)
      setSaved(true)
    } catch (e) {
      setError(e.message)
    }
    setBusy(false)
  }

  return (
    <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-cream p-4">
      <h3 className="font-hand text-[1.5rem] leading-none">Comentario general</h3>
      <Field
        label="Algo que ayude a quien te regale"
        multiline
        maxLength={MAX}
        placeholder="Me gustaría que mi pijama sea talla chica"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          setSaved(false)
          setError('')
        }}
        error={error || undefined}
        hint={`Solo lo ve quien te toca. ${draft.length}/${MAX}`}
      />
      <Button variant="secondary" onClick={save} disabled={busy || !dirty}>
        {busy ? 'Guardando…' : saved && !dirty ? 'Guardado' : 'Guardar comentario'}
      </Button>
    </div>
  )
}
