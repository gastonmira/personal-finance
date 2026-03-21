import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Legacy card definitions used for backwards-compatibility migration
const LEGACY_CARDS = [
  { id: 'santander', name: 'Santander', color: '#ef4444' },
  { id: 'amex', name: 'Amex', color: '#38bdf8' },
  { id: 'provincia', name: 'Provincia', color: '#22c55e' },
  { id: 'uala', name: 'UALA', color: '#1e40af' },
]

const useFinanceStore = create(
  persist(
    (set, get) => ({
      config: {
        cards: [], // Array of { id: string, name: string, color: string }
        foreignCurrency: 'USD', // 'USD' | 'EUR' | 'ARS'
      },

      months: {},

      // ── Config actions ────────────────────────────────────────────────────

      addCard: (card) =>
        set((state) => ({
          config: { ...state.config, cards: [...state.config.cards, card] },
        })),

      removeCard: (id) =>
        set((state) => ({
          config: {
            ...state.config,
            cards: state.config.cards.filter((c) => c.id !== id),
          },
        })),

      updateCard: (id, updates) =>
        set((state) => ({
          config: {
            ...state.config,
            cards: state.config.cards.map((c) =>
              c.id === id ? { ...c, ...updates } : c
            ),
          },
        })),

      setCards: (cards) =>
        set((state) => ({ config: { ...state.config, cards } })),

      setCurrency: (foreignCurrency) =>
        set((state) => ({ config: { ...state.config, foreignCurrency } })),

      // ── Month actions ─────────────────────────────────────────────────────

      setStatement: (monthKey, cardStatements) => {
        set((state) => ({
          months: {
            ...state.months,
            [monthKey]: {
              ...state.months[monthKey],
              statements: {
                ...(state.months[monthKey]?.statements ?? {}),
                ...cardStatements,
              },
            },
          },
        }))
      },

      setUSD: (monthKey, usdData) => {
        set((state) => ({
          months: {
            ...state.months,
            [monthKey]: {
              ...state.months[monthKey],
              ...usdData,
            },
          },
        }))
      },

      // Append new transactions to existing ones for a month
      appendTransactions: (monthKey, newTransactions) => {
        set((state) => {
          const existing = state.months[monthKey]?.transactions ?? []
          return {
            months: {
              ...state.months,
              [monthKey]: {
                usdEarned: null,
                usdSold: null,
                statements: {},
                ...state.months[monthKey],
                transactions: [...existing, ...newTransactions],
              },
            },
          }
        })
      },

      // Replace all transactions for a month
      setTransactions: (monthKey, transactions) => {
        set((state) => ({
          months: {
            ...state.months,
            [monthKey]: {
              usdEarned: null,
              usdSold: null,
              statements: {},
              ...state.months[monthKey],
              transactions,
            },
          },
        }))
      },

      // Update a single transaction's category
      updateTransactionCategory: (monthKey, txId, newCategory) => {
        set((state) => {
          const month = state.months[monthKey]
          if (!month) return {}
          return {
            months: {
              ...state.months,
              [monthKey]: {
                ...month,
                transactions: month.transactions.map((tx) =>
                  tx.id === txId ? { ...tx, category: newCategory } : tx
                ),
              },
            },
          }
        })
      },

      getMonth: (monthKey) => get().months[monthKey] ?? null,

      clearAll: () => set({ months: {}, config: { cards: [] } }),
    }),
    {
      name: 'personal-fin-storage',
      onRehydrateStorage: () => (state) => {
        if (!state) return
        // Backwards compatibility: if config is missing or cards is empty,
        // check for legacy card data (santander/amex/provincia/uala) and auto-populate
        if (!state.config) state.config = { cards: [], foreignCurrency: 'USD' }
        if (!state.config.foreignCurrency) state.config.foreignCurrency = 'USD'
        if (state.config.cards.length === 0) {
          const hasLegacy = Object.values(state.months ?? {}).some((m) =>
            LEGACY_CARDS.some((c) => m.statements?.[c.id] != null)
          )
          if (hasLegacy) {
            state.config.cards = LEGACY_CARDS
          }
        }
      },
    }
  )
)

export default useFinanceStore
