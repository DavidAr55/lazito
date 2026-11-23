// Tarjeta de relleno mientras llegan los resultados. Mantiene el tamaño real para que la página no salte.
export default function ProductSkeleton() {
  return (
    <div aria-hidden="true" className="flex h-full flex-col overflow-hidden rounded-3xl bg-surface shadow-card ring-1 ring-blush/70 motion-safe:animate-pulse">
      <div className="aspect-square bg-blush" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="h-4 w-11/12 rounded-full bg-blush" />
        <div className="h-4 w-7/12 rounded-full bg-blush" />
        <div className="flex items-center justify-between gap-2">
          <div className="h-6 w-16 rounded-full bg-blush" />
          <div className="h-4 w-14 rounded-full bg-blush" />
        </div>
        <div className="mt-auto h-12 rounded-2xl bg-blush" />
      </div>
    </div>
  )
}
