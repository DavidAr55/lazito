import { Link } from 'react-router'
import Card from '../components/Card'
import Page from '../components/Page'
import useDocumentTitle from '../lib/useDocumentTitle'

export default function NotFound() {
  useDocumentTitle('Página no encontrada')
  return (
    <Page>
      <Card className="mx-auto max-w-lg text-center">
        <h1 className="font-hand text-[2.5rem] leading-none font-bold">No encontramos esta página</h1>
        <p className="mt-3 text-text-2">Revisa que el enlace esté completo.</p>
        <Link to="/" className="mt-6 inline-block font-bold text-action underline underline-offset-4">
          Crear un intercambio
        </Link>
      </Card>
    </Page>
  )
}
