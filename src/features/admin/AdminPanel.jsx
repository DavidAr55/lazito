import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router'
import Avatar from '../../components/Avatar'
import Button from '../../components/Button'
import Card from '../../components/Card'
import ErrorState from '../../components/ErrorState'
import Loading from '../../components/Loading'
import Page from '../../components/Page'
import { getAdminGroup, redrawGroup, updateExclusions, updateFixedAssignments, updateGroup } from '../../lib/api'
import { formatDate, formatMoney } from '../../lib/format'
import { getAdminToken, saveAdminToken } from '../../lib/session'
import useDocumentTitle from '../../lib/useDocumentTitle'
import EditExclusionsSheet from './EditExclusionsSheet'
import EditFixedAssignmentsSheet from './EditFixedAssignmentsSheet'
import EditGroupSheet from './EditGroupSheet'

function statusOf(participant) {
  if (participant.revealed) return { ring: 'active', text: 'Ya vio su resultado' }
  if (participant.claimed) return { ring: 'active', text: 'Ya entró' }
  return { ring: 'seen', text: 'Todavía no entra' }
}

// Título de sección con número grande, como en el manual de marca.
function SectionTitle({ number, children }) {
  return (
    <h2 className="flex items-baseline gap-3">
      <span aria-hidden="true" className="font-num text-[3.25rem] leading-none font-bold text-rose">
        {number}
      </span>
      <span className="min-w-0 font-hand text-[1.875rem] leading-none font-bold [overflow-wrap:anywhere] sm:text-[2.25rem]">{children}</span>
    </h2>
  )
}

