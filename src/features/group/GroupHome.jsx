import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import Avatar from '../../components/Avatar'
import Button from '../../components/Button'
import {
  addWishlistItem,
  deleteWishlistItem,
  getMyWishlist,
  getReceiverWishlist,
  saveWishlistNote,
  updateWishlistItem,
} from '../../lib/api'
import { formatMoney } from '../../lib/format'
import { getClaimToken } from '../../lib/session'
import ItemDetail from '../wishlist/ItemDetail'
import ItemForm from '../wishlist/ItemForm'
import WishlistGrid from '../wishlist/WishlistGrid'
import WishlistNote from '../wishlist/WishlistNote'
import InvitationCard from './InvitationCard'

function Tab({ active, onClick, children }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`min-h-11 flex-1 truncate rounded-full px-5 font-bold transition-colors ${
        active ? 'bg-surface text-text shadow-card' : 'text-text-2'
      }`}
    >
      {children}
    </button>
  )
}

export default function GroupHome({ group, me, receiver, onShowReveal }) {
  const token = getClaimToken(group.slug)
  const [tab, setTab] = useState('mine')
  const [mine, setMine] = useState(null)
  const [mineNote, setMineNote] = useState(null)
  const [theirs, setTheirs] = useState(null)
  const [theirsNote, setTheirsNote] = useState('')
  const [loadError, setLoadError] = useState('')
  const [viewing, setViewing] = useState(null) // item abierto en el detalle
  const [form, setForm] = useState({ open: false, item: null })

  useEffect(() => {
    let alive = true
    getMyWishlist(group.slug, token)
      .then(({ items, note }) => {
        if (!alive) return
        setMine(items)
        setMineNote(note)
      })
      .catch((e) => alive && setLoadError(e.message))
    return () => {
      alive = false
    }
  }, [group.slug, token])

  useEffect(() => {
    if (!receiver) return
    let alive = true
    getReceiverWishlist(group.slug, token)
      .then(({ items, note }) => {
        if (!alive) return
        setTheirs(items)
        setTheirsNote(note)
      })
      .catch((e) => alive && setLoadError(e.message))
    return () => {
      alive = false
    }
  }, [group.slug, token, receiver])

  const save = async (values) => {
    try {
      if (form.item) {
        const updated = await updateWishlistItem(group.slug, token, form.item.id, values)
        setMine((items) => items.map((i) => (i.id === updated.id ? updated : i)))
      } else {
        const created = await addWishlistItem(group.slug, token, values)
        setMine((items) => [...items, created])
      }
      setForm({ open: false, item: null })
      return null
    } catch (e) {
      return e.message
    }
  }

  const remove = async (item) => {
    await deleteWishlistItem(group.slug, token, item.id)
    setMine((items) => items.filter((i) => i.id !== item.id))
    setViewing(null)
  }

  const receiverFirstName = receiver?.name.split(' ')[0]
  const showingMine = tab === 'mine'
  const items = showingMine ? mine : theirs
  const isMine = (item) => mine?.some((i) => i.id === item.id)

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start lg:gap-x-14">
      <div className="flex flex-col gap-6 lg:col-start-1 lg:row-start-1">
        <InvitationCard group={group} />
        <Button full chevron onClick={onShowReveal}>
          Ver a quién le regalo
        </Button>
      </div>

      <section className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <div role="tablist" className="flex gap-1 rounded-full bg-blush p-1">
          <Tab active={showingMine} onClick={() => setTab('mine')}>
            Mi wishlist
          </Tab>
          <Tab active={!showingMine} onClick={() => setTab('theirs')}>
            {receiverFirstName ? `Wishlist de ${receiverFirstName}` : 'Su wishlist'}
          </Tab>
        </div>

        {showingMine && mineNote !== null && (
          <WishlistNote
            note={mineNote}
            onSave={async (value) => {
              const saved = await saveWishlistNote(group.slug, token, value)
              setMineNote(saved)
              return saved
            }}
          />
        )}
        {!showingMine && <WishlistNote note={theirsNote} name={receiverFirstName} />}

        {loadError && (
          <p role="alert" className="mt-4 text-danger">
            {loadError}
          </p>
        )}

        {items && items.length === 0 && (
          <div className="mt-10 flex flex-col items-center gap-4 text-center">
            <p className="max-w-sm font-hand text-[1.75rem] leading-tight">
              {showingMine
                ? `Agrega lo que te gustaría recibir. Que sea de ${group.theme} y no pase de ${formatMoney(group.budget)}.`
                : `${receiverFirstName ?? 'Esa persona'} todavía no agrega nada. Vuelve más tarde.`}
            </p>
            {showingMine && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  to={`/g/${group.slug}/buscar`}
                  className="inline-flex min-h-13 items-center justify-center rounded-2xl bg-primary px-6 font-bold text-on-primary hover:bg-primary-press"
                >
                  Buscar productos
                </Link>
                <Button variant="secondary" onClick={() => setForm({ open: true, item: null })}>
                  Agregar a mano
                </Button>
              </div>
            )}
          </div>
        )}
        {showingMine && items && items.length > 0 && (
          <Button variant="secondary" className="mt-5 w-full sm:w-auto" onClick={() => setForm({ open: true, item: null })}>
            Agregar a mano
          </Button>
        )}
        {items && items.length > 0 && (
          <div className="mt-6">
            <WishlistGrid
              items={items}
              onOpen={setViewing}
              searchPath={showingMine ? `/g/${group.slug}/buscar` : undefined}
            />
          </div>
        )}
      </section>

      <div className="lg:col-start-1 lg:row-start-2">
        <h2 className="font-hand text-[1.75rem] leading-none font-bold">En el intercambio</h2>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-3">
          {group.participants.map((p) => (
            <li key={p.id} className="flex w-16 flex-col items-center gap-1">
              <Avatar name={p.name} ring={p.claimed ? 'active' : 'seen'} />
              <span className="max-w-full truncate text-sm">{p.id === me.id ? 'Tú' : p.name.split(' ')[0]}</span>
            </li>
          ))}
        </ul>
      </div>

      <ItemDetail
        group={group}
        item={viewing}
        onClose={() => setViewing(null)}
        onEdit={
          viewing && isMine(viewing)
            ? (item) => {
                setViewing(null)
                setForm({ open: true, item })
              }
            : undefined
        }
        onDelete={remove}
      />
      <ItemForm
        group={group}
        item={form.item}
        open={form.open}
        onClose={() => setForm({ open: false, item: null })}
        onSave={save}
      />
    </div>
  )
}
