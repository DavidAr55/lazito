import { Blob, GiftBox, Heart, Sparkle } from '../../components/Art'
import { daysUntil, formatDate, formatMoney } from '../../lib/format'

// Tarjeta de invitación con los datos del intercambio.
export default function InvitationCard({ group, className = '' }) {
  const stats = [
    { value: group.participants.length, label: 'personas' },
    { value: formatMoney(group.budget), label: 'tope' },
    { value: daysUntil(group.eventDate), label: 'días' },
  ]
  return (
    <section
      aria-label="Datos del intercambio"
      className={`relative rounded-[28px] bg-cream p-6 shadow-card ring-1 ring-separator sm:p-8 ${className}`}
    >
      <Heart className="absolute -top-5 right-8 size-12 rotate-12" />
      <Sparkle className="absolute -bottom-3 left-6 size-9" fill="var(--blush)" />
      <p className="font-hand text-2xl text-text-2">Te invitan al intercambio</p>
      <h1 className="mt-1 font-hand text-[3rem] leading-[0.95] font-bold [overflow-wrap:anywhere] sm:text-[3.5rem]">{group.name}</h1>
      <p className="mt-4 font-hand text-[1.75rem] leading-none">
        Temática: <strong>{group.theme}</strong>
      </p>
      {group.themeDescription && <p className="mt-2 text-text-2">{group.themeDescription}</p>}
      <p className="mt-1 text-text-2">{formatDate(group.eventDate)}</p>
      <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
        {stats.map(({ value, label }) => (
          <div key={label} className="flex flex-col-reverse rounded-2xl bg-blush px-2 py-3">
            <dt className="text-sm text-text-2">{label}</dt>
            <dd className="font-hand text-[1.75rem] leading-none font-bold">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

// Versión para la columna derecha: la tarjeta sobre una mancha con un regalo asomándose.
export function InvitationArt({ group }) {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <Blob className="w-full" />
      <div className="absolute inset-0 grid place-items-center px-[9%]">
        <InvitationCard group={group} className="w-full lg:-rotate-2" />
      </div>
      <GiftBox className="absolute -right-2 bottom-4 size-32 rotate-6" />
    </div>
  )
}
