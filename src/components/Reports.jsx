import useFinanceStore from '../store/useFinanceStore'
import { useShallow } from 'zustand/react/shallow'
import { formatARS, formatUSD, formatMonthKey, CARD_LABELS, CARD_COLORS } from '../utils/format'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'

const CARDS = ['santander', 'amex', 'provincia', 'uala']

function shortMonth(key) {
  const [year, month] = key.split('-')
  const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${names[parseInt(month)-1]} ${year.slice(2)}`
}

function formatARSShort(v) {
  if (!v) return '—'
  if (v >= 1_000_000) return `$${(v/1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v/1_000).toFixed(0)}K`
  return `$${v}`
}

const CustomTooltipARS = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-slate-300 font-medium mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill || p.stroke }} />
          <span className="text-slate-400">{CARD_LABELS[p.dataKey] ?? p.name}:</span>
          <span className="text-white font-medium">{formatARS(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

const CustomTooltipUSD = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-slate-300 font-medium mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke || p.fill }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-medium">{formatUSD(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Reports() {
  const months = useFinanceStore((s) => s.months)
  const sortedKeys = useFinanceStore(useShallow((s) => Object.keys(s.months).sort()))

  if (sortedKeys.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 py-20">
        <p>No hay datos. Importá tu XLS desde el Dashboard.</p>
      </div>
    )
  }

  // Build chart data
  const chartData = sortedKeys
    .filter((key) => months[key]?.totalXLS)
    .map((key) => {
      const d = months[key]
      return {
        month: shortMonth(key),
        key,
        santander: d.cards?.santander ?? 0,
        amex: d.cards?.amex ?? 0,
        provincia: d.cards?.provincia ?? 0,
        uala: d.cards?.uala ?? 0,
        totalXLS: d.totalXLS ?? 0,
        totalStatement: Object.values(d.statements ?? {}).reduce((s, v) => s + (v ?? 0), 0),
        usdEarned: d.usdEarned ?? 0,
        usdSold: d.usdSold ?? 0,
        usdBalance: (d.usdEarned ?? 0) - (d.usdSold ?? 0),
      }
    })

  const avgTotal = chartData.length
    ? chartData.reduce((s, d) => s + d.totalXLS, 0) / chartData.length
    : 0

  // Summary totals
  const totalARS = chartData.reduce((s, d) => s + d.totalXLS, 0)
  const totalUSDEarned = chartData.reduce((s, d) => s + (months[d.key]?.usdEarned ?? 0), 0)
  const totalUSDSold = chartData.reduce((s, d) => s + (months[d.key]?.usdSold ?? 0), 0)

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Reportes</h2>
        <p className="text-slate-500 text-sm mt-1">Análisis de gastos e ingresos</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-500 text-xs uppercase tracking-wider">Total ARS ({chartData.length} meses)</p>
          <p className="text-2xl font-semibold text-white mt-2">{formatARSShort(totalARS)}</p>
          <p className="text-slate-500 text-xs mt-1">Prom. {formatARSShort(Math.round(avgTotal))}/mes</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-500 text-xs uppercase tracking-wider">Total USD Cobrado</p>
          <p className="text-2xl font-semibold text-emerald-400 mt-2">{formatUSD(totalUSDEarned)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-500 text-xs uppercase tracking-wider">Total USD Vendido</p>
          <p className="text-2xl font-semibold text-amber-400 mt-2">{formatUSD(totalUSDSold)}</p>
          <p className="text-slate-500 text-xs mt-1">Balance: {formatUSD(totalUSDEarned - totalUSDSold)}</p>
        </div>
      </div>

      {/* Chart 1: Stacked bars by card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-white mb-6">Gastos ARS por Tarjeta</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatARSShort} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltipARS />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Legend
              formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{CARD_LABELS[value]}</span>}
            />
            {CARDS.map((card) => (
              <Bar key={card} dataKey={card} stackId="a" fill={CARD_COLORS[card]} radius={card === 'uala' ? [4,4,0,0] : [0,0,0,0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 2: Total trend + avg reference */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-white mb-6">Tendencia Total Mensual</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatARSShort} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltipARS />} cursor={{ stroke: '#334155' }} />
            <ReferenceLine
              y={avgTotal}
              stroke="#475569"
              strokeDasharray="4 4"
              label={{ value: 'Prom', position: 'right', fill: '#475569', fontSize: 11 }}
            />
            <Line
              type="monotone"
              dataKey="totalXLS"
              name="Total XLS"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            {chartData.some((d) => d.totalStatement > 0) && (
              <Line
                type="monotone"
                dataKey="totalStatement"
                name="Total Resúmenes"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={{ fill: '#8b5cf6', r: 4 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 3: USD earned vs sold */}
      {chartData.some((d) => d.usdEarned > 0) && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-white mb-6">Dólares: Cobrado vs Vendido</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltipUSD />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v === 'usdEarned' ? 'Cobrado' : v === 'usdSold' ? 'Vendido' : v}</span>} />
              <Bar dataKey="usdEarned" name="usdEarned" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="usdSold" name="usdSold" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="font-semibold text-white">Tabla Resumen</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Mes</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Total XLS</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Resúmenes</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">USD Cobrado</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">USD Vendido</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Balance USD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sortedKeys.map((key) => {
                const d = months[key]
                if (!d?.totalXLS && !d?.usdEarned) return null
                const stmt = Object.values(d.statements ?? {}).reduce((s, v) => s + (v ?? 0), 0)
                const bal = (d.usdEarned ?? 0) - (d.usdSold ?? 0)
                return (
                  <tr key={key} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3 text-sm text-slate-200">{formatMonthKey(key)}</td>
                    <td className="px-5 py-3 text-right text-sm text-slate-300 tabular-nums">{formatARS(d.totalXLS)}</td>
                    <td className="px-5 py-3 text-right text-sm tabular-nums">
                      {stmt > 0 ? <span className="text-blue-400">{formatARS(stmt)}</span> : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right text-sm text-emerald-400 tabular-nums">{formatUSD(d.usdEarned)}</td>
                    <td className="px-5 py-3 text-right text-sm text-amber-400 tabular-nums">{formatUSD(d.usdSold)}</td>
                    <td className="px-5 py-3 text-right text-sm tabular-nums">
                      {d.usdEarned !== null
                        ? <span className={bal >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatUSD(bal)}</span>
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
