import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react'
import useFinanceStore from '../store/useFinanceStore'
import { useShallow } from 'zustand/react/shallow'
import { formatARS, formatUSD, formatMonthKey } from '../utils/format'
import { useTranslation } from '../i18n/useTranslation'

function getCurrentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function MonthlyView() {
  const months = useFinanceStore((s) => s.months)
  const sortedKeys = useFinanceStore(useShallow((s) => Object.keys(s.months).sort()))
  const cards = useFinanceStore(useShallow((s) => s.config.cards))
  const navigate = useNavigate()
  const t = useTranslation()

  const defaultKey = sortedKeys.includes(getCurrentMonthKey())
    ? getCurrentMonthKey()
    : sortedKeys[sortedKeys.length - 1] ?? getCurrentMonthKey()

  const [activeMonth, setActiveMonth] = useState(defaultKey)

  const currentIdx = sortedKeys.indexOf(activeMonth)
  const prevMonth = currentIdx > 0 ? sortedKeys[currentIdx - 1] : null
  const nextMonth = currentIdx < sortedKeys.length - 1 ? sortedKeys[currentIdx + 1] : null

  const data = months[activeMonth]

  const totalStatements = data
    ? Object.values(data.statements ?? {}).reduce((s, v) => s + (v ?? 0), 0)
    : 0

  const usdBalance =
    data && (data.usdEarned !== null || data.usdSold !== null)
      ? (data.usdEarned ?? 0) - (data.usdSold ?? 0)
      : null

  const monthNames = t('monthNames')

  // Only show cards that have statement data for the active month
  const cardsWithData = cards.filter(
    (card) => data?.statements?.[card.id] != null
  )

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('monthlyTitle')}</h2>
          <p className="text-slate-500 text-sm mt-1">{t('monthlySubtitle')}</p>
        </div>
        <button
          onClick={() => navigate('/ingresar', { state: { month: activeMonth } })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle size={16} />
          {t('loadData')}
        </button>
      </div>

      {sortedKeys.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p>{t('noDataImport')}</p>
        </div>
      ) : (
        <>
          {/* Month navigator */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => prevMonth && setActiveMonth(prevMonth)}
              disabled={!prevMonth}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 disabled:opacity-30 hover:text-white transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <h3 className="text-xl font-semibold text-white min-w-48 text-center">
              {formatMonthKey(activeMonth, monthNames)}
            </h3>
            <button
              onClick={() => nextMonth && setActiveMonth(nextMonth)}
              disabled={!nextMonth}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 disabled:opacity-30 hover:text-white transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Month selector pills */}
          <div className="flex gap-2 flex-wrap mb-8">
            {sortedKeys.map((key) => (
              <button
                key={key}
                onClick={() => setActiveMonth(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  key === activeMonth
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {formatMonthKey(key, monthNames)}
              </button>
            ))}
          </div>

          {data ? (
            <>
              {/* Cards table */}
              {cardsWithData.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
                  <div className="px-6 py-4 border-b border-slate-800">
                    <h4 className="font-semibold text-white">{t('cardDetail')}</h4>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('colCard')}</th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('colStatementAmount')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {cardsWithData.map((card) => {
                        const stmtAmt = data.statements?.[card.id] ?? null
                        return (
                          <tr key={card.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: card.color }}
                                />
                                <span className="text-slate-200 text-sm font-medium">{card.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right text-sm tabular-nums">
                              {stmtAmt !== null ? (
                                <span className="text-blue-400">{formatARS(stmtAmt)}</span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-500">
                                  {t('pending')}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-700 bg-slate-800/30">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-300">{t('total')}</td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-blue-400 tabular-nums">
                          {totalStatements > 0 ? formatARS(totalStatements) : '—'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* USD summary */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h4 className="font-semibold text-white mb-4">{t('monthlyDollars')}</h4>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">{t('earned')}</p>
                    <p className="text-2xl font-semibold text-emerald-400">{formatUSD(data.usdEarned)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">{t('soldToARS')}</p>
                    <p className="text-2xl font-semibold text-amber-400">{formatUSD(data.usdSold)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">{t('balance')}</p>
                    <p className={`text-2xl font-semibold ${usdBalance !== null && usdBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {usdBalance !== null ? formatUSD(usdBalance) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-slate-500">
              {t('noDataForMonth')} {formatMonthKey(activeMonth, monthNames)}
            </div>
          )}
        </>
      )}
    </div>
  )
}
