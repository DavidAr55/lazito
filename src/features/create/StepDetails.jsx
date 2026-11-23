import Field from '../../components/Field'

export default function StepDetails({ data, onChange, errors }) {
  return (
    <div className="flex flex-col gap-4">
      <Field
        label="Nombre del intercambio"
        placeholder="Navidad oficina"
        value={data.name}
        onChange={(e) => onChange({ name: e.target.value })}
        error={errors.name}
        autoFocus
      />
      <Field
        label="Fecha del intercambio"
        type="date"
        value={data.eventDate}
        onChange={(e) => onChange({ eventDate: e.target.value })}
        error={errors.eventDate}
      />
      <Field
        label="Presupuesto por regalo (MXN)"
        type="number"
        inputMode="numeric"
        min="1"
        placeholder="300"
        value={data.budget}
        onChange={(e) => onChange({ budget: e.target.value })}
        error={errors.budget}
      />
    </div>
  )
}
