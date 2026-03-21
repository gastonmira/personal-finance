/**
 * Shared parsing helpers for SMS and PDF bank parsers.
 */

/**
 * Convert Argentine number format to a JS float.
 * "$20.010,00" → 20010.00
 * "$132.838,52" → 132838.52
 * "$1.500" (no decimal) → 1500
 */
export function parseArgentineAmount(raw) {
  if (!raw) return null
  const cleaned = raw.replace(/[$\s]/g, '')
  const normalized = cleaned.replace(/\./g, '').replace(',', '.')
  const value = parseFloat(normalized)
  return isNaN(value) ? null : value
}

/**
 * Extract a DD/MM/YYYY date from text and return it as YYYY-MM-DD.
 * Falls back to today's date if not found.
 */
export function extractDate(text) {
  const match = text.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (match) {
    const [, day, month, year] = match
    return `${year}-${month}-${day}`
  }
  return new Date().toISOString().slice(0, 10)
}
