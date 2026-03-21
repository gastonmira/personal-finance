/**
 * SMS / push-notification parser for Argentine bank transaction notifications.
 *
 * Public API:
 *   parseSmsTransaction(text) → { description, amount, date, bank } | null
 *   parseSmsBlock(text)       → Array of parsed transactions (handles multi-SMS paste)
 */

import { parseArgentineAmount, extractDate } from './parseHelpers'

// ── Bank patterns ─────────────────────────────────────────────────────────────

/**
 * Each entry has:
 *   bank     — display name
 *   patterns — array of regex patterns, each with named group `amount` and optionally `merchant`
 *
 * Amount group must capture the full Argentine-formatted amount string (e.g. "20.010,00").
 * Merchant group captures the payee description when available.
 */
const BANK_PATTERNS = [
  {
    bank: 'Santander',
    patterns: [
      // Pattern 1 — Purchase:
      // "Pagaste $20.010,00\nA PedidosYa*Gordys con tu Tarjeta Santander..."
      {
        regex: /Pagaste\s+\$(?<amount>[\d.,]+)\s+A\s+(?<merchant>[^\n]+?)\s+con tu Tarjeta Santander/is,
        type: 'purchase',
      },
      // Pattern 2 — Auto debit:
      // "Aviso de débito automático\nDebitamos $132.838,52 por el pago a ZURICH SEGUROS de tu Tarjeta Santander..."
      {
        regex: /Debitamos\s+\$(?<amount>[\d.,]+)\s+por el pago a\s+(?<merchant>[^\s].*?)\s+de tu Tarjeta Santander/is,
        type: 'debit',
      },
    ],
  },
  {
    bank: 'Galicia',
    patterns: [
      // "Compra de $AMOUNT en MERCHANT. Saldo disponible"
      {
        regex: /Compra de\s+\$(?<amount>[\d.,]+)\s+en\s+(?<merchant>[^.]+)\.\s+Saldo disponible/i,
        type: 'purchase',
      },
    ],
  },
  {
    bank: 'BBVA',
    patterns: [
      // "Realizaste una compra de $AMOUNT en MERCHANT"
      {
        regex: /Realizaste una compra de\s+\$(?<amount>[\d.,]+)\s+en\s+(?<merchant>.+)/i,
        type: 'purchase',
      },
    ],
  },
  {
    bank: 'Naranja X',
    patterns: [
      // "Compra aprobada $AMOUNT en MERCHANT"
      {
        regex: /Compra aprobada\s+\$(?<amount>[\d.,]+)\s+en\s+(?<merchant>.+)/i,
        type: 'purchase',
      },
    ],
  },
  {
    bank: 'Mercado Pago',
    patterns: [
      // "Pagaste $AMOUNT a MERCHANT" — distinct from Santander (no "con tu Tarjeta")
      {
        regex: /Pagaste\s+\$(?<amount>[\d.,]+)\s+a\s+(?<merchant>[^\n]+?)(?:\s*\(|$)/im,
        type: 'purchase',
      },
    ],
  },
  {
    bank: 'Uala',
    patterns: [
      // "Compra por $AMOUNT en MERCHANT"
      {
        regex: /Compra por\s+\$(?<amount>[\d.,]+)\s+en\s+(?<merchant>.+)/i,
        type: 'purchase',
      },
    ],
  },
  {
    bank: 'Banco Provincia',
    patterns: [
      // "Operacion aprobada $AMOUNT en MERCHANT"
      {
        regex: /Operacion aprobada\s+\$(?<amount>[\d.,]+)\s+en\s+(?<merchant>.+)/i,
        type: 'purchase',
      },
    ],
  },
]

// ── Core parser ───────────────────────────────────────────────────────────────

/**
 * Try to parse a single SMS / notification string.
 *
 * @param {string} text
 * @returns {{ description: string, amount: number, date: string, bank: string } | null}
 */
export function parseSmsTransaction(text) {
  if (!text || typeof text !== 'string') return null

  const trimmed = text.trim()
  if (!trimmed) return null

  for (const { bank, patterns } of BANK_PATTERNS) {
    for (const { regex } of patterns) {
      const match = trimmed.match(regex)
      if (match?.groups) {
        const { amount: rawAmount, merchant: rawMerchant } = match.groups

        const amount = parseArgentineAmount(rawAmount)
        if (amount === null || amount <= 0) continue

        const description = rawMerchant
          ? rawMerchant.trim().replace(/\s+/g, ' ')
          : bank

        const date = extractDate(trimmed)

        return { description, amount, date, bank }
      }
    }
  }

  return null
}

// ── Block parser ──────────────────────────────────────────────────────────────

/**
 * Split a multi-SMS paste into individual chunks and parse each one.
 * Splits on double newlines or dashes-based separators.
 *
 * @param {string} text
 * @returns {Array<{ description: string, amount: number, date: string, bank: string }>}
 */
export function parseSmsBlock(text) {
  if (!text || typeof text !== 'string') return []

  // Split on double (or more) newlines, or on lines that are pure dashes/equals (separators)
  const chunks = text
    .split(/\n{2,}|(?:^|\n)[-=]{3,}(?:\n|$)/m)
    .map((chunk) => chunk.trim())
    .filter(Boolean)

  const results = []
  for (const chunk of chunks) {
    const parsed = parseSmsTransaction(chunk)
    if (parsed) {
      results.push(parsed)
    }
  }

  return results
}
