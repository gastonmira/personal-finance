import { useState, useCallback } from 'react'
import { X, MessageSquare } from 'lucide-react'
import { parseSmsBlock } from '../utils/smsParser'
import { categorizeTransactions } from '../utils/categorizer'
import { useTranslation } from '../i18n/useTranslation'
import { formatARS } from '../utils/format'

/**
 * SmsPaste — panel component for pasting bank SMS / push notifications.
 *
 * Props:
 *   onDone(transactions)  — called with categorized transactions when user confirms
 *   onClose()             — called when user cancels / closes the panel
 */
export default function SmsPaste({ onDone, onClose }) {
  const t = useTranslation()
  const [text, setText] = useState('')
  const parsed = parseSmsBlock(text)

  const handleChange = useCallback((e) => {
    setText(e.target.value)
  }, [])

  const handleDone = () => {
    if (parsed.length === 0) return
    // Strip the `bank` field (not part of the stored transaction shape) before categorizing
    const raw = parsed.map(({ description, amount, date }) => ({ description, amount, date }))
    const categorized = categorizeTransactions(raw)
    onDone(categorized)
  }

  const addLabel = t('smsAddTransactions').replace('{n}', parsed.length)

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-indigo-400" />
          <h3 className="font-semibold text-white text-sm">{t('smsTitle')}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 transition-colors"
          aria-label={t('cancel')}
        >
          <X size={16} />
        </button>
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={handleChange}
        placeholder={t('smsPastePlaceholder')}
        rows={6}
        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 text-sm
                   focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30
                   placeholder:text-gray-600 resize-y transition-colors font-mono"
      />

      {/* Results */}
      {text.trim().length > 0 && (
        parsed.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-3 py-2 text-left">{t('colDate')}</th>
                  <th className="px-3 py-2 text-left">{t('colDescription')}</th>
                  <th className="px-3 py-2 text-right">{t('colAmount')}</th>
                  <th className="px-3 py-2 text-left">{t('smsBankDetected')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {parsed.map((tx, idx) => (
                  <tr key={idx} className="bg-gray-800 hover:bg-gray-750 transition-colors">
                    <td className="px-3 py-2 text-gray-400 tabular-nums whitespace-nowrap">{tx.date}</td>
                    <td className="px-3 py-2 text-gray-100 max-w-xs truncate">{tx.description}</td>
                    <td className="px-3 py-2 text-right text-gray-100 tabular-nums whitespace-nowrap">
                      {formatARS(tx.amount)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 bg-indigo-600/20 text-indigo-400 rounded-full text-xs whitespace-nowrap">
                        {tx.bank}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 bg-gray-900 rounded-lg px-4 py-3">
            {t('smsNoMatch')}
          </p>
        )
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleDone}
          disabled={parsed.length === 0}
          className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700
                     disabled:text-gray-500 text-white rounded-lg text-sm font-medium
                     transition-colors disabled:cursor-not-allowed"
        >
          {addLabel}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white
                     rounded-lg text-sm font-medium transition-colors"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  )
}
