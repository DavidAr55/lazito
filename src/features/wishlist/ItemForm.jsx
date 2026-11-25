import { useRef, useState } from 'react'
import Button from '../../components/Button'
import Field from '../../components/Field'
import Sheet from '../../components/Sheet'
import { uploadWishlistImage } from '../../lib/api'
import { getClaimToken } from '../../lib/session'
import { formatMoney } from '../../lib/format'

// Valores iniciales: el producto que se edita, o vacíos para uno nuevo.
function initialValues(item) {
  return {
    title: item?.title ?? '',
    categoryId: item?.categoryId ?? '',
    price: item?.price ?? '',
    url: item?.url ?? '',
    imageUrl: item?.imageUrl ?? '',
    note: item?.note ?? '',
  }
}

function Form({ group, item, onSave }) {
  const [values, setValues] = useState(() => initialValues(item))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewFailed, setPreviewFailed] = useState(false)
  const fileInput = useRef(null)

  const upload = async (file) => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const url = await uploadWishlistImage(group.slug, getClaimToken(group.slug), file)
      setPreviewFailed(false)
      setValues((v) => ({ ...v, imageUrl: url }))
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const set = (patch) => {
    setValues((v) => ({ ...v, ...patch }))
    setError('')
  }
  const hasCategories = group.categories.length > 0
  const overBudget = values.price !== '' && Number(values.price) > group.budget

  const submit = async (e) => {
    e.preventDefault()
    if (!values.title.trim()) return setError('Escribe el nombre del producto.')
    setBusy(true)
    const message = await onSave(values)
    if (message) {
      setError(message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <p className="rounded-2xl bg-blush px-4 py-3 text-sm">
        Temática: <span className="font-semibold">{group.theme}</span>. Hasta {formatMoney(group.budget)}.
      </p>
      <Field
        label="Producto"
        placeholder="Pijama de franela"
        value={values.title}
        onChange={(e) => set({ title: e.target.value })}
        autoFocus
      />
      {hasCategories && (
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-2 text-[0.9375rem] font-bold">Categoría (opcional)</legend>
          <div role="radiogroup" className="flex flex-wrap gap-2">
            {group.categories.map((c) => {
              const active = values.categoryId === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => set({ categoryId: active ? '' : c.id })}
                  className={`min-h-10 rounded-full px-4 py-1 text-sm font-bold ${
                    active ? 'bg-primary text-on-primary' : 'bg-blush text-text'
                  }`}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}
      <div className="flex flex-col gap-1.5">
        <Field
          label="Precio aproximado (MXN, opcional)"
          type="number"
          inputMode="numeric"
          min="0"
          placeholder="250"
          value={values.price}
          onChange={(e) => set({ price: e.target.value })}
        />
        {overBudget && (
          <p role="status" className="text-[0.8125rem] text-danger">
            Pasa del tope de {formatMoney(group.budget)}. Puedes agregarlo, pero quizá quien te regala no llegue.
          </p>
        )}
      </div>
      <Field
        label="Enlace (opcional)"
        type="url"
        placeholder="https://"
        value={values.url}
        onChange={(e) => set({ url: e.target.value })}
      />
      <div className="flex flex-col gap-2">
        <span className="text-[0.9375rem] font-bold">Foto (opcional)</span>
        {values.imageUrl && !previewFailed && (
          <img
            src={values.imageUrl}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setPreviewFailed(true)}
            className="max-h-48 w-full rounded-2xl bg-white object-contain"
          />
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => upload(e.target.files?.[0])}
        />
        <Button type="button" variant="secondary" full disabled={uploading} onClick={() => fileInput.current?.click()}>
          {uploading ? 'Subiendo…' : values.imageUrl ? 'Cambiar foto' : 'Subir una foto o captura'}
        </Button>
        <Field
          label="…o pega el enlace de la imagen"
          type="url"
          placeholder="https://"
          value={values.imageUrl}
          onChange={(e) => {
            setPreviewFailed(false)
            set({ imageUrl: e.target.value })
          }}
          error={values.imageUrl && previewFailed ? 'No pudimos mostrar esa imagen. Prueba subiéndola como foto.' : undefined}
        />
      </div>
      <Field
        label="Nota (opcional)"
        multiline
        placeholder="Talla M, por favor"
        maxLength={200}
        value={values.note}
        onChange={(e) => set({ note: e.target.value })}
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" full disabled={busy || uploading}>
        {item ? 'Guardar cambios' : 'Agregar a mi wishlist'}
      </Button>
    </form>
  )
}

export default function ItemForm({ group, item, open, onClose, onSave }) {
  return (
    <Sheet open={open} onClose={onClose} title={item ? 'Editar producto' : 'Agregar a mano'}>
      {open && <Form key={item?.id ?? 'new'} group={group} item={item} onSave={onSave} />}
    </Sheet>
  )
}
