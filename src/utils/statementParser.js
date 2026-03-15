import Papa from 'papaparse'
import * as XLSX from 'xlsx'

/**
 * Parses a CSV file into { headers, rows }.
 * @param {File} file
 * @returns {Promise<{ headers: string[], rows: string[][] }>}
 */
export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (result) => {
        if (!result.data || result.data.length === 0) {
          reject(new Error('El archivo CSV está vacío o no pudo leerse.'))
          return
        }
        const [headers, ...rows] = result.data
        resolve({ headers: headers.map(String), rows })
      },
      error: (err) => reject(new Error(`Error leyendo CSV: ${err.message}`)),
    })
  })
}

/**
 * Parses an XLS/XLSX file into { headers, rows }.
 * Uses the first sheet that has data.
 * @param {File} file
 * @returns {Promise<{ headers: string[], rows: (string|number)[][] }>}
 */
export function parseXLSXStatement(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        const sheetName = wb.SheetNames[0]
        const raw = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
          header: 1,
          defval: '',
        })

        // Find the first non-empty row as headers
        const firstNonEmpty = raw.findIndex((r) => r.some((cell) => cell !== ''))
        if (firstNonEmpty === -1) {
          reject(new Error('El archivo XLS está vacío.'))
          return
        }

        const headers = raw[firstNonEmpty].map(String)
        const rows = raw.slice(firstNonEmpty + 1).filter((r) =>
          r.some((cell) => cell !== '' && cell !== null && cell !== undefined)
        )

        resolve({ headers, rows })
      } catch (err) {
        reject(new Error(`Error leyendo XLS: ${err.message}`))
      }
    }
    reader.onerror = () => reject(new Error('Error leyendo el archivo'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Detects file type and dispatches to the right parser.
 * @param {File} file
 * @returns {Promise<{ headers: string[], rows: any[][] }>}
 */
export function parseStatementFile(file) {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv')) return parseCSV(file)
  if (name.endsWith('.xls') || name.endsWith('.xlsx')) return parseXLSXStatement(file)
  return Promise.reject(new Error('Formato no soportado. Usá CSV o XLS/XLSX.'))
}

/**
 * Given raw rows + column indices, produces normalized transaction objects.
 * @param {any[][]} rows
 * @param {{ dateIdx: number, descIdx: number, amountIdx: number }} mapping
 * @returns {Array<{ date: string, description: string, amount: number }>}
 */
export function buildTransactions(rows, { dateIdx, descIdx, amountIdx }) {
  const result = []
  for (const row of rows) {
    const rawAmount = row[amountIdx]
    const amount = parseAmount(rawAmount)
    if (amount === null || amount === 0) continue  // skip empty/zero rows

    const date = String(row[dateIdx] ?? '').trim()
    const description = String(row[descIdx] ?? '').trim()
    if (!description) continue

    result.push({ date, description, amount })
  }
  return result
}

function parseAmount(val) {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'number') return Math.abs(val)
  // Handle strings like "1.234,56" or "$1,234.56" or "-15000"
  const cleaned = String(val)
    .replace(/[$\s]/g, '')
    .replace(/\./g, '')    // remove thousands separator (. in es-AR)
    .replace(',', '.')     // decimal separator
    .replace('-', '')      // take absolute value
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : Math.abs(n)
}
