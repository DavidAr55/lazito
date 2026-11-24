import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import Button from '../../components/Button'
import Card from '../../components/Card'
import ErrorState from '../../components/ErrorState'
import Loading from '../../components/Loading'
import Page from '../../components/Page'
import Spinner from '../../components/Spinner'
import { addWishlistItem, getGroupPublic, getMe, getMyWishlist, searchProducts } from '../../lib/api'
import { formatMoney } from '../../lib/format'
import { getClaimToken } from '../../lib/session'
import useDocumentTitle from '../../lib/useDocumentTitle'
import ProductCard from './ProductCard'
import ProductSkeleton from './ProductSkeleton'

const DEFAULT_IDEAS = ['Pijama', 'Pantuflas', 'Calcetines', 'Libro', 'Taza']

const AUDIENCES = [
  { value: '', label: 'Todos' },
  { value: 'hombre', label: 'Hombre' },
  { value: 'mujer', label: 'Mujer' },
  { value: 'ninos', label: 'Niños' },
]

// Filtros que valen para esta búsqueda. "Hasta" arranca en el tope que definió quien creó el grupo.
const toNumber = (text) => {
  const value = Number.parseInt(String(text).replace(/\D/g, ''), 10)
  return Number.isFinite(value) && value > 0 ? value : undefined
}

function describeFilters({ audience, min, max }) {
  const parts = []
  if (audience) parts.push(`para ${AUDIENCES.find((a) => a.value === audience).label.toLowerCase()}`)
  if (min && max) parts.push(`de ${formatMoney(min)} a ${formatMoney(max)}`)
  else if (max) parts.push(`hasta ${formatMoney(max)}`)
  else if (min) parts.push(`desde ${formatMoney(min)}`)
  return parts.join(', ')
}

function uniqueByUrl(products) {
  const seen = new Set()
  return products.filter((product) => !seen.has(product.url) && seen.add(product.url))
}

// Aplica el valor solo, medio segundo después de dejar de escribir; también al salir del campo o con Enter.
function PriceInput({ label, value, placeholder, onChange, onCommit }) {
  const typed = useRef(false)

  useEffect(() => {
    if (!typed.current) return
    const timer = setTimeout(() => onCommit(value), 500)
    return () => clearTimeout(timer)
    // onCommit cambia en cada render; solo importa reaccionar al texto escrito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <label className="flex items-center gap-2">
      <span className="text-[0.9375rem]">{label}</span>
      <span className="relative">
        <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-2">
          $
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          placeholder={placeholder}
          onChange={(event) => {
            typed.current = true
            onChange(event.target.value.replace(/\D/g, ''))
          }}
          onBlur={(event) => onCommit(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onCommit(event.target.value)
            }
          }}
          maxLength={7}
          className="h-12 w-32 rounded-2xl border-2 border-separator bg-surface pr-3 pl-8 text-base outline-none transition-colors focus:border-rose focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
        />
      </span>
    </label>
  )
}

function LoadMore({ state, onClick }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Button variant="secondary" onClick={onClick} disabled={state.loadingMore} className="min-w-56">
        {state.loadingMore ? <Spinner /> : null}
        {state.loadingMore ? 'Cargando más' : 'Ver más resultados'}
      </Button>
      {state.moreError && (
        <p role="alert" className="text-sm text-danger">
          {state.moreError}
        </p>
      )}
    </div>
  )
}

