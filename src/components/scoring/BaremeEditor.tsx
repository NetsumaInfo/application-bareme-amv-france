import { useMemo, useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import { generateId } from '@/utils/formatters'
import type { Bareme, Criterion, CriterionType } from '@/types/bareme'

const CRITERION_TYPES: { value: CriterionType; label: string }[] = [
  { value: 'numeric', label: 'Numérique' },
  { value: 'slider', label: 'Slider' },
  { value: 'boolean', label: 'Oui / Non' },
]

const CATEGORY_ACCENTS = [
  'border-orange-500/40 bg-orange-950/20 text-orange-300',
  'border-violet-500/40 bg-violet-950/20 text-violet-300',
  'border-emerald-500/40 bg-emerald-950/20 text-emerald-300',
  'border-amber-500/40 bg-amber-950/20 text-amber-300',
  'border-sky-500/40 bg-sky-950/20 text-sky-300',
  'border-rose-500/40 bg-rose-950/20 text-rose-300',
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
    category: 'Général',
  }
}

function normalizeCriterion(raw: Criterion): Criterion {
  const type = raw.type === 'boolean' || raw.type === 'slider' ? raw.type : 'numeric'
  const weight = Number.isFinite(raw.weight) ? Math.max(0.1, raw.weight) : 1

  if (type === 'boolean') {
    return {
      ...raw,
      type,
      weight,
      min: 0,
      max: 1,
      step: 1,
    }
  }

  const min = Number.isFinite(raw.min) ? Number(raw.min) : 0
  const max = Number.isFinite(raw.max) ? Number(raw.max) : 10
  const step = Number.isFinite(raw.step) && Number(raw.step) > 0 ? Number(raw.step) : 0.5

  return {
    ...raw,
    type,
    weight,
    min,
    max: max < min ? min : max,
    step,
  }
}

function getCriterionMax(criterion: Criterion): number {
  if (criterion.type === 'boolean') return 1
  return criterion.max ?? 10
}

function getCriterionNotationLabel(criterion: Criterion): string {
  if (criterion.type === 'boolean') return 'Oui / Non'
  return `${criterion.min ?? 0} → ${criterion.max ?? 10} (pas ${criterion.step ?? 0.5})`
}

