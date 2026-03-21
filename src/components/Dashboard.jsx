import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, PlusCircle, Settings } from 'lucide-react'
import useFinanceStore from '../store/useFinanceStore'
import { useShallow } from 'zustand/react/shallow'
import { formatARS, formatUSD, toDisplayMonth } from '../utils/format'
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

function getCurrentMonthKey() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function CategoryBreakdown({ transactions, onManage, t }) {
  const localeCategories = t('categories')

  const getCategoryColor = (cat) => {
    const idx = localeCategories.indexOf(cat)
    return idx >= 0 ? CATEGORY_COLORS[idx] : '#64748b'
  }

  const summary = transactions.reduce((acc, tx) => {
    const cat = normalizeCategory(tx.category, localeCategories)
    acc[cat] = (acc[cat] ?? 0) + tx.amount
    return acc
  }, {})
  const total = transactions.reduce((s, tx) => s + tx.amount, 0)
  const sorted = Object.entries(summary).sort((a, b) => b[1] - a[1])

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h4 className="font-semibold text-white">{t('spendingBreakdown')}</h4>
        <button
          onClick={onManage}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {transactions.length} {t('transactionsCount')}
        </button>
      </div>
      <div className="space-y-3">
        {sorted.map(([cat, amt]) => {
          const pct = total > 0 ? (amt / total) * 100 : 0
          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: getCategoryColor(cat) }}
                  />
                  <span className="text-slate-300 text-sm">{cat}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs tabular-nums">
                    {Math.round(pct)}%
                  </span>
                  <span className="text-slate-200 text-sm tabular-nums font-medium">
                    {formatARS(amt)}
                  </span>
                </div>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: getCategoryColor(cat),
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-semibold mt-2 ${color}`}>{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const months = useFinanceStore((s) => s.months)
  const sortedKeys = useFinanceStore(useShallow((s) => Object.keys(s.months).sort()))
  const cards = useFinanceStore(useShallow((s) => s.config.cards))
  const navigate = useNavigate()
  const t = useTranslation()

  const [activeMonth, setActiveMonth] = useState(getCurrentMonthKey)

  const hasData = sortedKeys.length > 0
  const noCards = cards.length === 0

  const currentIdx = sortedKeys.indexOf(activeMonth)
  const prevMonth = currentIdx > 0 ? sortedKeys[currentIdx - 1] : null
  const nextMonth = currentIdx < sortedKeys.length - 1 ? sortedKeys[currentIdx + 1] : null

  // Fallback to first available month if current not in data
  const displayMonth = months[activeMonth] ? activeMonth : (sortedKeys[sortedKeys.length - 1] ?? activeMonth)
  const displayData = months[displayMonth]

  const totalStatements = displayData
    ? Object.values(displayData.statements ?? {}).reduce((s, v) => s + (v ?? 0), 0)
    : 0

  const usdBalance =
    displayData
      ? (displayData.usdEarned ?? 0) - (displayData.usdSold ?? 0)
      : null

  const monthNames = t('monthNames')
  const statementLabel = t('statementOf')

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('dashboardTitle')}</h2>
          <p className="text-slate-500 text-sm mt-1">{t('dashboardSubtitle')}</p>
        </div>
      </div>

      {/* Onboarding banner — no cards configured */}
      {noCards && (
        <div className="mb-6 flex items-center justify-between gap-4 px-4 py-3 bg-amber-600/10 border border-amber-600/30 rounded-xl">
          <p className="text-amber-300 text-sm">{t('onboardingBanner')}</p>
          <button
            onClick={() => navigate('/configuracion')}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors shrink-0"
          >
            <Settings size={14} />
            {t('onboardingCta')}
          </button>
        </div>
      )}

      {!hasData && (
        <div className="text-center py-20">
          <p className="text-slate-500 text-lg">{t('noDataLoaded')}</p>
          <p className="text-slate-600 text-sm mt-2">{t('noDataInstruction')}</p>
          <button
            onClick={() => navigate('/ingresar')}
            className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors"
          >
            {t('navAddData')}
          </button>
        </div>
      )}

      {hasData && (
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
            <div className="text-center min-w-52">
              <h3 className="text-lg font-semibold text-white">
                {toDisplayMonth(displayMonth, monthNames, statementLabel).label}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {toDisplayMonth(displayMonth, monthNames, statementLabel).note}
              </p>
            </div>
            <button
              onClick={() => nextMonth && setActiveMonth(nextMonth)}
              disabled={!nextMonth}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 disabled:opacity-30 hover:text-white transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {displayData ? (
            <>
              {/* Summary stats — 3 cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatCard
                  label={t('statTotalStatements')}
                  value={totalStatements > 0 ? formatARS(totalStatements) : '—'}
                  sub={totalStatements > 0 ? t('statStatementsLoaded') : t('statPending')}
                  color={totalStatements > 0 ? 'text-blue-400' : 'text-slate-500'}
                />
                <StatCard
                  label={t('statUSDEarned')}
                  value={formatUSD(displayData.usdEarned)}
                  sub={t('statUSDEarnedSub')}
                  color="text-emerald-400"
                />
                <StatCard
                  label={t('statUSDBalance')}
                  value={usdBalance !== null ? formatUSD(usdBalance) : '—'}
                  sub={`${t('statUSDSold')} ${formatUSD(displayData.usdSold)}`}
                  color={usdBalance !== null && usdBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}
                />
              </div>

              {/* Category breakdown — only if transactions exist */}
              {(displayData.transactions?.length ?? 0) > 0 && (
                <CategoryBreakdown
                  transactions={displayData.transactions}
                  onManage={() => navigate('/ingresar', { state: { month: displayMonth } })}
                  t={t}
                />
              )}

              {/* Cards breakdown */}
              {cards.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-5">
                    <h4 className="font-semibold text-white">{t('sectionByCard')}</h4>
                    <button
                      onClick={() => navigate('/ingresar', { state: { month: displayMonth } })}
                      className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <PlusCircle size={14} />
                      {t('loadStatements')}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {cards.map((card) => {
                      const stmtAmt = displayData.statements?.[card.id]
                      return (
                        <div key={card.id} className="flex items-center gap-4">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: card.color }}
                          />
                          <span className="text-slate-300 text-sm w-28 shrink-0">{card.name}</span>
                          <div className="text-sm">
                            <span className="text-slate-500 text-xs">{t('labelStatement')} </span>
                            {stmtAmt ? (
                              <span className="text-blue-400">{formatARS(stmtAmt)}</span>
                            ) : (
                              <span className="text-slate-600 text-xs">{t('pending')}</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-slate-500">
              {t('noDataForMonth')} {toDisplayMonth(activeMonth, monthNames, statementLabel).label}
            </div>
          )}
        </>
      )}
    </div>
  )
}
