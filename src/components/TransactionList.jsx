import { useState } from 'react'
import { CheckCircle, AlertCircle, Save, X, ChevronDown, ChevronUp } from 'lucide-react'
import { formatARS } from '../utils/format'
import { useTranslation } from '../i18n/useTranslation'
import { normalizeCategory } from '../i18n/normalizeCategory'

// Colors by category index (same order as CATEGORIES)
const CATEGORY_COLORS = [
  '#22c55e', // Supermarket / Supermercado
  '#f59e0b', // Restaurants / Restaurantes
  '#38bdf8', // Transport / Transporte
  '#8b5cf6', // Services / Servicios
  '#ec4899', // Health / Salud
  '#f97316', // Entertainment / Entretenimiento
  '#a78bfa', // Clothing / Indumentaria
  '#06b6d4', // Technology / Tecnología
  '#84cc16', // Education / Educación
  '#64748b', // Other / Otros
]

/**
 * Shows the categorized transaction list.
 * Props:
 *   transactions      - array of { id, date, description, amount, category }
 *   statementTotal    - number | null  (total from the manual statement entry, for validation)
 *   onSave(transactions) - callback when user saves
 *   onCancel()        - go back
 */
export default function TransactionList({ transactions: initial, statementTotal, onSave, onCancel }) {
  const t = useTranslation()
  const localeCategories = t('categories')

  const [txs, setTxs] = useState(() =>
    initial.map((tx) => ({ ...tx, category: normalizeCategory(tx.category, localeCategories) }))
  )
  const [collapsed, setCollapsed] = useState(false)

  const total = txs.reduce((s, tx) => s + tx.amount, 0)
  const diff = statementTotal != null ? total - statementTotal : null
  const closes = diff !== null && Math.abs(diff) < 1

  const updateCategory = (id, cat) => {
    setTxs((prev) => prev.map((tx) => (tx.id === id ? { ...tx, category: cat } : tx)))
  }

  const removeRow = (id) => {
    setTxs((prev) => prev.filter((tx) => tx.id !== id))
  }

  const getCategoryColor = (cat) => {
    const idx = localeCategories.indexOf(cat)
    return idx >= 0 ? CATEGORY_COLORS[idx] : '#64748b'
  }

  // Summary by category
  const summary = txs.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] ?? 0) + tx.amount
    return acc
  }, {})
  const sortedCategories = Object.entries(summary).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-5">
      {/* Header totals */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">{t('calculatedTotal')}</p>
            <p className="text-lg font-semibold text-white tabular-nums">{formatARS(total)}</p>
          </div>
          {statementTotal != null && (
            <>
              <div className="text-slate-700 text-lg">vs</div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{t('declaredStatement')}</p>
                <p className="text-lg font-semibold text-slate-300 tabular-nums">{formatARS(statementTotal)}</p>
              </div>
            </>
          )}
        </div>
        {diff !== null && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            closes
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-amber-500/15 text-amber-400'
          }`}>
            {closes ? (
              <><CheckCircle size={13} /> {t('matches')}</>
            ) : (
              <><AlertCircle size={13} /> {t('difference')} {diff > 0 ? '+' : ''}{formatARS(diff)}</>
            )}
          </div>
        )}
      </div>

      {/* Category summary */}
      <div className="bg-slate-800/40 rounded-xl p-4 space-y-2">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">{t('summaryByCategory')}</p>
        {sortedCategories.map(([cat, amt]) => (
          <div key={cat} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(cat) }} />
            <span className="text-slate-300 text-sm flex-1">{cat}</span>
            <span className="text-slate-200 text-sm tabular-nums font-medium">{formatARS(amt)}</span>
            <span className="text-slate-600 text-xs tabular-nums w-10 text-right">
              {total > 0 ? `${Math.round((amt / total) * 100)}%` : ''}
            </span>
          </div>
        ))}
      </div>

      {/* Transaction table */}
      <div>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-3"
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          {collapsed ? t('show') : t('hide')} ({txs.length})
        </button>

        {!collapsed && (
          <div className="overflow-x-auto rounded-lg border border-slate-800 max-h-72 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="border-b border-slate-800">
                  <th className="text-left px-3 py-2 text-slate-500 font-medium">{t('colDate')}</th>
                  <th className="text-left px-3 py-2 text-slate-500 font-medium">{t('colDescription')}</th>
                  <th className="text-right px-3 py-2 text-slate-500 font-medium">{t('colAmount')}</th>
                  <th className="text-left px-3 py-2 text-slate-500 font-medium">{t('colCategory')}</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {txs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/30 group">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{tx.date || '—'}</td>
                    <td className="px-3 py-2 text-slate-300 max-w-xs truncate">{tx.description}</td>
                    <td className="px-3 py-2 text-slate-200 tabular-nums text-right whitespace-nowrap">
                      {formatARS(tx.amount)}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={tx.category}
                        onChange={(e) => updateCategory(tx.id, e.target.value)}
                        className="w-36 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 text-xs
                                   focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        {localeCategories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => removeRow(tx.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                      >
                        <X size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end pt-2 border-t border-slate-800">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          {t('cancel')}
        </button>
        <button
          onClick={() => onSave(txs)}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Save size={15} />
          {t('saveBreakdown')}
        </button>
      </div>
    </div>
  )
}
