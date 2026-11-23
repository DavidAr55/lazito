import { useState } from 'react'
import { GiftBox } from '../../components/Art'
import Button from '../../components/Button'
import { formatMoney } from '../../lib/format'

export default function ProductCard({ product, added, adding, onAdd }) {
  const [imageFailed, setImageFailed] = useState(false)
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl bg-surface shadow-card ring-1 ring-blush/70">
      <div className="block aspect-square overflow-hidden bg-white">
        {product.imageUrl && !imageFailed ? (
          <img
            src={product.imageUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="size-full object-contain"
          />
        ) : (
          <div className="grid size-full place-items-center bg-blush">
            <GiftBox className="size-1/3 -rotate-3" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-[0.9375rem] leading-snug font-bold [overflow-wrap:anywhere]">{product.title}</h3>
        <p className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-blush px-3 py-0.5 text-[0.9375rem] font-bold">{formatMoney(product.price)}</span>
          <span className="truncate text-sm text-text-2">{product.store}</span>
        </p>
        <div className="mt-auto flex flex-col gap-1 pt-2">
          <Button variant={added ? 'secondary' : 'primary'} disabled={added || adding} onClick={() => onAdd(product)} className="min-h-12">
            {added ? 'Agregado' : adding ? 'Agregando…' : 'Agregar'}
          </Button>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 text-center text-sm font-bold text-action underline underline-offset-4"
          >
            Ver en Google Shopping
          </a>
        </div>
      </div>
    </article>
  )
}