function getTotalPoints(criteria: Criterion[]): number {
  return Math.round(
    criteria
      .filter((c) => c.name.trim())
      .reduce((sum, c) => sum + getCriterionMax(c) * c.weight, 0) * 100,
  ) / 100
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

  const readOnly = editingBareme?.isOfficial === true

  const categoryOrder = useMemo(() => {
    return Array.from(
      new Set(
        criteria
          .map((c) => (c.category?.trim() || 'Général'))
          .filter(Boolean),
      ),
    )
  }, [criteria])

  const categoryStats = useMemo(() => {
    const stats = new Map<string, { count: number; total: number }>()
    for (const criterion of criteria) {
      if (!criterion.name.trim()) continue
      const key = criterion.category?.trim() || 'Général'
      const current = stats.get(key) ?? { count: 0, total: 0 }
      stats.set(key, {
        count: current.count + 1,
        total: Math.round((current.total + getCriterionMax(criterion) * criterion.weight) * 100) / 100,
      })
    }
    return stats
  }, [criteria])

  const getCategoryAccent = (category: string) => {
    const idx = categoryOrder.indexOf(category)
    return CATEGORY_ACCENTS[idx >= 0 ? idx % CATEGORY_ACCENTS.length : 0]
  }

  if (!showBaremeEditor) return null

  const resetForm = () => {
    setEditingBareme(null)
    setName('')
    setDescription('')
    setCriteria([emptyCriterion()])
    setError('')
  }

  const onClose = () => {
    setShowBaremeEditor(false)
    setMode('list')
    resetForm()
  }

  const startNew = () => {
    resetForm()
    setMode('edit')
  }

  const startEdit = (bareme: Bareme) => {
    setEditingBareme(bareme)
    setName(bareme.name)
    setDescription(bareme.description || '')
    setCriteria(
      bareme.criteria.map((criterion) =>
        normalizeCriterion({
          ...criterion,
          category: criterion.category || 'Général',
        }),
      ),
    )
    setMode('edit')
    setError('')
  }

  const handleDelete = (baremeId: string) => {
    if (confirm('Supprimer ce barème ?')) {
      removeBareme(baremeId)
    }
  }

  const addCriterion = () => {
    setCriteria((prev) => [...prev, emptyCriterion()])
  }

  const removeCriterion = (index: number) => {
    if (criteria.length <= 1) return
    setCriteria((prev) => prev.filter((_, i) => i !== index))
  }

  const updateCriterion = (index: number, updates: Partial<Criterion>) => {
    setCriteria((prev) =>
      prev.map((criterion, i) => {
        if (i !== index) return criterion
        const next = normalizeCriterion({ ...criterion, ...updates })
        return next
      }),
    )
  }

  const handleSave = () => {
    setError('')

    if (!name.trim()) {
      setError('Le nom du barème est requis.')
      return
    }

    const normalized = criteria
      .map((criterion) => normalizeCriterion(criterion))
      .filter((criterion) => criterion.name.trim())

    if (normalized.length === 0) {
      setError('Ajoute au moins un critère.')
      return
    }

    for (const criterion of normalized) {
      if (criterion.weight <= 0) {
        setError(`Coefficient invalide pour "${criterion.name}".`)
        return
      }
      if (criterion.type !== 'boolean') {
        if ((criterion.max ?? 10) < (criterion.min ?? 0)) {
          setError(`Min/Max invalide pour "${criterion.name}".`)
          return
        }
        if ((criterion.step ?? 0) <= 0) {
          setError(`Pas invalide pour "${criterion.name}".`)
          return
        }
      }
    }

    const now = new Date().toISOString()
    const bareme: Bareme = {
      id: editingBareme?.id || `custom-${generateId()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      isOfficial: false,
      criteria: normalized.map((criterion) => ({
        ...criterion,
        name: criterion.name.trim(),
        category: criterion.category?.trim() || 'Général',
      })),
      totalPoints: getTotalPoints(normalized),
      createdAt: editingBareme?.createdAt || now,
      updatedAt: now,
    }

    addBareme(bareme)
    setMode('list')
    resetForm()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-gray-700">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <h2 className="text-base font-semibold text-white">
            {mode === 'list' ? 'Barèmes' : readOnly ? 'Consultation du barème' : editingBareme ? 'Modifier le barème' : 'Nouveau barème'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {mode === 'list' ? (
            <div className="flex flex-col gap-3">
              {availableBaremes.map((bareme) => {
                const categories = Array.from(new Set(bareme.criteria.map((criterion) => criterion.category || 'Général')))
                return (
                  <div key={bareme.id} className="rounded-lg border border-gray-700 bg-surface-dark/60 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white truncate">{bareme.name}</span>
                          {bareme.isOfficial && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-600/30 text-primary-300 shrink-0">
                              Officiel
                            </span>
                          )}
                        </div>
                        {bareme.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{bareme.description}</p>
                        )}
                        <div className="text-[11px] text-gray-400 mt-1">
                          {bareme.criteria.length} critères • {bareme.totalPoints} points
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {categories.map((category, index) => (
                            <span
                              key={`${bareme.id}-${category}`}
                              className={`text-[10px] px-2 py-0.5 rounded border ${CATEGORY_ACCENTS[index % CATEGORY_ACCENTS.length]}`}
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(bareme)}
                          className="px-3 py-1 text-xs rounded bg-surface-light text-gray-300 hover:text-white transition-colors"
                        >
                          {bareme.isOfficial ? 'Voir' : 'Modifier'}
                        </button>
                        {!bareme.isOfficial && (
                          <button
                            onClick={() => handleDelete(bareme.id)}
                            className="p-1 rounded text-gray-500 hover:text-accent hover:bg-surface-light transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              <button
                onClick={startNew}
                className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-primary-500 transition-colors"
              >
                <Plus size={16} />
                <span className="text-sm">Créer un barème</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Nom du barème</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Finale 2026"
                    className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none text-sm"
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Total calculé</label>
                  <div className="px-3 py-2 rounded-lg border border-gray-700 bg-surface-dark text-sm font-semibold text-white">
                    {getTotalPoints(criteria)} points
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Description (optionnel)</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ex: Barème phase finale"
                  className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none text-sm"
                  disabled={readOnly}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {Array.from(categoryStats.entries()).map(([category, stat]) => (
                  <span key={category} className={`text-[11px] px-2 py-1 rounded border ${getCategoryAccent(category)}`}>
                    {category}: {stat.count} crit. • /{stat.total}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Critères</span>
                {!readOnly && (
                  <button
                    onClick={addCriterion}
                    className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    <Plus size={13} />
                    Ajouter un critère
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {criteria.map((criterion, index) => {
                  const category = criterion.category?.trim() || 'Général'
                  const accent = getCategoryAccent(category)
                  return (
                    <div key={criterion.id} className="rounded-lg border border-gray-700 bg-surface-dark/60 p-3">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] text-gray-500 mb-0.5">Catégorie</label>
                          <input
                            value={category}
                            onChange={(e) => updateCriterion(index, { category: e.target.value })}
                            placeholder="Général"
                            className={`w-full px-2 py-1.5 rounded border text-xs focus:outline-none focus:border-primary-500 ${accent}`}
                            disabled={readOnly}
                          />
                        </div>

                        <div className="md:col-span-4">
                          <label className="block text-[10px] text-gray-500 mb-0.5">Nom de notation</label>
                          <input
                            value={criterion.name}
                            onChange={(e) => updateCriterion(index, { name: e.target.value })}
                            placeholder="Rythme / Synchro"
                            className="w-full px-2 py-1.5 bg-surface border border-gray-700 rounded text-xs text-white focus:border-primary-500 focus:outline-none"
                            disabled={readOnly}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[10px] text-gray-500 mb-0.5">Type</label>
                          <select
                            value={criterion.type}
                            onChange={(e) => updateCriterion(index, { type: e.target.value as CriterionType })}
                            className="w-full px-2 py-1.5 bg-surface border border-gray-700 rounded text-xs text-white focus:border-primary-500 focus:outline-none"
                            disabled={readOnly}
                          >
                            {CRITERION_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-1">
                          <label className="block text-[10px] text-gray-500 mb-0.5">Coef.</label>
                          <input
                            type="number"
                            value={criterion.weight}
                            onChange={(e) => updateCriterion(index, { weight: Number(e.target.value) })}
                            min={0.1}
                            step={0.1}
                            className="w-full px-2 py-1.5 bg-surface border border-gray-700 rounded text-xs text-white text-center focus:border-primary-500 focus:outline-none"
                            disabled={readOnly}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[10px] text-gray-500 mb-0.5">Notation</label>
                          <div className="px-2 py-1.5 rounded border border-gray-700 bg-surface text-[11px] text-gray-300 truncate">
                            {getCriterionNotationLabel(criterion)}
                          </div>
                        </div>

                        <div className="md:col-span-1 flex items-end justify-between md:justify-end gap-2">
                          <label className="flex items-center gap-1 text-[10px] text-gray-400 pb-1 md:pb-2">
                            <input
                              type="checkbox"
                              checked={criterion.required}
                              onChange={(e) => updateCriterion(index, { required: e.target.checked })}
                              disabled={readOnly}
                              className="accent-primary-500"
                            />
                            Requis
                          </label>
                          {!readOnly && criteria.length > 1 && (
                            <button
                              onClick={() => removeCriterion(index)}
                              className="p-1 rounded text-gray-500 hover:text-accent hover:bg-surface transition-colors"
                              title="Supprimer ce critère"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mt-2">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] text-gray-500 mb-0.5">Min</label>
                          <input
                            type="number"
                            value={criterion.min ?? 0}
                            onChange={(e) => updateCriterion(index, { min: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 bg-surface border border-gray-700 rounded text-xs text-white text-center focus:border-primary-500 focus:outline-none disabled:opacity-40"
                            disabled={readOnly || criterion.type === 'boolean'}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] text-gray-500 mb-0.5">Max</label>
                          <input
                            type="number"
                            value={criterion.max ?? 10}
                            onChange={(e) => updateCriterion(index, { max: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 bg-surface border border-gray-700 rounded text-xs text-white text-center focus:border-primary-500 focus:outline-none disabled:opacity-40"
                            disabled={readOnly || criterion.type === 'boolean'}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] text-gray-500 mb-0.5">Pas</label>
                          <input
                            type="number"
                            value={criterion.step ?? 0.5}
                            onChange={(e) => updateCriterion(index, { step: Number(e.target.value) })}
                            step={0.1}
                            className="w-full px-2 py-1.5 bg-surface border border-gray-700 rounded text-xs text-white text-center focus:border-primary-500 focus:outline-none disabled:opacity-40"
                            disabled={readOnly || criterion.type === 'boolean'}
                          />
                        </div>
                        <div className="md:col-span-6">
                          <label className="block text-[10px] text-gray-500 mb-0.5">Description</label>
                          <input
                            value={criterion.description || ''}
                            onChange={(e) => updateCriterion(index, { description: e.target.value })}
                            placeholder="Optionnel"
                            className="w-full px-2 py-1.5 bg-surface border border-gray-700 rounded text-xs text-white focus:border-primary-500 focus:outline-none"
                            disabled={readOnly}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {error && <p className="text-xs text-accent">{error}</p>}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700">
          {mode === 'edit' ? (
            <>
              <button
                onClick={() => {
                  setMode('list')
                  resetForm()
                }}
                className="px-4 py-2 text-sm rounded-lg bg-surface-light text-gray-300 hover:text-white transition-colors"
              >
                Retour
              </button>
              {!readOnly && (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors"
                >
                  {editingBareme ? 'Enregistrer' : 'Créer le barème'}
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-surface-light text-gray-300 hover:text-white transition-colors"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
