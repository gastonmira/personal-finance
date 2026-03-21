import useFinanceStore from '../store/useFinanceStore'
import { useShallow } from 'zustand/react/shallow'
import { formatARS, formatForeignCurrency, formatMonthKey } from '../utils/format'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useTranslation } from '../i18n/useTranslation'

function formatARSShort(v) {
  if (!v) return '—'
  if (v >= 1_000_000) return `$${(v/1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v/1_000).toFixed(0)}K`
  return `$${v}`
}

const CustomTooltipARS = ({ active, payload, label, cardMap }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-slate-300 font-medium mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill || p.stroke }} />
          <span className="text-slate-400">{cardMap?.[p.dataKey]?.name ?? p.name}:</span>
          <span className="text-white font-medium">{formatARS(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

const CustomTooltipUSD = ({ active, payload, label, currency = 'USD' }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-slate-300 font-medium mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke || p.fill }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-medium">{formatForeignCurrency(p.value, currency)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Reports() {
  const months = useFinanceStore((s) => s.months)
  const sortedKeys = useFinanceStore(useShallow((s) => Object.keys(s.months).sort()))
  const cards = useFinanceStore(useShallow((s) => s.config.cards))
  const foreignCurrency = useFinanceStore((s) => s.config.foreignCurrency ?? 'USD')
  const t = useTranslation()

  const monthNamesShort = t('monthNamesShort')

  // Build a lookup map from card id → card object
  const cardMap = Object.fromEntries(cards.map((c) => [c.id, c]))

  function shortMonth(key) {
    const [year, month] = key.split('-')
    return `${monthNamesShort[parseInt(month) - 1]} ${year.slice(2)}`
  }

  if (sortedKeys.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 py-20">
        <p>{t('noDataImport')}</p>
      </div>
    )
  }

  const monthNames = t('monthNames')

  // Build chart data — only include months with any financial data
  const chartData = sortedKeys
    .filter((key) => {
      const d = months[key]
      return d && (
        Object.values(d.statements ?? {}).some((v) => v) ||
        d.usdEarned ||
        (d.transactions?.length ?? 0) > 0
      )
    })
    .map((key) => {
      const d = months[key]
      // Per-card statement amounts (dynamic, based on user's configured cards)
      const cardAmounts = Object.fromEntries(
        cards.map((c) => [c.id, d.statements?.[c.id] ?? 0])
      )
      const totalStatement = Object.values(cardAmounts).reduce((s, v) => s + v, 0)
      return {
        month: shortMonth(key),
        key,
        ...cardAmounts,
        totalStatement,
        usdEarned: d.usdEarned ?? 0,
        usdSold: d.usdSold ?? 0,
        usdBalance: (d.usdEarned ?? 0) - (d.usdSold ?? 0),
      }
    })

  const avgTotal = chartData.length
    ? chartData.reduce((s, d) => s + d.totalStatement, 0) / chartData.length
    : 0

  const totalARS = chartData.reduce((s, d) => s + d.totalStatement, 0)
  const totalUSDEarned = chartData.reduce((s, d) => s + (months[d.key]?.usdEarned ?? 0), 0)
  const totalUSDSold = chartData.reduce((s, d) => s + (months[d.key]?.usdSold ?? 0), 0)

  const hasCardData = cards.length > 0 && chartData.some((d) => d.totalStatement > 0)

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">{t('reportsTitle')}</h2>
        <p className="text-slate-500 text-sm mt-1">{t('reportsSubtitle')}</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-500 text-xs uppercase tracking-wider">{t('totalARSMonths')} ({chartData.length})</p>
          <p className="text-2xl font-semibold text-white mt-2">{formatARSShort(totalARS)}</p>
          <p className="text-slate-500 text-xs mt-1">{t('avgPerMonth')} {formatARSShort(Math.round(avgTotal))}{t('perMonth')}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-500 text-xs uppercase tracking-wider">{t('totalUSDEarned', { cur: foreignCurrency })}</p>
          <p className="text-2xl font-semibold text-emerald-400 mt-2">{formatForeignCurrency(totalUSDEarned, foreignCurrency)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-500 text-xs uppercase tracking-wider">{t('totalUSDSold', { cur: foreignCurrency })}</p>
          <p className="text-2xl font-semibold text-amber-400 mt-2">{formatForeignCurrency(totalUSDSold, foreignCurrency)}</p>
          <p className="text-slate-500 text-xs mt-1">{t('balanceLabel2')} {formatForeignCurrency(totalUSDEarned - totalUSDSold, foreignCurrency)}</p>
        </div>
      </div>

      {/* Chart 1: Stacked bars by card (statements) */}
      {hasCardData && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-white mb-6">{t('chartARSByCard')}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatARSShort} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltipARS cardMap={cardMap} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Legend
                formatter={(value) => (
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>
                    {cardMap[value]?.name ?? value}
                  </span>
                )}
              />
              {cards.map((card, i) => (
                <Bar
                  key={card.id}
                  dataKey={card.id}
                  stackId="a"
                  fill={card.color}
                  radius={i === cards.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Chart 2: Monthly trend */}
      {chartData.length > 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-white mb-6">{t('chartMonthlyTrend')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatARSShort} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltipARS cardMap={cardMap} />} cursor={{ stroke: '#334155' }} />
              <ReferenceLine
                y={avgTotal}
                stroke="#475569"
                strokeDasharray="4 4"
                label={{ value: t('chartAvg'), position: 'right', fill: '#475569', fontSize: 11 }}
              />
              <Line
                type="monotone"
                dataKey="totalStatement"
                name={t('chartTotalStatements')}
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Chart 3: USD earned vs sold */}
      {chartData.some((d) => d.usdEarned > 0) && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-white mb-6">{t('chartDollars')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltipUSD currency={foreignCurrency} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v === 'usdEarned' ? t('legendEarned') : v === 'usdSold' ? t('legendSold') : v}</span>} />
              <Bar dataKey="usdEarned" name="usdEarned" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="usdSold" name="usdSold" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="font-semibold text-white">{t('summaryTable')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('colMonth')}</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('colStatements')}</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('colUSDEarned', { cur: foreignCurrency })}</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('colUSDSold', { cur: foreignCurrency })}</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('colUSDBalance', { cur: foreignCurrency })}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sortedKeys.map((key) => {
                const d = months[key]
                if (!d) return null
                const stmt = Object.values(d.statements ?? {}).reduce((s, v) => s + (v ?? 0), 0)
                if (!stmt && !d.usdEarned) return null
                const bal = (d.usdEarned ?? 0) - (d.usdSold ?? 0)
                return (
                  <tr key={key} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3 text-sm text-slate-200">{formatMonthKey(key, monthNames)}</td>
                    <td className="px-5 py-3 text-right text-sm tabular-nums">
                      {stmt > 0 ? <span className="text-blue-400">{formatARS(stmt)}</span> : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right text-sm text-emerald-400 tabular-nums">{formatForeignCurrency(d.usdEarned, foreignCurrency)}</td>
                    <td className="px-5 py-3 text-right text-sm text-amber-400 tabular-nums">{formatForeignCurrency(d.usdSold, foreignCurrency)}</td>
                    <td className="px-5 py-3 text-right text-sm tabular-nums">
                      {d.usdEarned !== null
                        ? <span className={bal >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatForeignCurrency(bal, foreignCurrency)}</span>
                        : <span className="text-slate-600">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
