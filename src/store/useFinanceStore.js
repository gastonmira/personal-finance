import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useFinanceStore = create(
  persist(
    (set, get) => ({
      months: {},

      importData: (parsedData) => {
        set((state) => ({
          months: {
            ...state.months,
            ...Object.fromEntries(
              Object.entries(parsedData).map(([key, data]) => [
                key,
                {
                  cards: data.cards ?? {},
                  totalXLS: data.totalXLS ?? 0,
                  usdEarned: data.usdEarned ?? null,
                  usdSold: data.usdSold ?? null,
                  // Preserve existing manual statements if present
                  statements: state.months[key]?.statements ?? {
                    santander: null,
                    amex: null,
                    provincia: null,
                    uala: null,
                  },
                  // Preserve existing transactions if present
                  transactions: state.months[key]?.transactions ?? [],
                },
              ])
            ),
          },
        }))
      },

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
                cards: {},
                totalXLS: null,
                usdEarned: null,
                usdSold: null,
                statements: { santander: null, amex: null, provincia: null, uala: null },
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
              cards: {},
              totalXLS: null,
              usdEarned: null,
              usdSold: null,
              statements: { santander: null, amex: null, provincia: null, uala: null },
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

      clearAll: () => set({ months: {} }),
    }),
    {
      name: 'personal-fin-storage',
    }
  )
)

export default useFinanceStore
