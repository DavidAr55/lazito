// Tarjeta con sombra suave, como la del formulario de referencia.
export default function Card({ as: Tag = 'section', className = '', ...props }) {
  return (
    <Tag
      className={`rounded-[28px] bg-surface p-6 shadow-card ring-1 ring-blush/70 sm:p-8 ${className}`}
      {...props}
    />
  )
}
