import Button from './Button'
import Card from './Card'
import Page from './Page'

export default function ErrorState({ title, message, onRetry }) {
  return (
    <Page>
      <Card className="mx-auto max-w-lg text-center">
        <h1 className="font-hand text-[2.5rem] leading-none font-bold">{title}</h1>
        <p className="mt-3 text-text-2">{message}</p>
        {onRetry && (
          <Button className="mt-6" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </Card>
    </Page>
  )
}
