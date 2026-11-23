import Avatar from '../../components/Avatar'
import Card from '../../components/Card'
import InvitationCard from './InvitationCard'

export default function WhoAreYou({ group, onPick }) {
  return (
    <>
      <div className="mb-8 lg:hidden">
        <InvitationCard group={group} />
      </div>
      <Card>
        <h2 className="font-hand text-[2.25rem] leading-none font-bold">¿Quién eres?</h2>
        <p className="mt-2 text-text-2">Elige tu nombre para ver a quién le regalas.</p>
        <ul className="mt-4">
          {group.participants.map((p) => (
            <li key={p.id} className="border-b border-separator last:border-b-0">
              <button type="button" onClick={() => onPick(p)} className="flex w-full items-center gap-3 py-3 text-left">
                <Avatar name={p.name} ring={p.claimed ? 'active' : 'seen'} />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{p.name}</span>
                  {p.claimed && <span className="block text-sm text-text-2">Ya entró. Usa tu PIN.</span>}
                </span>
                <span
                  className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                    p.claimed ? 'bg-blush text-text' : 'bg-primary text-on-primary'
                  }`}
                >
                  {p.claimed ? 'Entrar' : 'Soy yo'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}
