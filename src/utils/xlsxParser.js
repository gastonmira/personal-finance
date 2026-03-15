import * as XLSX from 'xlsx'

const MONTH_MAP = {
  enero: '01', febrero: '02', marzo: '03', abril: '04',
  mayo: '05', junio: '06', julio: '07', agosto: '08',
  septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
}

function toNum(val) {
  if (val === null || val === undefined || val === '' || val === '-') return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

function isMonthName(val) {
  return typeof val === 'string' && !!MONTH_MAP[val.trim().toLowerCase()]
}

function rowToMonthKey(row, year) {
  const m = MONTH_MAP[String(row[0]).trim().toLowerCase()]
  return m ? `${year}-${m}` : null
}

// cols: B=1 Santander, C=2 Amex, D=3 Provincia, E=4 UALA, G=6 TOTAL
function parseARSBlock(rows, year) {
  const result = {}
  for (const row of rows) {
    if (!isMonthName(row[0])) continue
    const key = rowToMonthKey(row, year)
    if (!key) continue
    result[key] = {
      cards: {
        santander: toNum(row[1]),
        amex: toNum(row[2]),
        provincia: toNum(row[3]),
        uala: toNum(row[4]),
      },
      totalXLS: toNum(row[6]),
    }
  }
  return result
}

// cols: B=1 Dolares (cobrado), C=2 Ventas (vendido)
function parseUSDBlock(rows, year) {
  const result = {}
  for (const row of rows) {
    if (!isMonthName(row[0])) continue
    const key = rowToMonthKey(row, year)
    if (!key) continue
    result[key] = {
      usdEarned: toNum(row[1]),
      usdSold: toNum(row[2]),
    }
  }
  return result
}

function findHeaderIdx(rows, colIdx, substring) {
  return rows.findIndex(
    (r) => typeof r[colIdx] === 'string' && r[colIdx].toLowerCase().includes(substring)
  )
}

export function parseXLSX(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })

        if (!wb.SheetNames.includes('2025')) {
          reject(new Error('No se encontró la hoja "2025" en el archivo.'))
          return
        }

        const raw = XLSX.utils.sheet_to_json(wb.Sheets['2025'], { header: 1, defval: null })

        // ── Find 2026 year marker (col A = 2026) ──────────────────────────
        const marker2026 = raw.findIndex((r) => {
          const v = r[0]
          return v === 2026 || String(v).trim() === '2026'
        })

        // ── 2025 section (rows before marker) ────────────────────────────
        const sec2025 = marker2026 > 0 ? raw.slice(0, marker2026) : raw
        const usdHdr25 = findHeaderIdx(sec2025, 1, 'dolar')
        const arsData25 = parseARSBlock(
          usdHdr25 > 0 ? sec2025.slice(0, usdHdr25) : sec2025,
          '2025'
        )
        const usdData25 = usdHdr25 > 0
          ? parseUSDBlock(sec2025.slice(usdHdr25 + 1), '2025')
          : {}

        // ── 2026 section (rows after marker) ─────────────────────────────
        let arsData26 = {}
        let usdData26 = {}

        if (marker2026 > 0) {
          const sec2026 = raw.slice(marker2026 + 1)
          const arsHdr26 = findHeaderIdx(sec2026, 1, 'santander')
          const usdHdr26 = findHeaderIdx(sec2026, 1, 'dolar')

          // ARS block: from after ARS header up to USD header
          const arsStart = arsHdr26 >= 0 ? arsHdr26 + 1 : 0
          const arsEnd = usdHdr26 > arsStart ? usdHdr26 : undefined
          arsData26 = parseARSBlock(sec2026.slice(arsStart, arsEnd), '2026')

          // USD block: from after USD header
          if (usdHdr26 >= 0) {
            usdData26 = parseUSDBlock(sec2026.slice(usdHdr26 + 1), '2026')
          }
        }

        // ── Merge into unified months object ─────────────────────────────
        const merged = {}
        const allKeys = new Set([
          ...Object.keys(arsData25), ...Object.keys(usdData25),
          ...Object.keys(arsData26), ...Object.keys(usdData26),
        ])

        for (const key of allKeys) {
          const ars = arsData25[key] ?? arsData26[key]
          const usd = usdData25[key] ?? usdData26[key]
          merged[key] = {
            cards: ars?.cards ?? {},
            totalXLS: ars?.totalXLS ?? null,
            usdEarned: usd?.usdEarned ?? null,
            usdSold: usd?.usdSold ?? null,
          }
        }

        resolve(merged)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Error leyendo el archivo'))
    reader.readAsArrayBuffer(file)
  })
}
