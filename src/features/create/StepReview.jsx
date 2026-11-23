import { formatDate, formatMoney } from '../../lib/format'

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 border-b border-separator py-3">
      <dt className="text-text-2">{label}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  )
}

export default function StepReview({ data, error }) {
  return (
    <div className="flex flex-col gap-4">
      <dl>
        <Row label="Intercambio">{data.name}</Row>
        <Row label="Fecha">{formatDate(data.eventDate)}</Row>
        <Row label="Presupuesto">{formatMoney(Number(data.budget))}</Row>
        <Row label="Temática">{data.theme}</Row>
        {data.categories.length > 0 && <Row label="Categorías">{data.categories.join(', ')}</Row>}
        <Row label="Participantes">{data.people.length}</Row>
        {data.fixedAssignments.length > 0 && (
          <Row label="Regalos fijos">
            {data.fixedAssignments.map(([giver, receiver]) => `${giver} → ${receiver}`).join(', ')}
          </Row>
        )}
        {data.exclusions.length > 0 && (
          <Row label="No se tocan">
            {data.exclusions.map(([a, b]) => `${a} y ${b}`).join(', ')}
          </Row>
        )}
      </dl>
      <p className="text-sm text-text-2">
        El sorteo es secreto. Nadie, tampoco tú, verá quién le regala a quién hasta abrir su propio enlace.
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}
