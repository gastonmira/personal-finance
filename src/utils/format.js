export function formatARS(amount) {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatUSD(amount) {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function formatMonthKey(key) {
  // key = "2025-01"
  const [year, month] = key.split('-')
  return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`
}

/**
 * Converts a payment month key to a consumption month display.
 * The XLS is organized by payment month (Febrero = statement paid in Feb = January spending).
 * This shifts -1 month so "Febrero 2025" → displays as "Enero 2025" (when you actually spent).
 *
 * @param {string} paymentKey - e.g. "2025-02"
 * @returns {{ label: string, note: string }}
 *   label = "Enero 2025" (consumption month)
 *   note  = "Resumen Febrero 2025" (payment month)
 */
export function toDisplayMonth(paymentKey) {
  const [year, month] = paymentKey.split('-').map(Number)
  const d = new Date(year, month - 2) // shift -1 month (JS Date handles year wrap)
  const y2 = d.getFullYear()
  const m2 = d.getMonth() + 1
  return {
    label: formatMonthKey(`${y2}-${String(m2).padStart(2, '0')}`),
    note: `Resumen ${MONTH_NAMES[month - 1]} ${year}`,
  }
}

export const CARD_LABELS = {
  santander: 'Santander',
  amex: 'Amex',
  provincia: 'Provincia',
  uala: 'UALA',
}

export const CARD_COLORS = {
  santander: '#ef4444',  // rojo
  amex: '#38bdf8',       // celeste
  provincia: '#22c55e',  // verde
  uala: '#1e40af',       // azul oscuro
}
