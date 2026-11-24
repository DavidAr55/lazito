import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { HeroArt } from '../../components/Art'
import Button from '../../components/Button'
import Card from '../../components/Card'
import GiftProgress from '../../components/GiftProgress'
import Page from '../../components/Page'
import { createGroup } from '../../lib/api'
import { saveAdminToken } from '../../lib/session'
import useDocumentTitle from '../../lib/useDocumentTitle'
import StepDetails from './StepDetails'
import StepPeople from './StepPeople'
import StepReview from './StepReview'
import StepTheme from './StepTheme'

const STEPS = [
  { title: '¿Cómo se llama el intercambio?', Component: StepDetails },
  { title: '¿De qué va a ser?', Component: StepTheme },
  { title: '¿Quiénes participan?', Component: StepPeople },
  { title: 'Revisa y haz el sorteo', Component: StepReview },
]

const today = () => new Date().toISOString().slice(0, 10)

function validate(step, d) {
  const e = {}
  if (step === 0) {
    if (!d.name.trim()) e.name = 'Escribe un nombre para el intercambio.'
    if (!d.eventDate) e.eventDate = 'Elige la fecha del intercambio.'
    else if (d.eventDate < today()) e.eventDate = 'La fecha ya pasó. Elige una futura.'
    if (!(Number(d.budget) > 0)) e.budget = 'Escribe un presupuesto mayor a $0.'
  }
  if (step === 1 && !d.theme.trim()) e.theme = 'Escribe la temática, por ejemplo "Pijamas".'
  if (step === 2 && d.people.length < 3) e.people = 'Se necesitan al menos 3 participantes.'
  return e
}

export default function CreateWizard() {
  const navigate = useNavigate()
  // Opciones avanzadas (exclusiones y regalos a mano) solo con /#adm en la URL.
  const advanced = useLocation().hash === '#adm'
  useDocumentTitle('Crear intercambio')
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [busy, setBusy] = useState(false)
  const [data, setData] = useState({
    name: '',
    eventDate: '',
    budget: '',
    theme: '',
    themeDescription: '',
    categories: [],
    people: [],
    exclusions: [],
    fixedAssignments: [],
  })

  const { title, Component } = STEPS[step]
  const last = step === STEPS.length - 1
  const patch = (p) => {
    setData((d) => ({ ...d, ...p }))
    setErrors({})
    setSubmitError('')
  }

  const next = async () => {
    const found = validate(step, data)
    setErrors(found)
    if (Object.keys(found).length) return
    if (!last) return setStep(step + 1)
    setBusy(true)
    setSubmitError('')
    try {
      const { slug, adminToken } = await createGroup({ ...data, people: data.people })
      saveAdminToken(slug, adminToken)
      navigate(`/g/${slug}/admin?k=${adminToken}`, { replace: true, state: { created: true } })
    } catch (error) {
      // Si el servidor rechazó las reglas, reintentar no sirve: se muestra el motivo y se vuelve a donde se arreglan.
      if (error.code === 'NO_VALID_DRAW' || error.status === 422) {
        setSubmitError(error.message)
        setStep(2)
      } else {
        setSubmitError(error.code === 'NETWORK' ? error.message : 'No se pudo hacer el sorteo. Intenta de nuevo.')
      }
      setBusy(false)
    }
  }

  return (
    <Page art={<HeroArt className="mx-auto w-full max-w-xl" />}>
      <h1 className="font-hand text-[3.5rem] leading-[0.92] font-bold sm:text-[4.5rem]">
        Organiza tu intercambio de regalos
      </h1>
      <p className="mt-4 max-w-md text-text-2">
        Crea el grupo, comparte el enlace y cada persona descubre a quién le regala.
      </p>
      <Card className="mt-8">
        <GiftProgress count={STEPS.length} current={step} />
        <h2 className="mt-6 font-hand text-[2.25rem] leading-none font-bold">{title}</h2>
        <div className="mt-5">
          <Component data={data} onChange={patch} errors={errors} error={submitError} advanced={advanced} />
        </div>
        <div className="mt-7 flex flex-col gap-1">
          <Button full chevron onClick={next} disabled={busy}>
            {last ? (busy ? 'Haciendo el sorteo…' : 'Hacer sorteo') : 'Continuar'}
          </Button>
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              Atrás
            </Button>
          )}
        </div>
      </Card>
    </Page>
  )
}
