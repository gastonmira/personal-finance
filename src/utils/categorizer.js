/**
 * Categorizer service.
 * Current implementation: keyword-based rule matching.
 * Interface designed to be swapped for an LLM (Claude / OpenAI) later.
 *
 * Future LLM plug-in:
 *   export async function categorizeWithLLM(transactions, apiKey) { ... }
 */

export const CATEGORIES = [
  'Supermercado',
  'Restaurantes',
  'Transporte',
  'Servicios',
  'Salud',
  'Entretenimiento',
  'Indumentaria',
  'Tecnología',
  'Educación',
  'Otros',
]

const RULES = [
  {
    category: 'Supermercado',
    keywords: [
      'walmart', 'carrefour', 'coto', 'dia', 'jumbo', 'disco', 'vea',
      'lidl', 'supermercado', 'mercado', 'hipermercado', 'chango mas',
      'changomas', 'easy', 'sodimac', 'makro', 'mayorista', 'la anonima',
      'la anónima', 'cordiez', 'libertad', 'tia', 'tía',
    ],
  },
  {
    category: 'Restaurantes',
    keywords: [
      'mcdonalds', 'mc donald', 'burger king', 'wendy', 'kfc', 'subway',
      'pizza', 'sushi', 'restaurant', 'restaurante', 'cafe', 'cafeteria',
      'cafetería', 'bar ', 'parrilla', 'bodegon', 'bodegón', 'mostaza',
      'rappi', 'pedidos ya', 'pedidosya', 'rappi', 'delivery', 'dominos',
      'domino', 'telepizza', 'starbucks', 'havanna', 'freddo', 'helado',
      'heladeria', 'heladería', 'cerveceria', 'cervecería',
    ],
  },
  {
    category: 'Transporte',
    keywords: [
      'uber', 'cabify', 'didi', 'ola cab', 'remis', 'taxi', 'peaje',
      'autopista', 'sube', 'nafta', 'combustible', 'shell', 'ypf', 'axion',
      'axión', 'aeropuerto', 'aerolineas', 'aerolíneas', 'latam', 'vuelo',
      'flybondi', 'jetsmart', 'buquebus', 'crucero', 'estacionamiento',
      'parking', 'garaje', 'garage', 'gomeria', 'gomería', 'repuesto',
    ],
  },
  {
    category: 'Servicios',
    keywords: [
      'edesur', 'edenor', 'aysa', 'metrogas', 'telefonica', 'telecom',
      'personal ', 'claro', 'movistar', 'fibertel', 'cablevision',
      'cablevisión', 'directv', 'flow', 'netflix', 'spotify', 'disney',
      'amazon prime', 'hbo', 'youtube', 'apple', 'google play',
      'municipalidad', 'arba', 'afip', 'seguro', 'alquiler', 'expensas',
      'consorcio', 'luz ', 'gas ', 'agua ', 'internet', 'hosting',
    ],
  },
  {
    category: 'Salud',
    keywords: [
      'farmacia', 'farmacias', 'farmacity', 'drogueria', 'droguería',
      'medico', 'médico', 'medica', 'médica', 'clinica', 'clínica',
      'hospital', 'sanatorio', 'laboratorio', 'analisis', 'análisis',
      'osde', 'swiss medical', 'galeno', 'prepaga', 'obra social',
      'dentista', 'odontologia', 'odontología', 'optica', 'óptica',
      'psicologo', 'psicólogo', 'fisio', 'kinesia', 'gym', 'gimnasio',
    ],
  },
  {
    category: 'Entretenimiento',
    keywords: [
      'cine', 'teatro', 'recital', 'show', 'entrada', 'ticketek',
      'ticketmaster', 'eventbrite', 'musica', 'música', 'steam',
      'playstation', 'xbox', 'nintendo', 'epic games', 'juego', 'casino',
      'bingo', 'bowling', 'karting', 'escape room', 'laser',
    ],
  },
  {
    category: 'Indumentaria',
    keywords: [
      'zara', 'h&m', 'hym', 'mango', 'adidas', 'nike', 'puma', 'fila',
      'lacoste', 'tommy', 'levis', 'leví', 'gap', 'forever 21',
      'ropa', 'calzado', 'zapatillas', 'zapatos', 'botines', 'camisa',
      'vestido', 'falabella', 'paris', 'tienda inglesa', 'andreani',
    ],
  },
  {
    category: 'Tecnología',
    keywords: [
      'apple store', 'icloud', 'mercado libre', 'mercadolibre',
      'tienda mia', 'fravega', 'garbarino', 'megatone', 'musimundo',
      'compumundo', 'dell', 'lenovo', 'samsung', 'lg ', 'htc',
      'celular', 'notebook', 'computadora', 'tablet', 'iphone',
      'electronica', 'electrónica', 'gadget',
    ],
  },
  {
    category: 'Educación',
    keywords: [
      'universidad', 'colegio', 'escuela', 'instituto', 'academia',
      'udemy', 'coursera', 'platzi', 'educacion', 'educación', 'libro',
      'libreria', 'librería', 'editorial', 'capacitacion', 'capacitación',
      'curso', 'materia', 'posgrado', 'postgrado', 'maestria', 'maestría',
    ],
  },
]

/**
 * Categorizes a list of raw transactions using keyword rules.
 * @param {Array<{ date: string, description: string, amount: number }>} transactions
 * @returns {Array<{ id: string, date: string, description: string, amount: number, category: string }>}
 */
export function categorizeTransactions(transactions) {
  return transactions.map((tx, idx) => ({
    id: `tx-${Date.now()}-${idx}`,
    ...tx,
    category: detectCategory(tx.description),
  }))
}

function detectCategory(description) {
  if (!description) return 'Otros'
  const lower = description.toLowerCase()
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.category
    }
  }
  return 'Otros'
}