// Vista propia para buscar regalos y agregarlos a la wishlist sin salir de la página.
export default function ProductSearchPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const token = getClaimToken(slug)
  const initialQuery = params.get('q') ?? ''

  const [group, setGroup] = useState(undefined) // undefined = cargando, null = no existe
  const [loadError, setLoadError] = useState('')
  const [mine, setMine] = useState(null)
  const [query, setQuery] = useState(initialQuery)
  const [audience, setAudience] = useState(params.get('para') ?? '')
  const [minText, setMinText] = useState(params.get('min') ?? '')
  const [maxText, setMaxText] = useState(params.get('max')) // null = el tope del grupo
  const [state, setState] = useState({ status: 'idle' })
  const [adding, setAdding] = useState('') // url del producto que se está agregando
  const [notice, setNotice] = useState('')
  const [addError, setAddError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const searchedOnce = useRef(false)

  useDocumentTitle(group ? `Buscar regalos · ${group.name}` : 'Buscar regalos')

  // Carga el grupo, valida la sesión y trae mi wishlist. Sin sesión se vuelve a elegir nombre.
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const g = await getGroupPublic(slug)
        const me = g ? await getMe(slug, token) : null
        if (!alive) return
        if (g && !me) return navigate(`/g/${slug}`, { replace: true })
        setGroup(g)
        if (g) setMine((await getMyWishlist(slug, token)).items)
      } catch (e) {
        if (alive) setLoadError(e.message)
      }
    })()
    return () => {
      alive = false
    }
  }, [slug, token, navigate, attempt])

  // Trae las páginas 1..pages. Las que ya se pidieron salen del caché del servidor, así que no cuestan nada.
  const run = useCallback(
    async (text, filters, pages = 1) => {
      setState({ status: 'loading', searched: text })
      const options = { query: text, minPrice: filters.min, maxPrice: filters.max, audience: filters.audience }
      try {
        const results = await Promise.all(
          Array.from({ length: pages }, (_, index) => searchProducts(slug, token, { ...options, page: index + 1 })),
        )
        setState({
          status: 'done',
          products: uniqueByUrl(results.flatMap((result) => result.products)),
          searched: text,
          filters,
          page: pages,
          hasMore: results[results.length - 1].hasMore,
          loadingMore: false,
          moreError: '',
        })
      } catch (error) {
        setState({ status: error.code === 'SEARCH_UNAVAILABLE' ? 'unavailable' : 'error', message: error.message })
      }
    },
    [slug, token],
  )

  const loadMore = async () => {
    setState((current) => ({ ...current, loadingMore: true, moreError: '' }))
    try {
      const next = state.page + 1
      const { min, max, audience: chosen } = state.filters
      const result = await searchProducts(slug, token, { query: state.searched, minPrice: min, maxPrice: max, audience: chosen, page: next })
      setState((current) => ({
        ...current,
        products: uniqueByUrl([...current.products, ...result.products]),
        page: next,
        hasMore: result.hasMore,
        loadingMore: false,
      }))
    } catch (error) {
      setState((current) => ({ ...current, loadingMore: false, moreError: error.message }))
    }
  }

  // Si la dirección ya trae ?q=, se busca al abrir (los resultados se guardan en el servidor 10 minutos).
  useEffect(() => {
    if (!group || searchedOnce.current || initialQuery.trim().length < 2) return
    searchedOnce.current = true
    run(initialQuery.trim(), { audience: params.get('para') ?? '', min: toNumber(params.get('min') ?? ''), max: toNumber(params.get('max') ?? '') ?? group.budget })
  }, [group, initialQuery, params, run])

  if (loadError) {
    return <ErrorState title="No pudimos abrir el buscador" message={loadError} onRetry={() => { setLoadError(''); setAttempt((n) => n + 1) }} />
  }
  if (group === undefined || mine === null) return <Loading />
  if (group === null) return <ErrorState title="No encontramos este intercambio" message="Revisa que el enlace esté completo." />

  const budgetDefault = String(group.budget)
  const maxShown = maxText ?? budgetDefault
  const filtersNow = (overrides = {}) => ({
    audience,
    min: toNumber(minText),
    max: toNumber(maxShown),
    ...overrides,
  })
  const priceIsDefault = !toNumber(minText) && toNumber(maxShown) === group.budget

  // La dirección guarda la búsqueda y los filtros que cambian lo predeterminado.
  const syncUrl = (text, filters) => {
    const next = { q: text }
    if (filters.audience) next.para = filters.audience
    if (filters.min) next.min = String(filters.min)
    if (filters.max && filters.max !== group.budget) next.max = String(filters.max)
    setParams(next, { replace: true })
  }

  const search = (text, overrides = {}) => {
    const clean = text.trim()
    if (clean.length < 2) return setState({ status: 'error', message: 'Escribe al menos 2 letras.' })
    const filters = filtersNow(overrides)
    setQuery(clean)
    syncUrl(clean, filters)
    run(clean, filters)
  }

  // Cambiar el rango no gasta créditos: se vuelve a filtrar lo que el servidor ya tiene guardado.
  const applyPrice = (overrides = {}) => {
    if (state.status !== 'done') return
    const filters = filtersNow(overrides)
    if (filters.min === state.filters.min && filters.max === state.filters.max) return
    syncUrl(state.searched, filters)
    run(state.searched, filters, state.page)
  }

  const chooseAudience = (value) => {
    setAudience(value)
    if (state.status === 'done' || state.status === 'loading') search(state.searched ?? query, { audience: value })
  }

  const resetPrice = () => {
    setMinText('')
    setMaxText(null)
    applyPrice({ min: undefined, max: group.budget })
  }

  const ideas = group.categories.length > 0 ? group.categories.map((category) => category.label) : DEFAULT_IDEAS
  const isAdded = (product) => mine.some((item) => item.url === product.url)

  // Si la búsqueda es justo una categoría del grupo (por ejemplo, tocaste la idea "Pantuflas"), el producto se etiqueta con ella.
  const categoryOf = () => group.categories.find((category) => category.label.toLowerCase() === (state.searched ?? '').toLowerCase())

  const onAdd = async (product) => {
    setAdding(product.url)
    setNotice('')
    setAddError('')
    try {
      const created = await addWishlistItem(slug, token, {
        title: product.title.slice(0, 100),
        categoryId: categoryOf()?.id ?? '',
        price: product.price,
        url: product.url,
        imageUrl: product.imageUrl ?? '',
        note: '',
      })
      setMine((items) => [...items, created])
      setNotice(`Agregaste “${product.title.slice(0, 50)}” a tu wishlist.`)
    } catch (error) {
      setAddError(error.message)
    }
    setAdding('')
  }

  return (
    <Page
      headerAction={
        <Link to={`/g/${slug}`} className="font-bold text-action underline underline-offset-4">
          Volver al grupo
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-8 pb-24 lg:grid-cols-[minmax(0,1fr)_21rem] lg:pb-0">
        <section aria-label="Buscador de regalos" className="min-w-0">
          <h1 className="font-hand text-[2.75rem] leading-none font-bold sm:text-[3.5rem]">Buscador de regalos</h1>
          <p className="mt-2 text-text-2">
            Temática: <strong>{group.theme}</strong>. Hasta {formatMoney(group.budget)}.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              search(query)
            }}
            className="mt-6 flex flex-col gap-5"
          >
            <div className="flex gap-2">
              <input
                type="search"
                aria-label="¿Qué quieres buscar?"
                placeholder="Pijama, pantuflas, libro…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                maxLength={65}
                autoFocus={!initialQuery}
                className="h-14 min-w-0 flex-1 rounded-2xl border-2 border-separator bg-surface px-5 text-base outline-none transition-colors placeholder:text-text-2/70 focus:border-rose focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
              />
              <Button type="submit" disabled={state.status === 'loading'} className="min-h-14 shrink-0 px-6">
                {state.status === 'loading' ? <Spinner /> : null}
                {state.status === 'loading' ? 'Buscando' : 'Buscar'}
              </Button>
            </div>

            <fieldset>
              <legend className="mb-2 text-[0.9375rem] font-bold">Para quién es</legend>
              <div role="radiogroup" className="flex flex-wrap gap-2">
                {AUDIENCES.map((option) => {
                  const active = audience === option.value
                  return (
                    <button
                      key={option.value || 'todos'}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => chooseAudience(option.value)}
                      className={`min-h-11 rounded-full px-5 font-bold transition-colors ${active ? 'bg-primary text-on-primary' : 'bg-blush text-text'}`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-[0.9375rem] font-bold">Rango de precio (MXN)</legend>
              <div className="flex flex-wrap items-center gap-3">
                <PriceInput
                  label="Desde"
                  value={minText}
                  placeholder="0"
                  onChange={setMinText}
                  onCommit={(value) => applyPrice({ min: toNumber(value) })}
                />
                <PriceInput
                  label="Hasta"
                  value={maxShown}
                  placeholder={budgetDefault}
                  onChange={setMaxText}
                  onCommit={(value) => applyPrice({ max: toNumber(value) })}
                />
                {!priceIsDefault && (
                  <Button variant="ghost" onClick={resetPrice} className="min-h-11 px-0">
                    Restablecer
                  </Button>
                )}
              </div>
              <p className="mt-2 text-sm text-text-2">
                {toNumber(maxShown) > group.budget
                  ? `Pasa del tope del grupo (${formatMoney(group.budget)}).`
                  : `Por defecto es el tope del grupo: ${formatMoney(group.budget)}.`}
              </p>
            </fieldset>
          </form>

          {notice && (
            <p role="status" className="mt-4 rounded-2xl bg-blush px-4 py-3 text-sm font-bold [overflow-wrap:anywhere]">
              {notice}
            </p>
          )}
          {addError && (
            <p role="alert" className="mt-4 rounded-2xl bg-blush px-4 py-3 text-sm font-bold text-danger">
              {addError}
            </p>
          )}

          {state.status === 'idle' && (
            <div className="mt-8">
              <p className="text-text-2">
                {group.categories.length > 0 ? 'Categorías de este intercambio, o escribe lo que buscas:' : 'Prueba con una de estas ideas o escribe lo que buscas:'}
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {ideas.map((idea) => (
                  <li key={idea}>
                    <button type="button" onClick={() => search(idea)} className="min-h-11 rounded-full bg-blush px-5 font-bold">
                      {idea}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {state.status === 'loading' && (
            <div className="mt-8" aria-busy="true">
              <p role="status" className="flex items-center gap-2 text-text-2">
                <Spinner className="size-5 shrink-0" />
                <span className="min-w-0 [overflow-wrap:anywhere]">Buscando “{state.searched}”…</span>
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }, (_, index) => (
                  <li key={index}>
                    <ProductSkeleton />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(state.status === 'error' || state.status === 'unavailable') && (
            <div role="alert" className="mt-8 flex flex-col items-start gap-3">
              <p className="text-danger">{state.message}</p>
              {state.status === 'unavailable' && (
                <Link to={`/g/${slug}`} className="font-bold text-action underline underline-offset-4">
                  Volver y agregarlo a mano
                </Link>
              )}
            </div>
          )}
          {state.status === 'done' && state.products.length === 0 && (
            <p role="status" className="mt-8 text-text-2 [overflow-wrap:anywhere]">
              No encontramos productos para “{state.searched}”
              {describeFilters(state.filters) ? ` ${describeFilters(state.filters)}` : ''}. Prueba con otra palabra
              {priceIsDefault ? '' : ', o amplía el rango de precio'}.
            </p>
          )}
          {state.status === 'done' && state.products.length === 0 && state.hasMore && (
            <div className="mt-4">
              <LoadMore state={state} onClick={loadMore} />
            </div>
          )}
          {state.status === 'done' && state.products.length > 0 && (
            <>
              <p className="mt-8 text-sm text-text-2 [overflow-wrap:anywhere]">
                {state.products.length} {state.products.length === 1 ? 'resultado' : 'resultados'} para “{state.searched}”
                {describeFilters(state.filters) ? ` ${describeFilters(state.filters)}` : ''}. Los precios pueden cambiar en la tienda.
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {state.products.map((product) => (
                  <li key={product.url}>
                    <ProductCard product={product} added={isAdded(product)} adding={adding === product.url} onAdd={onAdd} />
                  </li>
                ))}
                {state.loadingMore &&
                  Array.from({ length: 4 }, (_, index) => (
                    <li key={`more-${index}`}>
                      <ProductSkeleton />
                    </li>
                  ))}
              </ul>
              {state.hasMore && (
                <div className="mt-6 flex justify-center">
                  <LoadMore state={state} onClick={loadMore} />
                </div>
              )}
              {!state.hasMore && <p className="mt-6 text-center text-text-2">No hay más resultados para esta búsqueda.</p>}
            </>
          )}
        </section>

        <aside className="hidden lg:block">
          <Card as="div" className="sticky top-6 flex max-h-[calc(100dvh-3rem)] flex-col gap-4">
            <div>
              <h2 className="font-hand text-[2rem] leading-none font-bold">Mi wishlist</h2>
              <p className="mt-1 text-text-2">
                {mine.length === 0 ? 'Todavía no agregas nada.' : `${mine.length} ${mine.length === 1 ? 'producto' : 'productos'}`}
              </p>
            </div>
            {mine.length > 0 && (
              <ul className="-mr-2 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-2">
                {mine.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" referrerPolicy="no-referrer" className="size-12 shrink-0 rounded-xl bg-white object-contain" />
                    ) : (
                      <span aria-hidden="true" className="size-12 shrink-0 rounded-xl bg-blush" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{item.title}</span>
                      {item.price != null && <span className="block text-sm text-text-2">{formatMoney(item.price)}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to={`/g/${slug}`}
              className="inline-flex min-h-13 items-center justify-center rounded-2xl bg-primary px-6 font-bold text-on-primary hover:bg-primary-press"
            >
              Listo, ver mi wishlist
            </Link>
          </Card>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-separator bg-bg px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <p className="font-bold">
            Mi wishlist: {mine.length} {mine.length === 1 ? 'producto' : 'productos'}
          </p>
          <Link to={`/g/${slug}`} className="inline-flex min-h-12 items-center rounded-2xl bg-primary px-6 font-bold text-on-primary">
            Listo
          </Link>
        </div>
      </div>

    </Page>
  )
}
