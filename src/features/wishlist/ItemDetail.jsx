import { useState } from 'react'
import Button from '../../components/Button'
import Sheet from '../../components/Sheet'
import { formatMoney } from '../../lib/format'

function Detail({ group, item, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const category = group.categories.find((c) => c.id === item.categoryId)

  const remove = async () => {
    setBusy(true)
    await onDelete(item)
  }

  return (
    <div className="flex flex-col gap-3">
      {item.imageUrl && !imageFailed && (
        <img
          src={item.imageUrl}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
          className="max-h-72 w-full rounded-2xl bg-white object-contain"
        />
      )}
      <div>
        <h3 className="font-hand text-[2rem] leading-none font-bold">{item.title}</h3>
        <p className="text-sm text-text-2">
          {[category?.label, item.price != null && formatMoney(item.price)].filter(Boolean).join(' · ')}
        </p>
      </div>
      {item.note && <p className="font-hand text-[1.75rem] leading-tight">{item.note}</p>}
      {item.url && (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-bold text-action underline underline-offset-4">
          Ver el producto
        </a>
      )}
      {onEdit && (
        <div className="mt-2 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => onEdit(item)}>
            Editar
          </Button>
          {confirming ? (
            <Button variant="danger" className="flex-1" onClick={remove} disabled={busy}>
              Sí, quitar
            </Button>
          ) : (
            <Button variant="secondary" className="flex-1" onClick={() => setConfirming(true)}>
              Quitar
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// onEdit y onDelete solo se pasan para items propios.
export default function ItemDetail({ group, item, onClose, onEdit, onDelete }) {
  return (
    <Sheet open={Boolean(item)} onClose={onClose} title="Producto">
      {item && <Detail key={item.id} group={group} item={item} onEdit={onEdit} onDelete={onDelete} />}
    </Sheet>
  )
}
