import { useState, useRef } from 'react'
import { Upload, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { parseXLSX } from '../utils/xlsxParser'
import useFinanceStore from '../store/useFinanceStore'
import { useTranslation } from '../i18n/useTranslation'

export default function FileUpload({ onImported }) {
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [message, setMessage] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)
  const importData = useFinanceStore((s) => s.importData)
  const t = useTranslation()

  const handleFile = async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xls'].includes(ext)) {
      setStatus('error')
      setMessage(t('onlyXLS'))
      return
    }
    setStatus('loading')
    setMessage('')
    try {
      const data = await parseXLSX(file)
      const count = Object.keys(data).length
      importData(data)
      setStatus('success')
      setMessage(`${count} ${t('monthsImported')}`)
      onImported?.()
    } catch (err) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onClick={() => inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        dragging
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-slate-700 hover:border-slate-500 bg-slate-900/50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {status === 'loading' && (
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">{t('processing')}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center gap-3">
          <CheckCircle className="text-emerald-400" size={36} />
          <p className="text-emerald-400 font-medium">{message}</p>
          <p className="text-slate-500 text-xs">{t('clickImportAnother')}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="text-red-400" size={36} />
          <p className="text-red-400 font-medium">{message}</p>
          <p className="text-slate-500 text-xs">{t('clickTryAgain')}</p>
        </div>
      )}

      {status === 'idle' && (
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center">
            <FileSpreadsheet className="text-slate-400" size={28} />
          </div>
          <div>
            <p className="text-slate-300 font-medium">{t('dragXLS')}</p>
            <p className="text-slate-500 text-sm mt-1">{t('orClick')}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Upload size={12} />
            <span>{t('supportsFormats')}</span>
          </div>
        </div>
      )}
    </div>
  )
}
