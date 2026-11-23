export function formatDate(iso) {
  // iso = "2026-12-04"; se fuerza mediodía local para evitar saltos de zona horaria
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(`${iso}T12:00:00`),
  )
}

export function formatMoney(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function daysUntil(iso) {
  const ms = new Date(`${iso}T12:00:00`) - new Date()
  return Math.max(0, Math.ceil(ms / 86_400_000))
}
