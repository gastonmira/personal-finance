import { describe, it, expect } from 'vitest'
import { detectCategory, categorizeTransactions, CATEGORIES } from './categorizer.js'

describe('detectCategory', () => {
  it('categorizes WALMART COMPRAS as Supermercado (index 0)', () => {
    const result = detectCategory('WALMART COMPRAS')
    expect(result).toBe(CATEGORIES[0]) // 'Supermercado'
  })

  it('categorizes MCDONALD as Restaurantes (index 1)', () => {
    const result = detectCategory('MCDONALD')
    expect(result).toBe(CATEGORIES[1]) // 'Restaurantes'
  })

  it('categorizes UBER as Transporte (index 2)', () => {
    const result = detectCategory('UBER')
    expect(result).toBe(CATEGORIES[2]) // 'Transporte'
  })

  it('categorizes NETFLIX as a service or entertainment category', () => {
    const result = detectCategory('NETFLIX')
    // NETFLIX is listed under Servicios keywords
    const validCategories = [CATEGORIES[3], CATEGORIES[5]] // 'Servicios' or 'Entretenimiento'
    expect(validCategories).toContain(result)
  })

  it('categorizes an unknown merchant as Otros (last category)', () => {
    const result = detectCategory('RANDOM UNKNOWN MERCHANT XYZ')
    expect(result).toBe(CATEGORIES[CATEGORIES.length - 1]) // 'Otros'
  })

  it('categorizes undefined/empty description as Otros', () => {
    expect(detectCategory('')).toBe('Otros')
    expect(detectCategory(null)).toBe('Otros')
    expect(detectCategory(undefined)).toBe('Otros')
  })
})

describe('categorizeTransactions', () => {
  const sampleTransactions = [
    { date: '2026-03-01', description: 'CARREFOUR', amount: 5000 },
    { date: '2026-03-02', description: 'RAPPI', amount: 1500 },
  ]

  it('adds id and category fields to each transaction', () => {
    const result = categorizeTransactions(sampleTransactions)
    expect(result).toHaveLength(2)
    result.forEach((tx) => {
      expect(tx).toHaveProperty('id')
      expect(tx).toHaveProperty('category')
      expect(typeof tx.id).toBe('string')
      expect(typeof tx.category).toBe('string')
    })
  })

  it('preserves original transaction fields', () => {
    const result = categorizeTransactions(sampleTransactions)
    expect(result[0].date).toBe('2026-03-01')
    expect(result[0].description).toBe('CARREFOUR')
    expect(result[0].amount).toBe(5000)
  })

  it('assigns correct Spanish categories by default', () => {
    const result = categorizeTransactions(sampleTransactions)
    expect(result[0].category).toBe('Supermercado') // CARREFOUR
    expect(result[1].category).toBe('Restaurantes') // RAPPI
  })

  it('returns English category names when localeCategories in English are passed', () => {
    const englishCategories = [
      'Supermarket',
      'Restaurants',
      'Transport',
      'Services',
      'Health',
      'Entertainment',
      'Clothing',
      'Technology',
      'Education',
      'Other',
    ]
    const result = categorizeTransactions(sampleTransactions, englishCategories)
    expect(result[0].category).toBe('Supermarket') // CARREFOUR → index 0
    expect(result[1].category).toBe('Restaurants') // RAPPI → index 1
  })

  it('assigns fallback "Other" when using English localeCategories and merchant is unknown', () => {
    const englishCategories = [
      'Supermarket', 'Restaurants', 'Transport', 'Services',
      'Health', 'Entertainment', 'Clothing', 'Technology', 'Education', 'Other',
    ]
    const unknownTx = [{ date: '2026-03-01', description: 'RANDOM MERCHANT XYZ', amount: 100 }]
    const result = categorizeTransactions(unknownTx, englishCategories)
    expect(result[0].category).toBe('Other')
  })
})
