import { useState } from 'react'
import Button from '../../components/Button'
import Field from '../../components/Field'
import Sheet from '../../components/Sheet'

function PinForm({ mode, name, onSubmit }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const creating = mode === 'create'

  const submit = async (e) => {
    e.preventDefault()
    if (!/^\d{4}$/.test(pin)) return setError('El PIN son 4 números.')
    setBusy(true)
    const err = await onSubmit(pin)
    if (err) {
      setError(err)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-sm text-text-2">
        {creating
          ? `Hola, ${name}. Con este PIN podrás volver a ver tu resultado desde otro dispositivo.`
          : `${name}, escribe tu PIN para volver a entrar.`}
      </p>
      <Field
        label="PIN de 4 números"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={pin}
        onChange={(e) => {
          setPin(e.target.value.replace(/\D/g, ''))
          setError('')
        }}
        hint={creating ? 'Anótalo: no se puede recuperar.' : undefined}
        error={error}
        autoFocus
      />
      <Button type="submit" full disabled={busy}>
        {creating ? 'Crear PIN y ver mi resultado' : 'Entrar'}
      </Button>
    </form>
  )
}

export default function PinSheet({ participant, mode, onClose, onSubmit }) {
  return (
    <Sheet open={Boolean(participant)} onClose={onClose} title={mode === 'create' ? 'Crea tu PIN' : 'Entra con tu PIN'}>
      {participant && <PinForm key={participant.id} mode={mode} name={participant.name} onSubmit={onSubmit} />}
    </Sheet>
  )
}
