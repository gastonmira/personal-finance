import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import useFinanceStore from '../store/useFinanceStore'
import { useShallow } from 'zustand/react/shallow'
import { useTranslation } from '../i18n/useTranslation'

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#38bdf8', // sky
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#64748b', // slate
]

function ColorSwatch({ color, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(color)}
      className={`w-6 h-6 rounded-full transition-all ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-110'}`}
      style={{ backgroundColor: color }}
    />
  )
}

function CardRow({ card, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-800 last:border-0">
      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: card.color }} />
      <span className="flex-1 text-slate-200 text-sm font-medium">{card.name}</span>
      <button
        onClick={() => onEdit(card)}
        className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors"
        title="Edit"
      >
        <Pencil size={14} />
      </button>
      <button
        onClick={() => onDelete(card.id)}
        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function CardForm({ initial, onSave, onCancel, t }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? PRESET_COLORS[0])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSave({ name: trimmed, color })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">{t('cardName')}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('cardNamePlaceholder')}
          maxLength={40}
          autoFocus
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm
                     focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30
                     placeholder:text-slate-600 transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">{t('cardColor')}</label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <ColorSwatch key={c} color={c} selected={color === c} onClick={setColor} />
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={!name.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40
                     text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Check size={14} />
          {t('saveCard')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700
                     text-slate-400 rounded-lg text-sm font-medium transition-colors"
        >
          <X size={14} />
          {t('cancel')}
        </button>
      </div>
    </form>
  )
}

export default function Settings() {
  const cards = useFinanceStore(useShallow((s) => s.config.cards))
  const addCard = useFinanceStore((s) => s.addCard)
  const removeCard = useFinanceStore((s) => s.removeCard)
  const updateCard = useFinanceStore((s) => s.updateCard)
  const t = useTranslation()

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCard, setEditingCard] = useState(null) // card object being edited

  const handleAdd = ({ name, color }) => {
    addCard({ id: crypto.randomUUID(), name, color })
    setShowAddForm(false)
  }

  const handleEdit = ({ name, color }) => {
    updateCard(editingCard.id, { name, color })
    setEditingCard(null)
  }

  const handleDelete = (id) => {
    removeCard(id)
    if (editingCard?.id === id) setEditingCard(null)
  }

  return (
    <div className="p-8 max-w-lg">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">{t('settingsTitle')}</h2>
        <p className="text-slate-500 text-sm mt-1">{t('settingsSubtitle')}</p>
      </div>

      {/* Cards section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">{t('cardsSection')}</h3>
          {!showAddForm && !editingCard && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Plus size={14} />
              {t('addCard')}
            </button>
          )}
        </div>

        {cards.length === 0 && !showAddForm && (
          <p className="text-slate-500 text-sm py-4 text-center">{t('noCardsConfigured')}</p>
        )}

        {/* Card list */}
        {cards.map((card) =>
          editingCard?.id === card.id ? (
            <div key={card.id} className="py-3 border-b border-slate-800 last:border-0">
              <CardForm
                initial={card}
                onSave={handleEdit}
                onCancel={() => setEditingCard(null)}
                t={t}
              />
            </div>
          ) : (
            <CardRow
              key={card.id}
              card={card}
              onEdit={(c) => { setEditingCard(c); setShowAddForm(false) }}
              onDelete={handleDelete}
            />
          )
        )}

        {/* Add form */}
        {showAddForm && (
          <div className="pt-4 border-t border-slate-800 mt-2">
            <CardForm
              onSave={handleAdd}
              onCancel={() => setShowAddForm(false)}
              t={t}
            />
          </div>
        )}

        {!showAddForm && !editingCard && (
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5
                       border border-dashed border-slate-700 hover:border-slate-500
                       text-slate-500 hover:text-slate-300 rounded-lg text-sm transition-colors"
          >
            <Plus size={15} />
            {t('addCard')}
          </button>
        )}
      </div>
    </div>
  )
}
