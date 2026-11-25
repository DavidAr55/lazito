import { useState } from 'react'
import { Link } from 'react-router'
import { GiftBox } from '../../components/Art'
import { formatMoney } from '../../lib/format'

const GIFT_COLORS = [
  ['var(--rose)', 'var(--cream)', 'var(--blush)'],
  ['var(--cream)', 'var(--blush)', 'var(--rose)'],
  ['var(--blush)', 'var(--rose)', 'var(--cream)'],
]

function Tile({ item, index, onOpen }) {
  const [imageFailed, setImageFailed] = useState(false)
  const [body, lid, ribbon] = GIFT_COLORS[index % GIFT_COLORS.length]
  const showImage = item.imageUrl && !imageFailed

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="flex w-full flex-col overflow-hidden rounded-3xl bg-surface text-left shadow-card ring-1 ring-blush/70 transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <span className="relative block aspect-square bg-white">
        {showImage ? (
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="size-full object-contain"
          />
        ) : (
          <span className="grid size-full place-items-center">
            <GiftBox body={body} lid={lid} ribbon={ribbon} className="size-1/2 -rotate-3" />
          </span>
        )}
      </span>
      <span className="flex items-start justify-between gap-2 p-3.5">
        <span className="line-clamp-2 font-bold">{item.title}</span>
        {item.price != null && (
          <span className="shrink-0 rounded-full bg-blush px-2.5 py-0.5 text-sm font-bold">{formatMoney(item.price)}</span>
        )}
      </span>
    </button>
  )
}

// Cuadrícula de productos; si se pasa `searchPath`, el último cuadro "+" lleva al buscador de productos.
export default function WishlistGrid({ items, onOpen, searchPath }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {items.map((item, index) => (
        <li key={item.id}>
          <Tile item={item} index={index} onOpen={onOpen} />
        </li>
      ))}
      {searchPath && (
        <li>
          <Link
            to={searchPath}
            className="grid h-full min-h-48 w-full place-items-center rounded-3xl border-2 border-dashed border-rose/70 p-4 text-center"
          >
            <span>
              <span aria-hidden="true" className="block font-hand text-5xl leading-none text-rose">
                +
              </span>
              <span className="mt-1 block font-bold">Buscar productos</span>
            </span>
          </Link>
        </li>
      )}
    </ul>
  )
}
