import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Save, CheckCircle, Upload, List, Pencil, PlusCircle, Trash2 } from 'lucide-react'
import useFinanceStore from '../store/useFinanceStore'
import { useShallow } from 'zustand/react/shallow'
import { formatMonthKey, formatARS, CARD_LABELS, CARD_COLORS, MONTH_NAMES } from '../utils/format'
import { parseStatementFile } from '../utils/statementParser'
import ColumnMapper from './ColumnMapper'
import TransactionList from './TransactionList'

const CARDS = ['santander', 'amex', 'provincia', 'uala']

function buildMonthOptions(sortedKeys) {
  const options = []
  for (const year of ['2025', '2026']) {
    for (let m = 1; m <= 12; m++) {
      const key = `${year}-${String(m).padStart(2, '0')}`
      options.push(key)
    }
  }
  return options
}

function MoneyInput({ label, value, onChange, color, placeholder = '0' }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2.5 w-36 shrink-0">
        {color && (
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        )}
        <span className="text-slate-300 text-sm font-medium">{label}</span>
      </div>
      <div className="relative flex-1 max-w-xs">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-7 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm
                     focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30
                     placeholder:text-slate-600 transition-colors"
        />
      </div>
    </div>
  )
}

// Step: 'idle' | 'mapping' | 'review'
export default function EntryForm() {
  const location = useLocation()
  const months = useFinanceStore((s) => s.months)
  const sortedKeys = useFinanceStore(useShallow((s) => Object.keys(s.months).sort()))
  const setStatement = useFinanceStore((s) => s.setStatement)
  const setUSD = useFinanceStore((s) => s.setUSD)
  const setTransactions = useFinanceStore((s) => s.setTransactions)
  const appendTransactions = useFinanceStore((s) => s.appendTransactions)

  const monthOptions = buildMonthOptions(sortedKeys)

  const defaultMonth =
    location.state?.month ??
    (sortedKeys.length > 0 ? sortedKeys[sortedKeys.length - 1] : '2026-01')

  const [selectedMonth, setSelectedMonth] = useState(defaultMonth)
  const [statements, setStatements] = useState({ santander: '', amex: '', provincia: '', uala: '' })
  const [usdEarned, setUsdEarned] = useState('')
  const [usdSold, setUsdSold] = useState('')
  const [saved, setSaved] = useState(false)

  // Breakdown state
  const [breakdownStep, setBreakdownStep] = useState('idle') // 'idle' | 'mapping' | 'review'
  const [uploadMode, setUploadMode] = useState('append')     // 'append' | 'replace'
  const [parsedFile, setParsedFile] = useState(null)         // { headers, rows }
  const [pendingTxs, setPendingTxs] = useState(null)         // categorized transactions
  const [parseError, setParseError] = useState(null)
  const fileInputRef = useRef(null)

  // Pre-fill when month changes
  useEffect(() => {
    const data = months[selectedMonth]
    if (data) {
      setStatements({
        santander: data.statements?.santander ?? '',
        amex: data.statements?.amex ?? '',
        provincia: data.statements?.provincia ?? '',
        uala: data.statements?.uala ?? '',
      })
      setUsdEarned(data.usdEarned ?? '')
      setUsdSold(data.usdSold ?? '')
    } else {
      setStatements({ santander: '', amex: '', provincia: '', uala: '' })
      setUsdEarned('')
      setUsdSold('')
    }
    setSaved(false)
    setBreakdownStep('idle')
    setUploadMode('append')
    setParsedFile(null)
    setPendingTxs(null)
    setParseError(null)
  }, [selectedMonth, months])

  const handleSave = () => {
    const stmtData = {}
    for (const card of CARDS) {
      const val = parseFloat(statements[card])
      stmtData[card] = isNaN(val) ? null : val
    }
    setStatement(selectedMonth, stmtData)

    const earned = parseFloat(usdEarned)
    const sold = parseFloat(usdSold)
    setUSD(selectedMonth, {
      usdEarned: isNaN(earned) ? null : earned,
      usdSold: isNaN(sold) ? null : sold,
    })

    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // ── Breakdown handlers ────────────────────────────────────────────────────

  const triggerUpload = (mode) => {
    setUploadMode(mode)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError(null)
    try {
      const result = await parseStatementFile(file)
      setParsedFile(result)
      setBreakdownStep('mapping')
    } catch (err) {
      setParseError(err.message)
    }
    e.target.value = ''
  }

  const handleMappingDone = (categorizedTxs) => {
    setPendingTxs(categorizedTxs)
    setBreakdownStep('review')
  }

  const handleSaveTransactions = (txs) => {
    if (uploadMode === 'append') {
      appendTransactions(selectedMonth, txs)
    } else {
      setTransactions(selectedMonth, txs)
    }
    setBreakdownStep('idle')
    setUploadMode('append')
    setParsedFile(null)
    setPendingTxs(null)
  }

  const handleCancelBreakdown = () => {
    setBreakdownStep('idle')
    setUploadMode('append')
    setParsedFile(null)
    setPendingTxs(null)
    setParseError(null)
  }

  const handleClearTransactions = () => {
    setTransactions(selectedMonth, [])
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const xlsData = months[selectedMonth]
  const existingTxs = xlsData?.transactions ?? []

  // Total statement across all cards (for closing check)
  const statementTotal = CARDS.reduce((sum, card) => {
    const v = parseFloat(statements[card])
    return sum + (isNaN(v) ? 0 : v)
  }, 0) || null

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Ingresar Datos</h2>
        <p className="text-slate-500 text-sm mt-1">Cargá el resumen mensual por tarjeta y tus dólares</p>
      </div>

      {/* Month selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
          Mes a cargar
        </label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm
                     focus:outline-none focus:border-blue-500 transition-colors"
        >
          {monthOptions.map((key) => (
            <option key={key} value={key}>
              {formatMonthKey(key)}
            </option>
          ))}
        </select>
      </div>

      {/* Resumen por tarjeta */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-white">Resumen por Tarjeta</h3>
          {xlsData && (
            <span className="text-xs text-slate-500">
              Total XLS:{' '}
              <span className="text-slate-300">
                {new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: 'ARS',
                  minimumFractionDigits: 0,
                }).format(xlsData.totalXLS ?? 0)}
              </span>
            </span>
          )}
        </div>
        <div className="space-y-4">
          {CARDS.map((card) => (
            <div key={card}>
              <MoneyInput
                label={CARD_LABELS[card]}
                color={CARD_COLORS[card]}
                value={statements[card]}
                onChange={(v) => setStatements((s) => ({ ...s, [card]: v }))}
              />
              {xlsData?.cards?.[card] ? (
                <p className="text-xs text-slate-600 mt-1 ml-40">
                  XLS:{' '}
                  {new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                    minimumFractionDigits: 0,
                  }).format(xlsData.cards[card])}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* USD */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-white mb-5">Dólares del Mes</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-slate-300 text-sm font-medium w-36 shrink-0">💵 USD Cobrado</span>
            <div className="relative flex-1 max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={usdEarned}
                onChange={(e) => setUsdEarned(e.target.value)}
                placeholder="0"
                className="w-full pl-7 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm
                           focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30
                           placeholder:text-slate-600 transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-300 text-sm font-medium w-36 shrink-0">🔄 USD Vendido</span>
            <div className="relative flex-1 max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={usdSold}
                onChange={(e) => setUsdSold(e.target.value)}
                placeholder="0"
                className="w-full pl-7 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm
                           focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30
                           placeholder:text-slate-600 transition-colors"
              />
            </div>
          </div>
          {usdEarned && usdSold && (
            <div className="mt-2 ml-40 text-sm">
              <span className="text-slate-500">Balance: </span>
              <span
                className={
                  parseFloat(usdEarned) - parseFloat(usdSold) >= 0
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }
              >
                ${(parseFloat(usdEarned) - parseFloat(usdSold)).toLocaleString('en-US')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Desglose de gastos */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-white">Desglose de Gastos</h3>
            <p className="text-xs text-slate-500 mt-0.5">Subí el CSV/XLS del resumen para categorizar automáticamente</p>
          </div>
          {existingTxs.length > 0 && breakdownStep === 'idle' && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <List size={13} />
              {existingTxs.length} transacciones
            </span>
          )}
          {breakdownStep !== 'idle' && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              uploadMode === 'append'
                ? 'bg-blue-600/20 text-blue-400'
                : 'bg-slate-700 text-slate-400'
            }`}>
              {uploadMode === 'append' ? '+ Agregar' : 'Reemplazar'}
            </span>
          )}
        </div>

        {/* Idle state */}
        {breakdownStep === 'idle' && (
          <div className="space-y-4">
            {/* Existing transactions mini-summary */}
            {existingTxs.length > 0 && (
              <ExistingBreakdownSummary
                transactions={existingTxs}
                onEdit={() => {
                  setPendingTxs(existingTxs)
                  setBreakdownStep('review')
                }}
              />
            )}

            {/* Upload buttons */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileChange}
                className="hidden"
              />
              {existingTxs.length > 0 ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => triggerUpload('append')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/40
                               text-blue-400 hover:text-blue-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    <PlusCircle size={15} />
                    Agregar otro resumen
                  </button>
                  <button
                    onClick={() => triggerUpload('replace')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700
                               text-slate-400 hover:text-slate-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Upload size={15} />
                    Reemplazar todo
                  </button>
                  <button
                    onClick={handleClearTransactions}
                    className="flex items-center gap-2 px-3 py-2.5 text-slate-600 hover:text-red-400 transition-colors text-sm"
                  >
                    <Trash2 size={14} />
                    Limpiar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => triggerUpload('replace')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700
                             text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Upload size={15} />
                  Subir CSV / XLS
                </button>
              )}
              {parseError && (
                <p className="text-red-400 text-xs mt-2">{parseError}</p>
              )}
            </div>
          </div>
        )}

        {/* Column mapping */}
        {breakdownStep === 'mapping' && parsedFile && (
          <ColumnMapper
            headers={parsedFile.headers}
            rows={parsedFile.rows}
            onDone={handleMappingDone}
            onCancel={handleCancelBreakdown}
          />
        )}

        {/* Review & save */}
        {breakdownStep === 'review' && pendingTxs && (
          <TransactionList
            transactions={pendingTxs}
            statementTotal={statementTotal}
            onSave={handleSaveTransactions}
            onCancel={handleCancelBreakdown}
          />
        )}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all
                   bg-blue-600 hover:bg-blue-500 text-white active:scale-[0.99]"
      >
        {saved ? (
          <>
            <CheckCircle size={18} />
            Guardado
          </>
        ) : (
          <>
            <Save size={18} />
            Guardar
          </>
        )}
      </button>
    </div>
  )
}

// Mini-summary of already saved transactions
function ExistingBreakdownSummary({ transactions, onEdit }) {
  const summary = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount
    return acc
  }, {})
  const top = Object.entries(summary)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
  const total = transactions.reduce((s, t) => s + t.amount, 0)

  return (
    <div className="bg-slate-800/40 rounded-lg p-4 space-y-2">
      {top.map(([cat, amt]) => (
        <div key={cat} className="flex items-center justify-between text-sm">
          <span className="text-slate-400">{cat}</span>
          <span className="text-slate-200 tabular-nums">{formatARS(amt)}</span>
        </div>
      ))}
      {Object.keys(summary).length > 4 && (
        <p className="text-xs text-slate-600">+ {Object.keys(summary).length - 4} categorías más</p>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-slate-700 text-sm font-medium">
        <span className="text-slate-400">Total</span>
        <span className="text-white tabular-nums">{formatARS(total)}</span>
      </div>
      <button
        onClick={onEdit}
        className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors mt-1"
      >
        <Pencil size={11} />
        Editar categorías
      </button>
    </div>
  )
}
