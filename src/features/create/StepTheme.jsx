import { useState } from 'react'
import Button from '../../components/Button'
import Field from '../../components/Field'

export default function StepTheme({ data, onChange, errors }) {
  const [draft, setDraft] = useState('')

  const addCategory = () => {
    const label = draft.trim()
    if (!label) return
    if (!data.categories.some((c) => c.toLowerCase() === label.toLowerCase())) {
      onChange({ categories: [...data.categories, label] })
    }
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-4">
      <Field
        label="Temática"
        placeholder="Pijamas"
        value={data.theme}
        onChange={(e) => onChange({ theme: e.target.value })}
        error={errors.theme}
        autoFocus
      />
      <Field
        label="Detalles (opcional)"
        multiline
        placeholder="Afelpadas, de preferencia. Talla real."
        value={data.themeDescription}
        onChange={(e) => onChange({ themeDescription: e.target.value })}
      />
      <div className="flex flex-col gap-2">
        <div className="flex items-end gap-2">
          <Field
            className="flex-1"
            label="Categorías (opcional)"
            placeholder="Pantuflas"
            hint="Sirven como atajos de búsqueda y etiquetas para ordenar la wishlist. Nadie está obligado a elegir una."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCategory()
              }
            }}
          />
        </div>
        <Button variant="secondary" onClick={addCategory} disabled={!draft.trim()}>
          Agregar categoría
        </Button>
        {data.categories.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {data.categories.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  aria-label={`Quitar ${c}`}
                  onClick={() => onChange({ categories: data.categories.filter((x) => x !== c) })}
                  className="min-h-10 rounded-full bg-blush px-4 py-1 text-sm font-bold"
                >
                  {c} ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
