import { useState } from 'react'
import { X, Plus, Trash2, GripVertical } from 'lucide-react'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import { generateId } from '@/utils/formatters'
import type { Bareme, Criterion, CriterionType } from '@/types/bareme'

const CRITERION_TYPES: { value: CriterionType; label: string }[] = [
  { value: 'numeric', label: 'Numérique' },
  { value: 'slider', label: 'Slider' },
  { value: 'boolean', label: 'Oui/Non' },
]

function emptyCriterion(): Criterion {
  return {
    id: generateId(),
    name: '',
    type: 'numeric',
    weight: 1,
    min: 0,
    max: 10,
    step: 0.5,
    required: true,
    category: '',
  }
}

export default function BaremeEditor() {
  const { showBaremeEditor, setShowBaremeEditor } = useUIStore()
  const { addBareme, availableBaremes, removeBareme } = useNotationStore()

  const [mode, setMode] = useState<'list' | 'edit'>('list')
  const [editingBareme, setEditingBareme] = useState<Bareme | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [criteria, setCriteria] = useState<Criterion[]>([emptyCriterion()])
  const [error, setError] = useState('')

  if (!showBaremeEditor) return null

  const onClose = () => {
    setShowBaremeEditor(false)
    setMode('list')
    resetForm()
  }

  const resetForm = () => {
    setEditingBareme(null)
    setName('')
    setDescription('')
    setCriteria([emptyCriterion()])
    setError('')
  }

  const startNew = () => {
    resetForm()
    setMode('edit')
  }

  const startEdit = (bareme: Bareme) => {
    setEditingBareme(bareme)
    setName(bareme.name)
    setDescription(bareme.description || '')
    setCriteria(bareme.criteria.map((c) => ({ ...c })))
    setMode('edit')
  }

  const handleDelete = (baremeId: string) => {
    if (confirm('Supprimer ce barème ?')) {
      removeBareme(baremeId)
    }
  }

  const addCriterion = () => {
    setCriteria([...criteria, emptyCriterion()])
  }

  const removeCriterion = (index: number) => {
    if (criteria.length <= 1) return
    setCriteria(criteria.filter((_, i) => i !== index))
  }

  const updateCriterion = (index: number, updates: Partial<Criterion>) => {
    setCriteria(criteria.map((c, i) => (i === index ? { ...c, ...updates } : c)))
  }

  const handleSave = () => {
    setError('')

    if (!name.trim()) {
      setError('Le nom du barème est requis')
      return
    }

    const validCriteria = criteria.filter((c) => c.name.trim())
    if (validCriteria.length === 0) {
      setError('Au moins un critère avec un nom est requis')
      return
    }

    const totalPoints = validCriteria.reduce((sum, c) => {
      const max = c.max ?? 10
      return sum + max * c.weight
    }, 0)

    const now = new Date().toISOString()
    const bareme: Bareme = {
      id: editingBareme?.id || `custom-${generateId()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      isOfficial: false,
      criteria: validCriteria.map((c) => ({
        ...c,
        name: c.name.trim(),
        category: c.category?.trim() || undefined,
      })),
      totalPoints,
      createdAt: editingBareme?.createdAt || now,
      updatedAt: now,
    }

    addBareme(bareme)
    setMode('list')
    resetForm()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">
            {mode === 'list' ? 'Gestion des Barèmes' : editingBareme ? 'Modifier le Barème' : 'Nouveau Barème'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'list' ? (
            <div className="flex flex-col gap-3">
              {availableBaremes.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 bg-surface-dark rounded-lg border border-gray-700"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{b.name}</span>
                      {b.isOfficial && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-600/30 text-primary-300">
                          Officiel
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {b.criteria.length} critères - {b.totalPoints} points
                    </p>
                    {b.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{b.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(b)}
                      className="px-2.5 py-1 text-xs rounded bg-surface-light text-gray-300 hover:text-white"
                      disabled={b.isOfficial}
                      title={b.isOfficial ? 'Les barèmes officiels ne sont pas modifiables' : 'Modifier'}
                    >
                      {b.isOfficial ? 'Voir' : 'Modifier'}
                    </button>
                    {!b.isOfficial && (
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="p-1 rounded text-gray-500 hover:text-accent hover:bg-surface-light"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                onClick={startNew}
                className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-primary-500 transition-colors"
              >
                <Plus size={16} />
                <span className="text-sm">Créer un nouveau barème</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Barème info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Nom du barème</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Mon barème personnalisé"
                    className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none text-sm"
                    disabled={editingBareme?.isOfficial}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Description (optionnel)</label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="ex: Barème pour compétitions internes"
                    className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none text-sm"
                    disabled={editingBareme?.isOfficial}
                  />
                </div>
              </div>

              {/* Criteria list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-400">Critères</label>
                  {!editingBareme?.isOfficial && (
                    <button
                      onClick={addCriterion}
                      className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
                    >
                      <Plus size={12} />
                      Ajouter
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {criteria.map((criterion, index) => (
                    <div
                      key={criterion.id}
                      className="flex items-start gap-2 p-3 bg-surface-dark rounded-lg border border-gray-700"
                    >
                      <GripVertical size={14} className="text-gray-600 mt-2 flex-shrink-0" />

                      <div className="flex-1 grid grid-cols-12 gap-2">
                        {/* Name */}
                        <div className="col-span-4">
                          <label className="block text-[10px] text-gray-500 mb-0.5">Nom</label>
                          <input
                            value={criterion.name}
                            onChange={(e) => updateCriterion(index, { name: e.target.value })}
                            placeholder="Critère"
                            className="w-full px-2 py-1.5 bg-surface border border-gray-700 rounded text-xs text-white focus:border-primary-500 focus:outline-none"
                            disabled={editingBareme?.isOfficial}
                          />
                        </div>

                        {/* Type */}
                        <div className="col-span-2">
                          <label className="block text-[10px] text-gray-500 mb-0.5">Type</label>
                          <select
                            value={criterion.type}
                            onChange={(e) => updateCriterion(index, { type: e.target.value as CriterionType })}
                            className="w-full px-2 py-1.5 bg-surface border border-gray-700 rounded text-xs text-white focus:border-primary-500 focus:outline-none"
                            disabled={editingBareme?.isOfficial}
                          >
                            {CRITERION_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Min */}
                        <div className="col-span-1">
                          <label className="block text-[10px] text-gray-500 mb-0.5">Min</label>
                          <input
                            type="number"
                            value={criterion.min ?? 0}
                            onChange={(e) => updateCriterion(index, { min: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 bg-surface border border-gray-700 rounded text-xs text-white text-center focus:border-primary-500 focus:outline-none"
                            disabled={editingBareme?.isOfficial}
                          />
                        </div>

                        {/* Max */}
                        <div className="col-span-1">
                          <label className="block text-[10px] text-gray-500 mb-0.5">Max</label>
                          <input
                            type="number"
                            value={criterion.max ?? 10}
                            onChange={(e) => updateCriterion(index, { max: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 bg-surface border border-gray-700 rounded text-xs text-white text-center focus:border-primary-500 focus:outline-none"
                            disabled={editingBareme?.isOfficial}
                          />
                        </div>

                        {/* Step */}
                        <div className="col-span-1">
                          <label className="block text-[10px] text-gray-500 mb-0.5">Pas</label>
                          <input
                            type="number"
                            value={criterion.step ?? 0.5}
                            onChange={(e) => updateCriterion(index, { step: Number(e.target.value) })}
                            step="0.1"
                            className="w-full px-2 py-1.5 bg-surface border border-gray-700 rounded text-xs text-white text-center focus:border-primary-500 focus:outline-none"
                            disabled={editingBareme?.isOfficial}
                          />
                        </div>

                        {/* Weight */}
                        <div className="col-span-1">
                          <label className="block text-[10px] text-gray-500 mb-0.5">Poids</label>
                          <input
                            type="number"
                            value={criterion.weight}
                            onChange={(e) => updateCriterion(index, { weight: Number(e.target.value) })}
                            min={0}
                            step="0.1"
                            className="w-full px-2 py-1.5 bg-surface border border-gray-700 rounded text-xs text-white text-center focus:border-primary-500 focus:outline-none"
                            disabled={editingBareme?.isOfficial}
                          />
                        </div>

                        {/* Category */}
                        <div className="col-span-2">
                          <label className="block text-[10px] text-gray-500 mb-0.5">Catégorie</label>
                          <input
                            value={criterion.category || ''}
                            onChange={(e) => updateCriterion(index, { category: e.target.value })}
                            placeholder="ex: Technique"
                            className="w-full px-2 py-1.5 bg-surface border border-gray-700 rounded text-xs text-white focus:border-primary-500 focus:outline-none"
                            disabled={editingBareme?.isOfficial}
                          />
                        </div>
                      </div>

                      {!editingBareme?.isOfficial && criteria.length > 1 && (
                        <button
                          onClick={() => removeCriterion(index)}
                          className="p-1 rounded text-gray-500 hover:text-accent mt-1 flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total preview */}
              <div className="text-xs text-gray-400">
                Total: {criteria.filter((c) => c.name.trim()).reduce((s, c) => s + (c.max ?? 10) * c.weight, 0)} points
              </div>

              {error && <p className="text-xs text-accent">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-700">
          {mode === 'edit' ? (
            <>
              <button
                onClick={() => { setMode('list'); resetForm() }}
                className="px-4 py-2 text-sm rounded-lg bg-surface-light text-gray-300 hover:text-white"
              >
                Retour
              </button>
              {!editingBareme?.isOfficial && (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium"
                >
                  {editingBareme ? 'Enregistrer' : 'Créer le barème'}
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-surface-light text-gray-300 hover:text-white"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