// Panel del admin: invitación, quién ya entró, edición y re-sorteo. Nunca muestra quién le toca a quién.
export default function AdminPanel() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const routerLocation = useLocation()
  const justCreated = Boolean(routerLocation.state?.created)
  // Editar exclusiones y regalos a mano solo está disponible con #adm en la URL.
  const advanced = routerLocation.hash === '#adm'
  const token = params.get('k') || getAdminToken(slug)

  const [status, setStatus] = useState('loading') // loading | ok | denied | error
  const [group, setGroup] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [copied, setCopied] = useState('')
  const [editing, setEditing] = useState(false)
  const [editingExclusions, setEditingExclusions] = useState(false)
  const [editingFixed, setEditingFixed] = useState(false)
  const [confirmingRedraw, setConfirmingRedraw] = useState(false)
  const [notice, setNotice] = useState('')
  const [redrawError, setRedrawError] = useState('')
  const [busy, setBusy] = useState(false)

  useDocumentTitle(group ? `Administrar ${group.name}` : 'Administrar')

  const refresh = useCallback(async () => {
    try {
      const data = await getAdminGroup(slug, token)
      setGroup(data)
      setStatus(data ? 'ok' : 'denied')
      if (data) saveAdminToken(slug, token)
    } catch (e) {
      setNotice(e.message)
    }
  }, [slug, token])

  useEffect(() => {
    let alive = true
    getAdminGroup(slug, token)
      .then((data) => {
        if (!alive) return
        setGroup(data)
        setStatus(data ? 'ok' : 'denied')
        if (data) saveAdminToken(slug, token)
      })
      .catch((e) => {
        if (!alive) return
        setLoadError(e.message)
        setStatus('error')
      })
    return () => {
      alive = false
    }
  }, [slug, token, attempt])

  if (status === 'loading') return <Loading />
  if (status === 'error') {
    return (
      <ErrorState
        title="No pudimos cargar el panel"
        message={loadError}
        onRetry={() => {
          setStatus('loading')
          setAttempt((n) => n + 1)
        }}
      />
    )
  }
  if (status === 'denied') {
    return (
      <Page>
        <Card className="mx-auto max-w-lg text-center">
          <h1 className="font-hand text-[2.5rem] leading-none font-bold">No pudimos abrir el panel</h1>
          <p className="mt-3 text-text-2">
            Abre el enlace de administración completo que recibiste al crear el intercambio.
          </p>
          <Link to="/" className="mt-6 inline-block font-bold text-action underline underline-offset-4">
            Crear un intercambio
          </Link>
        </Card>
      </Page>
    )
  }

  const inviteUrl = `${location.origin}/g/${slug}`
  const adminUrl = `${location.origin}/g/${slug}/admin?k=${token}`
  const message = `Te invito al intercambio "${group.name}" (${formatDate(group.eventDate)}, ${formatMoney(group.budget)}, temática: ${group.theme}). Entra aquí para ver a quién le regalas: ${inviteUrl}`
  const seenCount = group.participants.filter((p) => p.revealed).length
  const nameById = Object.fromEntries(group.participants.map((p) => [p.id, p.name]))

  const copy = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(''), 2000)
    } catch {
      setCopied('error')
    }
  }

  const save = async (values) => {
    try {
      setGroup(await updateGroup(slug, token, values))
      setEditing(false)
      setNotice('Cambios guardados.')
      return null
    } catch (e) {
      return e.message
    }
  }

  const saveExclusions = async (pairs) => {
    try {
      setGroup(await updateExclusions(slug, token, pairs))
      setEditingExclusions(false)
      setNotice('Exclusiones guardadas y sorteo hecho de nuevo. Nadie ha visto todavía su nuevo resultado.')
      return null
    } catch (e) {
      if (e.code === 'ALREADY_REVEALED') await refresh()
      return e.message
    }
  }

  const saveFixedAssignments = async (pairs) => {
    try {
      setGroup(await updateFixedAssignments(slug, token, pairs))
      setEditingFixed(false)
      setNotice('Reglas guardadas y sorteo hecho de nuevo. Nadie ha visto todavía su nuevo resultado.')
      return null
    } catch (e) {
      if (e.code === 'ALREADY_REVEALED') await refresh()
      return e.message
    }
  }

  const redraw = async () => {
    setBusy(true)
    setRedrawError('')
    try {
      setGroup(await redrawGroup(slug, token))
      setNotice('Sorteo hecho de nuevo. Nadie ha visto todavía su nuevo resultado.')
    } catch (e) {
      setRedrawError(e.message)
      if (e.code === 'ALREADY_REVEALED') await refresh()
    }
    setConfirmingRedraw(false)
    setBusy(false)
  }

  return (
    <Page
      headerAction={
        <Link to={`/g/${slug}`} className="font-bold text-action underline underline-offset-4">
          Ir al grupo
        </Link>
      }
    >
      <header className="max-w-2xl">
        <h1 className="font-hand text-[3.25rem] leading-[0.95] font-bold [overflow-wrap:anywhere] sm:text-[4.5rem]">
          {justCreated ? 'Listo, el sorteo está hecho' : group.name}
        </h1>
        <p className="mt-3 text-text-2">
          {justCreated
            ? `${group.participants.length} participantes en "${group.name}". Comparte el enlace para que cada quien descubra a quién le toca.`
            : `${group.participants.length} participantes. Tú también puedes entrar con el enlace de invitación.`}
        </p>
        {notice && (
          <p role="status" className="mt-4 rounded-2xl bg-blush px-4 py-3 text-sm font-bold">
            {notice}
          </p>
        )}
      </header>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <Card className="flex flex-col gap-4 lg:col-start-1">
          <SectionTitle number="01">Invitación</SectionTitle>
          <input
            readOnly
            value={inviteUrl}
            aria-label="Enlace de invitación"
            onFocus={(e) => e.target.select()}
            className="h-13 w-full rounded-2xl border-2 border-separator bg-bg px-4 text-base"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" onClick={() => copy('invite', inviteUrl)}>
              {copied === 'invite' ? 'Enlace copiado' : 'Copiar enlace'}
            </Button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-13 flex-1 items-center justify-center rounded-2xl bg-blush px-6 text-base font-bold text-text hover:bg-blush/70"
            >
              WhatsApp
            </a>
          </div>
          {copied === 'error' && (
            <p className="text-sm text-danger">No se pudo copiar. Selecciona el enlace y cópialo a mano.</p>
          )}
        </Card>

        <Card className="flex flex-col gap-4 lg:col-start-2 lg:row-span-4 lg:row-start-1">
          <SectionTitle number="02">Participantes</SectionTitle>
          <div className="flex items-center justify-between gap-4">
            <p className="text-text-2">
              {seenCount} de {group.participants.length} ya vieron su resultado.
            </p>
            <Button variant="ghost" className="min-h-11 shrink-0 px-0" onClick={refresh}>
              Actualizar
            </Button>
          </div>
          <ul>
            {group.participants.map((p) => {
              const { ring, text } = statusOf(p)
              return (
                <li key={p.id} className="flex items-center gap-3 border-b border-separator py-3 last:border-b-0">
                  <Avatar name={p.name} ring={ring} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{p.name}</span>
                    <span className="block text-sm text-text-2">{text}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card className="flex flex-col gap-3 lg:col-start-1">
          <SectionTitle number="03">Intercambio</SectionTitle>
          <p>
            {group.name}. {formatDate(group.eventDate)}. Hasta {formatMoney(group.budget)}. Temática: {group.theme}.
          </p>
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Editar datos
          </Button>
        </Card>

        <Card className="flex flex-col gap-3 lg:col-start-1">
          <SectionTitle number="04">Sorteo</SectionTitle>
          {(advanced || group.exclusions.length > 0) && (
            <div className="flex flex-col gap-2">
              <h3 className="font-hand text-[1.5rem] leading-none">Quién no debe tocarse</h3>
              {group.exclusions.length === 0 ? (
                <p className="text-text-2">Nadie está excluido: todos pueden tocarse.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {group.exclusions.map(([a, b]) => (
                    <li key={`${a}|${b}`} className="rounded-full bg-blush px-4 py-1 text-sm font-bold">
                      {nameById[a]} y {nameById[b]}
                    </li>
                  ))}
                </ul>
              )}
              {advanced && group.canRedraw && (
                <Button variant="secondary" onClick={() => setEditingExclusions(true)}>
                  Editar exclusiones
                </Button>
              )}
            </div>
          )}
          {(advanced || group.fixedAssignments.length > 0) && (
            <div className="flex flex-col gap-2">
              <h3 className="font-hand text-[1.5rem] leading-none">Regalos decididos a mano</h3>
              {group.fixedAssignments.length === 0 ? (
                <p className="text-text-2">Ninguno: todo el sorteo es al azar.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {group.fixedAssignments.map(([giver, receiver]) => (
                    <li key={`${giver}|${receiver}`} className="rounded-full bg-blush px-4 py-1 text-sm font-bold">
                      {nameById[giver]} → {nameById[receiver]}
                    </li>
                  ))}
                </ul>
              )}
              {advanced && group.canRedraw && (
                <Button variant="secondary" onClick={() => setEditingFixed(true)}>
                  Editar regalos a mano
                </Button>
              )}
            </div>
          )}
          {group.canRedraw ? (
            <>
              <p className="text-text-2">
                Mientras nadie haya visto su resultado puedes volver a sortear. Cambia a quién le toca a cada persona.
              </p>
              {confirmingRedraw ? (
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={() => setConfirmingRedraw(false)}>
                    Cancelar
                  </Button>
                  <Button variant="danger" className="flex-1" onClick={redraw} disabled={busy}>
                    Sí, sortear de nuevo
                  </Button>
                </div>
              ) : (
                <Button variant="secondary" onClick={() => setConfirmingRedraw(true)}>
                  Volver a sortear
                </Button>
              )}
            </>
          ) : (
            <p className="text-text-2">No se puede volver a sortear: alguien ya vio su resultado.</p>
          )}
          {redrawError && (
            <p role="alert" className="text-danger">
              {redrawError}
            </p>
          )}
        </Card>

        <Card className="flex flex-col gap-3 lg:col-start-1">
          <SectionTitle number="05">Administración</SectionTitle>
          <p className="text-text-2">
            Tu enlace es privado. Guárdalo: con él administras el intercambio desde otro dispositivo.
          </p>
          <Button variant="secondary" onClick={() => copy('admin', adminUrl)}>
            {copied === 'admin' ? 'Enlace copiado' : 'Copiar enlace de administración'}
          </Button>
        </Card>
      </div>

      <EditGroupSheet group={group} open={editing} onClose={() => setEditing(false)} onSave={save} />
      <EditFixedAssignmentsSheet
        group={group}
        open={editingFixed}
        onClose={() => setEditingFixed(false)}
        onSave={saveFixedAssignments}
      />
      <EditExclusionsSheet
        group={group}
        open={editingExclusions}
        onClose={() => setEditingExclusions(false)}
        onSave={saveExclusions}
      />
    </Page>
  )
}
