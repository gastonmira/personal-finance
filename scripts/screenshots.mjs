import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'

const dummy = {
  state: {
    months: {
      "2025-11": {
        cards: { santander: 312450, amex: 187600, provincia: 94800, uala: 45200 },
        totalXLS: 640050,
        usdEarned: 1800, usdSold: 1200,
        statements: { santander: 315000, amex: 190000, provincia: 96000, uala: 45000 },
        transactions: [
          { id: "tx-1", date: "2025-10-03", description: "CARREFOUR PALERMO", amount: 58400, category: "Supermarket" },
          { id: "tx-2", date: "2025-10-05", description: "UBER TRIP", amount: 3200, category: "Transport" },
          { id: "tx-3", date: "2025-10-07", description: "NETFLIX", amount: 8500, category: "Services" },
          { id: "tx-4", date: "2025-10-09", description: "FARMACITY CENTRO", amount: 12300, category: "Health" },
          { id: "tx-5", date: "2025-10-11", description: "DON JULIO PARRILLA", amount: 34500, category: "Restaurants" },
          { id: "tx-6", date: "2025-10-13", description: "DISNEY+", amount: 6800, category: "Services" },
          { id: "tx-7", date: "2025-10-15", description: "YPF COMBUSTIBLE", amount: 28900, category: "Transport" },
          { id: "tx-8", date: "2025-10-17", description: "ZARA ALTO PALERMO", amount: 47200, category: "Clothing" },
          { id: "tx-9", date: "2025-10-19", description: "SPOTIFY", amount: 4200, category: "Services" },
          { id: "tx-10", date: "2025-10-21", description: "COTO BELGRANO", amount: 41600, category: "Supermarket" },
          { id: "tx-11", date: "2025-10-23", description: "CINE HOYTS", amount: 9800, category: "Entertainment" },
          { id: "tx-12", date: "2025-10-25", description: "UBER EATS", amount: 15400, category: "Restaurants" },
          { id: "tx-13", date: "2025-10-27", description: "EDESUR", amount: 22100, category: "Services" },
          { id: "tx-14", date: "2025-10-29", description: "APPLE ICLOUD", amount: 3500, category: "Technology" },
          { id: "tx-15", date: "2025-10-31", description: "JUMBO NORDELTA", amount: 52800, category: "Supermarket" },
        ]
      },
      "2025-12": {
        cards: { santander: 358200, amex: 214300, provincia: 108500, uala: 52100 },
        totalXLS: 733100,
        usdEarned: 2100, usdSold: 1500,
        statements: { santander: 360000, amex: 215000, provincia: 110000, uala: 52000 },
        transactions: [
          { id: "tx-16", date: "2025-11-02", description: "WALMART AVELLANEDA", amount: 63200, category: "Supermarket" },
          { id: "tx-17", date: "2025-11-04", description: "CABIFY", amount: 4100, category: "Transport" },
          { id: "tx-18", date: "2025-11-06", description: "MERCADO LIBRE", amount: 38900, category: "Technology" },
          { id: "tx-19", date: "2025-11-08", description: "SWISS MEDICAL", amount: 45000, category: "Health" },
          { id: "tx-20", date: "2025-11-10", description: "EL PREFERIDO BAR", amount: 28700, category: "Restaurants" },
          { id: "tx-21", date: "2025-11-12", description: "EDENOR", amount: 24300, category: "Services" },
          { id: "tx-22", date: "2025-11-14", description: "ADIDAS OUTLET", amount: 56400, category: "Clothing" },
          { id: "tx-23", date: "2025-11-16", description: "PEDIDOS YA", amount: 18600, category: "Restaurants" },
          { id: "tx-24", date: "2025-11-18", description: "CARREFOUR EXPRESS", amount: 47800, category: "Supermarket" },
          { id: "tx-25", date: "2025-11-20", description: "UDEMY CURSO", amount: 12500, category: "Education" },
          { id: "tx-26", date: "2025-11-22", description: "AUTOPISTA NORTE", amount: 3200, category: "Transport" },
          { id: "tx-27", date: "2025-11-24", description: "TEATRO COLON", amount: 22000, category: "Entertainment" },
          { id: "tx-28", date: "2025-11-26", description: "FARMACIA DEL PUEBLO", amount: 9800, category: "Health" },
          { id: "tx-29", date: "2025-11-28", description: "NETFLIX", amount: 8500, category: "Services" },
          { id: "tx-30", date: "2025-11-30", description: "JUMBO PALERMO", amount: 55100, category: "Supermarket" },
        ]
      },
      "2026-01": {
        cards: { santander: 391500, amex: 243800, provincia: 121200, uala: 61400 },
        totalXLS: 817900,
        usdEarned: 2400, usdSold: 1800,
        statements: { santander: 395000, amex: 245000, provincia: 122000, uala: 61000 },
        transactions: [
          { id: "tx-31", date: "2025-12-02", description: "COTO CABALLITO", amount: 71300, category: "Supermarket" },
          { id: "tx-32", date: "2025-12-04", description: "UBER VIAJE", amount: 5400, category: "Transport" },
          { id: "tx-33", date: "2025-12-06", description: "FRAVEGA TV", amount: 84500, category: "Technology" },
          { id: "tx-34", date: "2025-12-08", description: "OSDE PREPAGA", amount: 52000, category: "Health" },
          { id: "tx-35", date: "2025-12-10", description: "LA CABRERA PARRILLA", amount: 42300, category: "Restaurants" },
          { id: "tx-36", date: "2025-12-12", description: "TELECOM INTERNET", amount: 18500, category: "Services" },
          { id: "tx-37", date: "2025-12-14", description: "NIKE SHOP", amount: 68900, category: "Clothing" },
          { id: "tx-38", date: "2025-12-16", description: "RAPPI DELIVERY", amount: 22400, category: "Restaurants" },
          { id: "tx-39", date: "2025-12-18", description: "CARREFOUR PALERMO", amount: 65200, category: "Supermarket" },
          { id: "tx-40", date: "2025-12-20", description: "COURSERA", amount: 18900, category: "Education" },
          { id: "tx-41", date: "2025-12-22", description: "YPF NAFTA", amount: 32100, category: "Transport" },
          { id: "tx-42", date: "2025-12-24", description: "STEAM JUEGO", amount: 14200, category: "Entertainment" },
          { id: "tx-43", date: "2025-12-26", description: "FARMACITY", amount: 16800, category: "Health" },
          { id: "tx-44", date: "2025-12-28", description: "SPOTIFY", amount: 4200, category: "Services" },
          { id: "tx-45", date: "2025-12-30", description: "JUMBO NORDELTA", amount: 59400, category: "Supermarket" },
        ]
      },
      "2026-02": {
        cards: { santander: 428300, amex: 267100, provincia: 134500, uala: 58200 },
        totalXLS: 888100,
        usdEarned: 2800, usdSold: 2000,
        statements: { santander: 430000, amex: 268000, provincia: 135000, uala: 58000 },
        transactions: [
          { id: "tx-46", date: "2026-01-03", description: "WALMART PALERMO", amount: 78400, category: "Supermarket" },
          { id: "tx-47", date: "2026-01-05", description: "CABIFY AEROPUERTO", amount: 12300, category: "Transport" },
          { id: "tx-48", date: "2026-01-07", description: "APPLE STORE", amount: 95000, category: "Technology" },
          { id: "tx-49", date: "2026-01-09", description: "SWISS MEDICAL", amount: 55000, category: "Health" },
          { id: "tx-50", date: "2026-01-11", description: "STARBUCKS MICROCENTRO", amount: 8900, category: "Restaurants" },
          { id: "tx-51", date: "2026-01-13", description: "MOVISTAR", amount: 22000, category: "Services" },
          { id: "tx-52", date: "2026-01-15", description: "ZARA UNICENTER", amount: 72300, category: "Clothing" },
          { id: "tx-53", date: "2026-01-17", description: "PEDIDOS YA", amount: 19800, category: "Restaurants" },
          { id: "tx-54", date: "2026-01-19", description: "COTO BELGRANO", amount: 68700, category: "Supermarket" },
          { id: "tx-55", date: "2026-01-21", description: "PLATZI SUSCRIPCION", amount: 24500, category: "Education" },
          { id: "tx-56", date: "2026-01-23", description: "PEAJE ACCESO NORTE", amount: 4800, category: "Transport" },
          { id: "tx-57", date: "2026-01-25", description: "RECITAL INDIO SOLARI", amount: 35000, category: "Entertainment" },
          { id: "tx-58", date: "2026-01-27", description: "FARMACITY FLORES", amount: 21300, category: "Health" },
          { id: "tx-59", date: "2026-01-29", description: "NETFLIX", amount: 8500, category: "Services" },
          { id: "tx-60", date: "2026-01-31", description: "CARREFOUR PALERMO", amount: 82400, category: "Supermarket" },
        ]
      }
    }
  },
  version: 0
}

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width: 1280, height: 800 })

// Seed localStorage
await page.goto(BASE)
await page.evaluate((data) => {
  localStorage.setItem('personal-fin-storage', JSON.stringify(data))
}, dummy)

const shots = [
  { url: `${BASE}/?lang=en`, file: 'dashboard.png', wait: 500 },
  { url: `${BASE}/mes?lang=en`, file: 'monthly.png', wait: 500 },
  { url: `${BASE}/ingresar?lang=en`, file: 'add-data.png', wait: 500, scrollY: 200 },
  { url: `${BASE}/reportes?lang=en`, file: 'reports.png', wait: 800 },
]

for (const { url, file, wait, scrollY } of shots) {
  await page.goto(url)
  await page.waitForTimeout(wait)
  if (scrollY) await page.evaluate((y) => window.scrollBy(0, y), scrollY)
  await page.screenshot({ path: `public/screenshots/${file}` })
  console.log(`✓ ${file}`)
}

await browser.close()
console.log('Done.')
