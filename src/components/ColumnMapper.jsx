import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { buildTransactions } from '../utils/statementParser'
import { categorizeTransactions } from '../utils/categorizer'

const FIELD_LABELS = {
  dateIdx: 'Fecha',
  descIdx: 'Descripción',
  amountIdx: 'Monto',
}

/**
 * Shows the detected columns and lets the user map them to date/desc/amount.
 * On confirm, calls onDone(transactions[]) with categorized transactions.
 */
export default function ColumnMapper({ headers, rows, onDone, onCancel }) {
  // Try to auto-detect columns by common header names
  const autoDetect = () => {
    const lower = headers.map((h) => h.toLowerCase())
    const dateIdx = lower.findIndex((h) =>
      ['fecha', 'date', 'f.', 'fecha operacion', 'fecha operación'].some((k) => h.includes(k))
    )
    const descIdx = lower.findIndex((h) =>
      ['descripcion', 'descripción', 'concepto', 'detalle', 'comercio', 'description', 'nombre'].some((k) =>
        h.includes(k)
      )
    )
    const amountIdx = lower.findIndex((h) =>
      ['monto', 'importe', 'amount', 'pesos', 'total', 'debito', 'débito', 'cargo'].some((k) =>
        h.includes(k)
      )
    )
    return {
      dateIdx: dateIdx >= 0 ? dateIdx : 0,
      descIdx: descIdx >= 0 ? descIdx : 1,
      amountIdx: amountIdx >= 0 ? amountIdx : 2,
    }
  }

  const [mapping, setMapping] = useState(autoDetect)
  const [error, setError] = useState(null)

  const previewRows = rows.slice(0, 5)

  const handleConfirm = () => {
    setError(null)
    try {
      const raw = buildTransactions(rows, mapping)
      if (raw.length === 0) {
        setError('No se encontraron transacciones válidas. Verificá las columnas seleccionadas.')
        return
      }
      const categorized = categorizeTransactions(raw)
      onDone(categorized)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Column selectors */}
      <div>
        <p className="text-sm text-slate-400 mb-4">
          Se detectaron <span className="text-white font-medium">{headers.length} columnas</span> y{' '}
          <span className="text-white font-medium">{rows.length} filas</span>. Seleccioná cuál columna corresponde a cada campo:
        </p>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(FIELD_LABELS).map(([field, label]) => (
            <div key={field}>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                {label}
              </label>
              <select
                value={mapping[field]}
                onChange={(e) =>
                  setMapping((m) => ({ ...m, [field]: parseInt(e.target.value) }))
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm
                           focus:outline-none focus:border-blue-500 transition-colors"
              >
                {headers.map((h, i) => (
                  <option key={i} value={i}>
                    {i}: {h || `(sin nombre)`}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Preview table */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
          Vista previa (primeras 5 filas)
        </p>
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                {['Fecha', 'Descripción', 'Monto'].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-slate-500 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {previewRows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-800/30">
                  <td className="px-3 py-2 text-slate-400">{String(row[mapping.dateIdx] ?? '—')}</td>
                  <td className="px-3 py-2 text-slate-300">{String(row[mapping.descIdx] ?? '—')}</td>
                  <td className="px-3 py-2 text-slate-300 tabular-nums">{String(row[mapping.amountIdx] ?? '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-4 py-3">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Categorizar
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}
