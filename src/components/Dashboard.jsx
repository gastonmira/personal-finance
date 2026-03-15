import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, PlusCircle, Upload } from 'lucide-react'
import useFinanceStore from '../store/useFinanceStore'
import { useShallow } from 'zustand/react/shallow'
import FileUpload from './FileUpload'
import { formatARS, formatUSD, toDisplayMonth, CARD_LABELS, CARD_COLORS } from '../utils/format'

const CATEGORY_COLORS = {
  Supermercado:   '#22c55e',
  Restaurantes:   '#f59e0b',
  Transporte:     '#38bdf8',
  Servicios:      '#8b5cf6',
  Salud:          '#ec4899',
  Entretenimiento:'#f97316',
  Indumentaria:   '#a78bfa',
  Tecnología:     '#06b6d4',
  Educación:      '#84cc16',
  Otros:          '#64748b',
}

function getCurrentMonthKey() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function CategoryBreakdown({ transactions, onManage }) {
  const summary = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount
    return acc
  }, {})
  const total = transactions.reduce((s, t) => s + t.amount, 0)
  const sorted = Object.entries(summary).sort((a, b) => b[1] - a[1])

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h4 className="font-semibold text-white">Desglose por Categoría</h4>
        <button
          onClick={onManage}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {transactions.length} transacciones
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
                    style={{ backgroundColor: CATEGORY_COLORS[cat] ?? '#64748b' }}
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
                    backgroundColor: CATEGORY_COLORS[cat] ?? '#64748b',
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
  const navigate = useNavigate()

  const [showUpload, setShowUpload] = useState(false)
  const [activeMonth, setActiveMonth] = useState(getCurrentMonthKey)

  const hasData = sortedKeys.length > 0
  const data = months[activeMonth]

  const currentIdx = sortedKeys.indexOf(activeMonth)
  const prevMonth = currentIdx > 0 ? sortedKeys[currentIdx - 1] : null
  const nextMonth = currentIdx < sortedKeys.length - 1 ? sortedKeys[currentIdx + 1] : null

  // Fallback to first available month if current not in data
  const displayMonth = data ? activeMonth : (sortedKeys[sortedKeys.length - 1] ?? activeMonth)
  const displayData = months[displayMonth]

  const totalStatements = displayData
    ? Object.values(displayData.statements ?? {}).reduce((s, v) => s + (v ?? 0), 0)
    : 0

  const usdBalance =
    displayData
      ? (displayData.usdEarned ?? 0) - (displayData.usdSold ?? 0)
      : null

  const cards = ['santander', 'amex', 'provincia', 'uala']

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1">Resumen financiero mensual</p>
        </div>
        <button
          onClick={() => setShowUpload((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
        >
          <Upload size={16} />
          Importar XLS
        </button>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="mb-8">
          <FileUpload onImported={() => setShowUpload(false)} />
        </div>
      )}

      {!hasData && !showUpload && (
        <div className="text-center py-20">
          <p className="text-slate-500 text-lg">No hay datos cargados</p>
          <p className="text-slate-600 text-sm mt-2">Importá tu archivo XLS para comenzar</p>
          <button
            onClick={() => setShowUpload(true)}
            className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Importar XLS
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
                {toDisplayMonth(displayMonth).label}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {toDisplayMonth(displayMonth).note}
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
              {/* Summary stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  label="Total XLS"
                  value={formatARS(displayData.totalXLS)}
                  sub="Gastos del período"
                />
                <StatCard
                  label="Total Resúmenes"
                  value={totalStatements > 0 ? formatARS(totalStatements) : '—'}
                  sub={totalStatements > 0 ? 'Resúmenes cargados' : 'Pendiente de cargar'}
                  color={totalStatements > 0 ? 'text-blue-400' : 'text-slate-500'}
                />
                <StatCard
                  label="USD Cobrado"
                  value={formatUSD(displayData.usdEarned)}
                  sub="Ingresos en dólares"
                  color="text-emerald-400"
                />
                <StatCard
                  label="Balance USD"
                  value={usdBalance !== null ? formatUSD(usdBalance) : '—'}
                  sub={`Vendido: ${formatUSD(displayData.usdSold)}`}
                  color={usdBalance !== null && usdBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}
                />
              </div>

              {/* Category breakdown — only if transactions exist */}
              {(displayData.transactions?.length ?? 0) > 0 && (
                <CategoryBreakdown
                  transactions={displayData.transactions}
                  onManage={() => navigate('/ingresar', { state: { month: displayMonth } })}
                />
              )}

              {/* Cards breakdown */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="font-semibold text-white">Por Tarjeta</h4>
                  <button
                    onClick={() => navigate('/ingresar', { state: { month: displayMonth } })}
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <PlusCircle size={14} />
                    Cargar resúmenes
                  </button>
                </div>
                <div className="space-y-3">
                  {cards.map((card) => {
                    const xlsAmt = displayData.cards?.[card]
                    const stmtAmt = displayData.statements?.[card]
                    if (!xlsAmt && !stmtAmt) return null
                    return (
                      <div key={card} className="flex items-center gap-4">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: CARD_COLORS[card] }}
                        />
                        <span className="text-slate-300 text-sm w-28 shrink-0">{CARD_LABELS[card]}</span>
                        <div className="flex-1 flex items-center gap-6">
                          <div className="text-sm">
                            <span className="text-slate-500 text-xs">XLS </span>
                            <span className="text-slate-200">{formatARS(xlsAmt)}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-slate-500 text-xs">Resumen </span>
                            {stmtAmt ? (
                              <span className="text-blue-400">{formatARS(stmtAmt)}</span>
                            ) : (
                              <span className="text-slate-600 text-xs">Pendiente</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500">
              No hay datos para {toDisplayMonth(activeMonth).label}
            </div>
          )}
        </>
      )}
    </div>
  )
}
