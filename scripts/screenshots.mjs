import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

mkdirSync('docs/screenshots', { recursive: true })

const BASE = 'http://localhost:5173'

const STORE_DATA = {
  state: {
    config: {
      cards: [
        { id: 'visa-galicia', name: 'Visa Galicia', color: '#ef4444' },
        { id: 'amex', name: 'Amex', color: '#3b82f6' },
        { id: 'debito', name: 'Débito', color: '#10b981' },
      ]
    },
    months: {
      '2025-09': {
        statements: { 'visa-galicia': 180000, amex: 95000, debito: 42000 },
        usdEarned: 1200, usdSold: 800,
        transactions: []
      },
      '2025-10': {
        statements: { 'visa-galicia': 210000, amex: 110000, debito: 55000 },
        usdEarned: 1200, usdSold: 1200,
        transactions: [
          { id: 'tx-1', date: '2025-10-03', description: 'CARREFOUR PALERMO', amount: 58400, category: 'Supermarket' },
          { id: 'tx-2', date: '2025-10-05', description: 'UBER TRIP', amount: 3200, category: 'Transport' },
          { id: 'tx-3', date: '2025-10-07', description: 'NETFLIX', amount: 8500, category: 'Services' },
          { id: 'tx-4', date: '2025-10-09', description: 'FARMACITY', amount: 12300, category: 'Health' },
          { id: 'tx-5', date: '2025-10-11', description: 'DON JULIO PARRILLA', amount: 34500, category: 'Restaurants' },
          { id: 'tx-6', date: '2025-10-13', description: 'DISNEY+', amount: 6800, category: 'Services' },
          { id: 'tx-7', date: '2025-10-15', description: 'YPF COMBUSTIBLE', amount: 28900, category: 'Transport' },
          { id: 'tx-8', date: '2025-10-17', description: 'ZARA ALTO PALERMO', amount: 47200, category: 'Clothing' },
          { id: 'tx-9', date: '2025-10-19', description: 'SPOTIFY', amount: 4200, category: 'Services' },
          { id: 'tx-10', date: '2025-10-21', description: 'COTO BELGRANO', amount: 41600, category: 'Supermarket' },
        ]
      },
      '2025-11': {
        statements: { 'visa-galicia': 195000, amex: 88000, debito: 60000 },
        usdEarned: 1500, usdSold: 500,
        transactions: [
          { id: 'tx-11', date: '2025-11-02', description: 'WALMART AVELLANEDA', amount: 63200, category: 'Supermarket' },
          { id: 'tx-12', date: '2025-11-04', description: 'PEDIDOS YA', amount: 18600, category: 'Restaurants' },
          { id: 'tx-13', date: '2025-11-06', description: 'MERCADO LIBRE', amount: 38900, category: 'Technology' },
          { id: 'tx-14', date: '2025-11-08', description: 'SWISS MEDICAL', amount: 45000, category: 'Health' },
          { id: 'tx-15', date: '2025-11-10', description: 'EL PREFERIDO BAR', amount: 28700, category: 'Restaurants' },
          { id: 'tx-16', date: '2025-11-12', description: 'EDENOR', amount: 24300, category: 'Services' },
          { id: 'tx-17', date: '2025-11-14', description: 'ADIDAS OUTLET', amount: 56400, category: 'Clothing' },
          { id: 'tx-18', date: '2025-11-16', description: 'TEATRO COLON', amount: 22000, category: 'Entertainment' },
        ]
      },
      '2025-12': {
        statements: { 'visa-galicia': 320000, amex: 145000, debito: 75000 },
        usdEarned: 1500, usdSold: 1500,
        transactions: [
          { id: 'tx-21', date: '2025-12-02', description: 'COTO CABALLITO', amount: 71300, category: 'Supermarket' },
          { id: 'tx-22', date: '2025-12-04', description: 'UBER VIAJE', amount: 5400, category: 'Transport' },
          { id: 'tx-23', date: '2025-12-06', description: 'FRAVEGA TV', amount: 84500, category: 'Technology' },
          { id: 'tx-24', date: '2025-12-08', description: 'OSDE PREPAGA', amount: 52000, category: 'Health' },
          { id: 'tx-25', date: '2025-12-10', description: 'LA CABRERA PARRILLA', amount: 42300, category: 'Restaurants' },
          { id: 'tx-26', date: '2025-12-12', description: 'TELECOM INTERNET', amount: 18500, category: 'Services' },
          { id: 'tx-27', date: '2025-12-14', description: 'NIKE SHOP', amount: 68900, category: 'Clothing' },
          { id: 'tx-28', date: '2025-12-16', description: 'RAPPI DELIVERY', amount: 22400, category: 'Restaurants' },
          { id: 'tx-29', date: '2025-12-18', description: 'CARREFOUR PALERMO', amount: 65200, category: 'Supermarket' },
          { id: 'tx-30', date: '2025-12-24', description: 'STEAM JUEGO', amount: 14200, category: 'Entertainment' },
        ]
      },
      '2026-01': {
        statements: { 'visa-galicia': 240000, amex: 102000, debito: 48000 },
        usdEarned: 1500, usdSold: 900,
        transactions: [
          { id: 'tx-31', date: '2026-01-03', description: 'WALMART PALERMO', amount: 78400, category: 'Supermarket' },
          { id: 'tx-32', date: '2026-01-07', description: 'APPLE STORE', amount: 95000, category: 'Technology' },
          { id: 'tx-33', date: '2026-01-09', description: 'SWISS MEDICAL', amount: 55000, category: 'Health' },
          { id: 'tx-34', date: '2026-01-11', description: 'STARBUCKS', amount: 8900, category: 'Restaurants' },
          { id: 'tx-35', date: '2026-01-13', description: 'MOVISTAR', amount: 22000, category: 'Services' },
          { id: 'tx-36', date: '2026-01-15', description: 'ZARA UNICENTER', amount: 72300, category: 'Clothing' },
          { id: 'tx-37', date: '2026-01-19', description: 'COTO BELGRANO', amount: 68700, category: 'Supermarket' },
          { id: 'tx-38', date: '2026-01-25', description: 'RECITAL', amount: 35000, category: 'Entertainment' },
        ]
      },
    }
  },
  version: 0
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })

// Inject store data on every navigation
await context.addInitScript((data) => {
  localStorage.setItem('personal-fin-storage', JSON.stringify(data))
}, STORE_DATA)

const page = await context.newPage()

const shots = [
  { path: '/',              file: 'docs/screenshots/01-dashboard.png',    label: 'Dashboard' },
  { path: '/mes',           file: 'docs/screenshots/02-monthly.png',      label: 'Monthly View' },
  { path: '/reportes',      file: 'docs/screenshots/03-reports.png',      label: 'Reports', wait: 1200 },
  { path: '/ingresar',      file: 'docs/screenshots/04-add-data.png',     label: 'Add Data' },
  { path: '/configuracion', file: 'docs/screenshots/05-settings.png',     label: 'Settings' },
]

for (const { path, file, label, wait = 700 } of shots) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(wait)
  await page.screenshot({ path: file })
  console.log(`✓ ${label} → ${file}`)
}

// Getting started (empty state) — separate context with no data
const emptyCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
const emptyPage = await emptyCtx.newPage()
await emptyPage.goto(BASE, { waitUntil: 'networkidle' })
await emptyPage.waitForTimeout(500)
await emptyPage.screenshot({ path: 'docs/screenshots/00-getting-started.png' })
console.log('✓ Getting Started → docs/screenshots/00-getting-started.png')

await browser.close()
console.log('\nAll screenshots saved to docs/screenshots/')
