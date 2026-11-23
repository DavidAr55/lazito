import { GiftRow } from './Art'
import Logo from './Logo'

// Estructura común: encabezado, contenido y pie con regalitos.
// Con `art`, en escritorio el contenido va a la izquierda y la ilustración a la derecha.
export default function Page({ children, art, headerAction, wide = false }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-surface shadow-[0_2px_24px_-10px_rgb(87_58_50/0.3)]">
        <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between px-5">
          <Logo />
          {headerAction}
        </div>
      </header>
      <main className={`mx-auto w-full flex-1 px-5 py-8 lg:py-14 ${wide ? 'max-w-6xl' : 'max-w-6xl'}`}>
        {art ? (
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,30rem)_1fr] lg:gap-20">
            <div>{children}</div>
            <div className="hidden lg:block">{art}</div>
          </div>
        ) : (
          children
        )}
      </main>
      <footer className="px-5 pt-2 pb-8">
        <GiftRow />
      </footer>
    </div>
  )
}
