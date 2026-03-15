import { describe, it, expect } from 'vitest'
import { parseSmsTransaction, parseSmsBlock } from './smsParser.js'

// Today's date in YYYY-MM-DD for fallback date tests
const TODAY = new Date().toISOString().slice(0, 10)

describe('parseSmsTransaction', () => {
  describe('Santander', () => {
    it('parses a Santander purchase notification', () => {
      const text = `Pagaste $20.010,00\nA PedidosYa*Gordys con tu Tarjeta Santander Visa Crédito terminada en 5279, el 14/03/2026 a las 20:40 horas. (s.e.u.o.)`
      const result = parseSmsTransaction(text)
      expect(result).not.toBeNull()
      expect(result.description).toBe('PedidosYa*Gordys')
      expect(result.amount).toBeCloseTo(20010.00, 2)
      expect(result.date).toBe('2026-03-14')
      expect(result.bank).toBe('Santander')
    })

    it('parses a Santander auto debit notification', () => {
      const text = `Aviso de débito automático\nDebitamos $132.838,52 por el pago a ZURICH SEGUROS de tu Tarjeta Santander Visa Crédito terminada en 5279 (s.e.u.o.).`
      const result = parseSmsTransaction(text)
      expect(result).not.toBeNull()
      expect(result.description).toBe('ZURICH SEGUROS')
      expect(result.amount).toBeCloseTo(132838.52, 2)
      expect(result.bank).toBe('Santander')
    })

    it('returns null for a Santander promotional message', () => {
      const text = `¡Comprate las zapas que querés! En Open Sports tenes cuotas sin interes con tu tarjeta Santander.`
      const result = parseSmsTransaction(text)
      expect(result).toBeNull()
    })
  })

  describe('Galicia', () => {
    it('parses a Galicia purchase notification', () => {
      const text = `Compra de $1.500,00 en CARREFOUR. Saldo disponible: $10.000`
      const result = parseSmsTransaction(text)
      expect(result).not.toBeNull()
      expect(result.description).toBe('CARREFOUR')
      expect(result.amount).toBeCloseTo(1500, 2)
      expect(result.bank).toBe('Galicia')
    })
  })

  describe('BBVA', () => {
    it('parses a BBVA purchase notification', () => {
      const text = `Realizaste una compra de $2.000,50 en RAPPI`
      const result = parseSmsTransaction(text)
      expect(result).not.toBeNull()
      expect(result.description).toBe('RAPPI')
      expect(result.amount).toBeCloseTo(2000.50, 2)
      expect(result.bank).toBe('BBVA')
    })
  })

  describe('Naranja X', () => {
    it('parses a Naranja X purchase notification', () => {
      const text = `Compra aprobada $500,00 en PEDIDOSYA`
      const result = parseSmsTransaction(text)
      expect(result).not.toBeNull()
      expect(result.description).toBe('PEDIDOSYA')
      expect(result.amount).toBeCloseTo(500, 2)
      expect(result.bank).toBe('Naranja X')
    })
  })

  describe('Mercado Pago', () => {
    it('parses a Mercado Pago payment notification', () => {
      const text = `Pagaste $1.200,00 a FARMACITY`
      const result = parseSmsTransaction(text)
      expect(result).not.toBeNull()
      expect(result.description).toBe('FARMACITY')
      expect(result.amount).toBeCloseTo(1200, 2)
      expect(result.bank).toBe('Mercado Pago')
    })
  })

  describe('Uala', () => {
    it('parses a Uala purchase notification', () => {
      const text = `Compra por $800,00 en DISCO`
      const result = parseSmsTransaction(text)
      expect(result).not.toBeNull()
      expect(result.description).toBe('DISCO')
      expect(result.amount).toBeCloseTo(800, 2)
      expect(result.bank).toBe('Uala')
    })
  })

  describe('unrecognized / invalid input', () => {
    it('returns null for unrecognized text', () => {
      const result = parseSmsTransaction('Hola, cómo estás?')
      expect(result).toBeNull()
    })

    it('returns null for an empty string', () => {
      const result = parseSmsTransaction('')
      expect(result).toBeNull()
    })
  })

  describe('amount parsing', () => {
    it('parses $1.234,56 as 1234.56', () => {
      // Uses BBVA format as a vehicle for the amount
      const text = `Realizaste una compra de $1.234,56 en COMERCIO`
      const result = parseSmsTransaction(text)
      expect(result).not.toBeNull()
      expect(result.amount).toBeCloseTo(1234.56, 2)
    })

    it('parses $500,00 as 500.00', () => {
      const text = `Compra aprobada $500,00 en COMERCIO`
      const result = parseSmsTransaction(text)
      expect(result).not.toBeNull()
      expect(result.amount).toBeCloseTo(500.00, 2)
    })

    it('parses $132.838,52 as 132838.52', () => {
      const text = `Aviso de débito automático\nDebitamos $132.838,52 por el pago a ZURICH SEGUROS de tu Tarjeta Santander Visa Crédito terminada en 5279 (s.e.u.o.).`
      const result = parseSmsTransaction(text)
      expect(result).not.toBeNull()
      expect(result.amount).toBeCloseTo(132838.52, 2)
    })
  })

  describe('date fallback', () => {
    it('uses today\'s date when no date is present in the text', () => {
      const text = `Aviso de débito automático\nDebitamos $132.838,52 por el pago a ZURICH SEGUROS de tu Tarjeta Santander Visa Crédito terminada en 5279 (s.e.u.o.).`
      const result = parseSmsTransaction(text)
      expect(result).not.toBeNull()
      // date should be a valid YYYY-MM-DD string
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      // when no date in text, falls back to today
      expect(result.date).toBe(TODAY)
    })
  })
})

describe('parseSmsBlock', () => {
  it('splits a block with two Santander notifications and returns array of 2', () => {
    const block = `Pagaste $20.010,00
A PedidosYa*Gordys con tu Tarjeta Santander Visa Crédito terminada en 5279, el 14/03/2026 a las 20:40 horas. (s.e.u.o.)

Aviso de débito automático
Debitamos $132.838,52 por el pago a ZURICH SEGUROS de tu Tarjeta Santander Visa Crédito terminada en 5279 (s.e.u.o.).`
    const results = parseSmsBlock(block)
    expect(Array.isArray(results)).toBe(true)
    expect(results).toHaveLength(2)
    expect(results[0].description).toBe('PedidosYa*Gordys')
    expect(results[1].description).toBe('ZURICH SEGUROS')
  })

  it('returns only valid transactions when mixed with promotional messages', () => {
    const block = `Pagaste $20.010,00
A PedidosYa*Gordys con tu Tarjeta Santander Visa Crédito terminada en 5279, el 14/03/2026 a las 20:40 horas. (s.e.u.o.)

¡Comprate las zapas que querés! En Open Sports tenes cuotas sin interes con tu tarjeta Santander.`
    const results = parseSmsBlock(block)
    expect(Array.isArray(results)).toBe(true)
    expect(results).toHaveLength(1)
    expect(results[0].description).toBe('PedidosYa*Gordys')
  })
})
