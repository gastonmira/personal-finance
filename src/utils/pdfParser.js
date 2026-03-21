/**
 * Client-side PDF statement parser for Argentine bank statements.
 * Uses pdfjs-dist to extract text, then applies bank-specific patterns.
 *
 * Public API:
 *   parsePdfStatement(file) → Promise<{ transactions, bank } | { unmatched: true, error?: string }>
 *
 * All processing happens in the browser — no data leaves the user's machine.
 */

import { parseArgentineAmount, extractDate } from './parseHelpers'

// ── Bank detection + line patterns ───────────────────────────────────────────
//
// Each entry:
//   bank     — display name
//   detect   — regex tested against the full extracted text to identify the bank
//   txLine   — regex (with /g flag) applied to the full text to extract transactions
//              Must have named groups: amount (required), merchant (optional), date (optional)

const PDF_BANK_PATTERNS = [
  {
    bank: 'Santander',
    detect: /santander/i,
    // Lines like: "15/01/2025  PEDIDOSYA BUENAS COMIDAS   $ 2.500,00"
    txLine: /(\d{2}\/\d{2}\/\d{4})\s{2,}(.+?)\s{2,}\$\s*([\d.,]+)/g,
    extract: (m) => ({ date: m[1], merchant: m[2].trim(), rawAmount: m[3] }),
  },
  {
    bank: 'BBVA',
    detect: /bbva/i,
    // Lines like: "15/01/2025  SUPERMERCADO DISCO  12.340,50"
    txLine: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d]{1,3}(?:\.\d{3})*,\d{2})\s*$/gm,
    extract: (m) => ({ date: m[1], merchant: m[2].trim(), rawAmount: m[3] }),
  },
  {
    bank: 'Galicia',
    detect: /banco\s*galicia/i,
    // Lines like: "15/01  RAPPI*RESTAURANTE   8.900,00"
    txLine: /(\d{2}\/\d{2})\s+(.+?)\s+([\d]{1,3}(?:\.\d{3})*,\d{2})/g,
    extract: (m) => ({
      date: (() => {
        const [d, mo] = m[1].split('/')
        const year = new Date().getFullYear()
        return `${year}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`
      })(),
      merchant: m[2].trim(),
      rawAmount: m[3],
    }),
  },
  {
    bank: 'Mercado Pago',
    detect: /mercado\s*pago/i,
    // Lines like: "15/01/2025  Pago a Supermercado ABC  $ 2.500,00"
    txLine: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+\$\s*([\d.,]+)/g,
    extract: (m) => ({ date: m[1], merchant: m[2].trim(), rawAmount: m[3] }),
  },
  {
    bank: 'Naranja X',
    detect: /naranja\s*x?/i,
    // Lines like: "15/01/2025  NETFLIX.COM  1.299,99"
    txLine: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d]{1,3}(?:\.\d{3})*,\d{2})/g,
    extract: (m) => ({ date: m[1], merchant: m[2].trim(), rawAmount: m[3] }),
  },
]

// ── Text extraction ───────────────────────────────────────────────────────────

async function extractTextFromPdf(file) {
  // Dynamically import pdfjs-dist so it only loads when this function is called
  const pdfjsLib = await import('pdfjs-dist')

  // Configure worker — Vite serves the worker file as a URL
  const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map((item) => item.str).join(' ')
    pages.push(pageText)
  }

  return pages.join('\n')
}

// ── Main parser ───────────────────────────────────────────────────────────────

/**
 * @param {File} file - A PDF File object from a file input
 * @returns {Promise<
 *   { transactions: Array<{date,description,amount}>, bank: string } |
 *   { unmatched: true } |
 *   { unmatched: true, error: string }
 * >}
 */
export async function parsePdfStatement(file) {
  let text
  try {
    text = await extractTextFromPdf(file)
  } catch (err) {
    return { unmatched: true, error: err.message }
  }

  if (!text || !text.trim()) {
    return { unmatched: true, error: 'Could not extract text from PDF.' }
  }

  // Try each bank pattern
  for (const { bank, detect, txLine, extract } of PDF_BANK_PATTERNS) {
    if (!detect.test(text)) continue

    // Reset regex lastIndex before using
    txLine.lastIndex = 0
    const transactions = []
    let match

    while ((match = txLine.exec(text)) !== null) {
      const { date: rawDate, merchant, rawAmount } = extract(match)

      const amount = parseArgentineAmount(rawAmount)
      if (!amount || amount <= 0) continue

      const date = rawDate.includes('/') && rawDate.length <= 6
        ? rawDate // already handled in extract for short dates
        : extractDate(rawDate)

      transactions.push({
        date,
        description: merchant || bank,
        amount,
      })
    }

    if (transactions.length > 0) {
      return { transactions, bank }
    }

    // Bank was detected but no transactions matched — still report it as unmatched
    // so the user gets a useful message
    return { unmatched: true }
  }

  return { unmatched: true }
}
