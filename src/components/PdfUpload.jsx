import { useState, useRef } from 'react'
import { FileText, Loader2, X, AlertTriangle, Upload } from 'lucide-react'
import TransactionList from './TransactionList'
import { categorizeTransactions } from '../utils/categorizer'
import { useTranslation } from '../i18n/useTranslation'

// step: 'idle' | 'loading' | 'review' | 'unmatched'

export default function PdfUpload({ onDone, onClose }) {
  const t = useTranslation()
  const [step, setStep] = useState('idle')
  const [detectedBank, setDetectedBank] = useState(null)
  const [pendingTxs, setPendingTxs] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const fileInputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file || !file.name.endsWith('.pdf')) return
    setStep('loading')
    setErrorMsg(null)

    try {
      // Dynamic import so pdfjs-dist (~3MB) only loads when user uses this feature
      const { parsePdfStatement } = await import('../utils/pdfParser')
      const result = await parsePdfStatement(file)

      if (result.unmatched) {
        setErrorMsg(result.error ?? null)
        setStep('unmatched')
        return
      }

      const categorized = categorizeTransactions(result.transactions)
      setDetectedBank(result.bank)
      setPendingTxs(categorized)
      setStep('review')
    } catch (err) {
      setErrorMsg(err.message)
      setStep('unmatched')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleSave = (txs) => {
    onDone(txs)
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-white text-sm">{t('pdfTitle')}</h4>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Idle — drag-drop zone */}
      {step === 'idle' && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 py-10 border-2 border-dashed border-slate-600
                     hover:border-slate-400 rounded-lg cursor-pointer transition-colors group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = '' }}
          />
          <FileText size={28} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
          <div className="text-center">
            <p className="text-slate-300 text-sm font-medium">{t('pdfDragZone')}</p>
            <p className="text-slate-500 text-xs mt-1">{t('pdfAccepts')}</p>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600
                       text-slate-300 rounded-lg text-sm font-medium transition-colors"
          >
            <Upload size={14} />
            {t('pdfBrowse')}
          </button>
        </div>
      )}

      {/* Loading */}
      {step === 'loading' && (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <Loader2 size={24} className="text-blue-400 animate-spin" />
          <p className="text-slate-400 text-sm">{t('pdfReading')}</p>
        </div>
      )}

      {/* Unmatched */}
      {step === 'unmatched' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-600/10 border border-amber-600/30 rounded-lg">
            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-amber-300 font-medium">{t('pdfNoMatch')}</p>
              {errorMsg && <p className="text-amber-400/70 text-xs mt-1">{errorMsg}</p>}
              <p className="text-slate-400 text-xs mt-2">{t('pdfNoMatchHint')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep('idle')}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600
                         text-slate-300 rounded-lg text-sm font-medium transition-colors"
            >
              {t('pdfTryAnother')}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:text-slate-300 rounded-lg text-sm transition-colors"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Review */}
      {step === 'review' && pendingTxs && (
        <div>
          {detectedBank && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs text-slate-500">{t('smsBankDetected')}:</span>
              <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded-full text-xs font-medium">
                {detectedBank}
              </span>
            </div>
          )}
          <TransactionList
            transactions={pendingTxs}
            statementTotal={null}
            onSave={handleSave}
            onCancel={() => setStep('idle')}
          />
        </div>
      )}
    </div>
  )
}
