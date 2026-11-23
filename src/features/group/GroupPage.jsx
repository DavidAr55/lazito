import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  claimParticipant,
  getGroupPublic,
  getMe,
  getMyAssignment,
  loginParticipant,
} from '../../lib/api'
import { getClaimToken, saveClaimToken } from '../../lib/session'
import useDocumentTitle from '../../lib/useDocumentTitle'
import Card from '../../components/Card'
import ErrorState from '../../components/ErrorState'
import Loading from '../../components/Loading'
import Page from '../../components/Page'
import RevealStory from '../reveal/RevealStory'
import GroupHome from './GroupHome'
import { InvitationArt } from './InvitationCard'
import PinSheet from './PinSheet'
import WhoAreYou from './WhoAreYou'

// Pantalla de invitación: elegir nombre → PIN → revelación → home del grupo.
export default function GroupPage() {
  const { slug } = useParams()
  const [group, setGroup] = useState(undefined) // undefined = cargando, null = no existe
  const [me, setMe] = useState(null)
  const [view, setView] = useState('who') // who | reveal | home
  const [receiver, setReceiver] = useState(null)
  const [picked, setPicked] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useDocumentTitle(group?.name)

  const reload = useCallback(async () => setGroup(await getGroupPublic(slug)), [slug])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const g = await getGroupPublic(slug)
        const who = g ? await getMe(slug, getClaimToken(slug)) : null
        if (!alive) return
        setLoadError('')
        setGroup(g)
        setMe(who)
        if (who) setView(who.revealed ? 'home' : 'reveal')
      } catch (e) {
        if (alive) setLoadError(e.message)
      }
    })()
    return () => {
      alive = false
    }
  }, [slug, attempt])

  // Se pide MI asignación (el servidor solo entrega la mía) para la revelación y para el home.
  useEffect(() => {
    if (view === 'who' || receiver) return
    let alive = true
    getMyAssignment(slug, getClaimToken(slug)).then((r) => alive && setReceiver(r.receiver))
    return () => {
      alive = false
    }
  }, [view, receiver, slug])

  const submitPin = async (pin) => {
    try {
      const fn = picked.claimed ? loginParticipant : claimParticipant
      const { claimToken, revealed } = await fn(slug, picked.id, pin)
      saveClaimToken(slug, claimToken)
      setMe(await getMe(slug, claimToken))
      setPicked(null)
      setView(revealed ? 'home' : 'reveal')
      reload()
      return null
    } catch (e) {
      return e.message
    }
  }

  if (loadError) {
    return (
      <ErrorState
        title="No pudimos cargar el intercambio"
        message={loadError}
        onRetry={() => {
          setLoadError('')
          setAttempt((n) => n + 1)
        }}
      />
    )
  }
  if (group === undefined) return <Loading />
  if (group === null) {
    return (
      <Page>
        <Card className="mx-auto max-w-lg text-center">
          <h1 className="font-hand text-[2.5rem] leading-none font-bold">No encontramos este intercambio</h1>
          <p className="mt-3 text-text-2">Revisa que el enlace esté completo o pídele uno nuevo a quien lo organizó.</p>
          <Link to="/" className="mt-6 inline-block font-bold text-action underline underline-offset-4">
            Crear un intercambio
          </Link>
        </Card>
      </Page>
    )
  }

  const pinSheet = (
    <PinSheet
      participant={picked}
      mode={picked?.claimed ? 'login' : 'create'}
      onClose={() => setPicked(null)}
      onSubmit={submitPin}
    />
  )

  if (view === 'reveal') {
    if (!receiver) return <Loading />
    return (
      <>
        <RevealStory group={group} receiverName={receiver.name} onDone={() => setView('home')} />
        {pinSheet}
      </>
    )
  }

  if (view === 'home' && me) {
    return (
      <Page>
        <GroupHome
          group={group}
          me={me}
          receiver={receiver}
          onShowReveal={() => {
            setReceiver(null)
            setView('reveal')
          }}
        />
        {pinSheet}
      </Page>
    )
  }

  return (
    <Page art={<InvitationArt group={group} />}>
      <WhoAreYou group={group} onPick={setPicked} />
      {pinSheet}
    </Page>
  )
}
