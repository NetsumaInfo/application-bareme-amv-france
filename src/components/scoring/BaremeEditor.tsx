import { useMemo, useState } from 'react'
import { X, Plus, Trash2, Upload, Download } from 'lucide-react'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import { generateId } from '@/utils/formatters'
import { CATEGORY_COLOR_PRESETS, sanitizeColor, withAlpha } from '@/utils/colors'
import * as tauri from '@/services/tauri'
import type { Bareme, Criterion } from '@/types/bareme'

function emptyCriterion(): Criterion {
  return {
    id: generateId(),
    name: '',
    type: 'numeric',
    min: 0,
    max: 10,
    step: 0.5,
    required: true,
    category: '',
  }
}

function normalizeCriterion(raw: Criterion): Criterion {
  const step = Number.isFinite(raw.step) && Number(raw.step) > 0 ? Number(raw.step) : 0.5
  const max = Number.isFinite(raw.max) ? Number(raw.max) : 10

  return {
    ...raw,
    type: 'numeric',
    min: 0,
    max,
    step,
    required: raw.required !== false,
    category: raw.category?.trim() || '',
  }
}

function getCriterionMax(criterion: Criterion): number {
  return Number.isFinite(criterion.max) ? Number(criterion.max) : 10
}

function getTotalPoints(criteria: Criterion[]): number {
  return Math.round(
    criteria
      .filter((criterion) => criterion.name.trim())
      .reduce((sum, criterion) => sum + getCriterionMax(criterion), 0) * 100,
  ) / 100
}

function normalizeImportedBaremes(data: unknown): Bareme[] {
  const now = new Date().toISOString()

  const asRecord = (value: unknown): Record<string, unknown> | null =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null

  const parseCriteria = (input: unknown): Criterion[] => {
    if (!Array.isArray(input)) return []
    return input
      .map((item) => {
        const row = asRecord(item)
        if (!row) return null
        const name = String(row.name || '').trim()
        if (!name) return null
        return normalizeCriterion({
          id: typeof row.id === 'string' && row.id.trim() ? row.id : generateId(),
          name,
          description: typeof row.description === 'string' ? row.description : undefined,
          type: 'numeric',
          min: 0,
          max: Number(row.max ?? 10),
          step: Number(row.step ?? 0.5),
          required: row.required !== false,
          category: typeof row.category === 'string' ? row.category : '',
        })
      })
      .filter((criterion): criterion is Criterion => criterion !== null)
  }

  const parseCategoryColors = (input: unknown): Record<string, string> => {
    const output: Record<string, string> = {}
    const map = asRecord(input)
    if (!map) return output
    for (const [key, value] of Object.entries(map)) {
      if (!key.trim()) continue
      output[key.trim()] = sanitizeColor(typeof value === 'string' ? value : undefined)
    }
    return output
  }

  const parseOne = (input: unknown): Bareme | null => {
    const row = asRecord(input)
    if (!row) return null

    if (row.bareme) {
      return parseOne(row.bareme)
    }

    const name = String(row.name || '').trim()
    const criteria = parseCriteria(row.criteria)
    if (!name || criteria.length === 0) return null
    return {
      id: typeof row.id === 'string' && row.id.trim() ? row.id : `custom-${generateId()}`,
      name,
      description: typeof row.description === 'string' ? row.description : undefined,
      isOfficial: false,
      criteria,
      categoryColors: parseCategoryColors(row.categoryColors),
      totalPoints: getTotalPoints(criteria),
      createdAt: typeof row.createdAt === 'string' ? row.createdAt : now,
      updatedAt: now,
    }
  }

  if (Array.isArray(data)) {
    return data.map(parseOne).filter((bareme): bareme is Bareme => bareme !== null)
  }

  const root = asRecord(data)
  if (!root) return []

  if (Array.isArray(root.baremes)) {
    return root.baremes.map(parseOne).filter((bareme): bareme is Bareme => bareme !== null)
  }

  const one = parseOne(root)
  return one ? [one] : []
}

export default function BaremeEditor() {
  const { showBaremeEditor, setShowBaremeEditor } = useUIStore()
  const { addBareme, availableBaremes, removeBareme } = useNotationStore()

  const [mode, setMode] = useState<'list' | 'edit'>('list')
  const [editingBareme, setEditingBareme] = useState<Bareme | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [criteria, setCriteria] = useState<Criterion[]>([emptyCriterion()])
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  const readOnly = editingBareme?.isOfficial === true

  const categoryOrder = useMemo(() => {
    return Array.from(
      new Set(
        criteria
          .map((criterion) => criterion.category?.trim())
          .filter((category): category is string => Boolean(category)),
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
        total: Math.round((current.total + getCriterionMax(criterion)) * 100) / 100,
      })
    }
    return stats
  }, [criteria])

  const getCategoryColor = (category: string) => {
    if (!category) return '#64748b'
    const fromMap = categoryColors[category]
    if (fromMap) return sanitizeColor(fromMap)
    const idx = categoryOrder.indexOf(category)
    return CATEGORY_COLOR_PRESETS[idx >= 0 ? idx % CATEGORY_COLOR_PRESETS.length : 0]
  }

  if (!showBaremeEditor) return null

  const resetForm = () => {
    setEditingBareme(null)
    setName('')
    setDescription('')
    setCriteria([emptyCriterion()])
    setCategoryColors({})
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
    setCriteria(bareme.criteria.map((criterion) => normalizeCriterion(criterion)))
    setCategoryColors(Object.fromEntries(
      Object.entries(bareme.categoryColors || {}).map(([k, v]) => [k, sanitizeColor(v)]),
    ))
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
      prev.map((criterion, i) => (i === index ? normalizeCriterion({ ...criterion, ...updates }) : criterion)),
    )
  }

  const updateCategoryForCriterion = (index: number, rawCategory: string) => {
    updateCriterion(index, { category: rawCategory })
  }

  const commitCategoryColor = (rawCategory: string) => {
    const category = rawCategory.trim()
    if (!category) return
    setCategoryColors((prev) => {
      if (prev[category]) return prev
      const color = CATEGORY_COLOR_PRESETS[Object.keys(prev).length % CATEGORY_COLOR_PRESETS.length]
      return { ...prev, [category]: color }
    })
  }

  const handleImportBaremeJson = async () => {
    try {
      const filePath = await tauri.openJsonDialog()
      if (!filePath) return
      const data = await tauri.loadProjectFile(filePath)
      const imported = normalizeImportedBaremes(data)
      if (imported.length === 0) {
        alert('Aucun barème valide trouvé dans ce fichier JSON.')
        return
      }

      const existingIds = new Set(availableBaremes.map((b) => b.id))
      for (const bareme of imported) {
        const id = existingIds.has(bareme.id) ? `custom-${generateId()}` : bareme.id
        existingIds.add(id)
        addBareme({
          ...bareme,
          id,
          updatedAt: new Date().toISOString(),
          isOfficial: false,
        })
      }
      alert(`${imported.length} barème(s) importé(s).`)
    } catch (e) {
      console.error('Import barème JSON failed:', e)
      alert(`Erreur d'import JSON: ${e}`)
    }
  }

  const handleExportBaremeJson = async (bareme: Bareme) => {
    try {
      const filePath = await tauri.saveJsonDialog(`${bareme.name.replace(/[\\/:*?"<>|]+/g, '_')}.json`)
      if (!filePath) return
      await tauri.exportJsonFile(
        {
          ...bareme,
          isOfficial: false,
        },
        filePath,
      )
    } catch (e) {
      console.error('Export barème JSON failed:', e)
      alert(`Erreur d'export JSON: ${e}`)
    }
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
      if ((criterion.step ?? 0) <= 0) {
        setError(`Pas invalide pour "${criterion.name}".`)
        return
      }
    }

    const usedCategories = new Set(
      normalized
        .map((criterion) => criterion.category?.trim())
        .filter((category): category is string => Boolean(category)),
    )

    const nextCategoryColors: Record<string, string> = {}
    for (const category of usedCategories) {
      nextCategoryColors[category] = sanitizeColor(categoryColors[category], getCategoryColor(category))
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
        category: criterion.category?.trim() || undefined,
      })),
      categoryColors: nextCategoryColors,
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={startNew}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-primary-500 transition-colors"
                >
                  <Plus size={16} />
                  <span className="text-sm">Créer un barème</span>
                </button>

                <button
                  onClick={handleImportBaremeJson}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-light text-gray-300 hover:text-white transition-colors"
                >
                  <Upload size={14} />
                  <span className="text-sm">Importer JSON</span>
                </button>
              </div>

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
                          {categories.map((category, index) => {
                            const color = sanitizeColor(
                              bareme.categoryColors?.[category],
                              CATEGORY_COLOR_PRESETS[index % CATEGORY_COLOR_PRESETS.length],
                            )
                            return (
                              <span
                                key={`${bareme.id}-${category}`}
                                className="text-[10px] px-2 py-0.5 rounded border"
                                style={{
                                  borderColor: withAlpha(color, 0.45),
                                  backgroundColor: withAlpha(color, 0.18),
                                  color,
                                }}
                              >
                                {category}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(bareme)}
                          className="px-3 py-1 text-xs rounded bg-surface-light text-gray-300 hover:text-white transition-colors"
                        >
                          {bareme.isOfficial ? 'Voir' : 'Modifier'}
                        </button>
                        <button
                          onClick={() => handleExportBaremeJson(bareme)}
                          className="p-1 rounded text-gray-400 hover:text-white hover:bg-surface-light transition-colors"
                          title="Exporter JSON"
                        >
                          <Download size={14} />
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
                {Array.from(categoryStats.entries()).map(([category, stat], index) => {
                  const color = category === 'Général'
                    ? '#94a3b8'
                    : sanitizeColor(categoryColors[category], CATEGORY_COLOR_PRESETS[index % CATEGORY_COLOR_PRESETS.length])
                  return (
                    <span
                      key={category}
                      className="text-[11px] px-2 py-1 rounded border"
                      style={{
                        borderColor: withAlpha(color, 0.45),
                        backgroundColor: withAlpha(color, 0.18),
                        color,
                      }}
                    >
                      {category}: {stat.count} crit. • /{stat.total}
                    </span>
                  )
                })}
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
                  const rawCategory = criterion.category?.trim() || ''
                  const color = rawCategory ? getCategoryColor(rawCategory) : '#64748b'

                  return (
                    <div
                      key={criterion.id}
                      className="rounded-lg border bg-surface-dark/60 p-3"
                      style={{ borderColor: withAlpha(color, 0.35) }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                        <div className="md:col-span-3">
                          <label className="block text-[10px] text-gray-500 mb-0.5">Catégorie</label>
                          <div className="flex items-center gap-2">
                            <input
                              value={rawCategory}
                              onChange={(e) => updateCategoryForCriterion(index, e.target.value)}
                              onBlur={(e) => commitCategoryColor(e.target.value)}
                              placeholder="Général"
                              className="w-full px-2 py-1.5 rounded border text-xs text-white bg-surface focus:outline-none focus:border-primary-500"
                              style={{ borderColor: withAlpha(color, 0.45) }}
                              disabled={readOnly}
                            />
                            <input
                              type="color"
                              value={sanitizeColor(color)}
                              onChange={(e) => {
                                if (!rawCategory) return
                                setCategoryColors((prev) => ({
                                  ...prev,
                                  [rawCategory]: e.target.value,
                                }))
                              }}
                              disabled={readOnly || !rawCategory}
                              title={rawCategory ? `Couleur de ${rawCategory}` : 'Saisis une catégorie d’abord'}
                              className="h-8 w-10 p-0 bg-transparent border border-gray-700 rounded cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                          </div>
                          {rawCategory && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {CATEGORY_COLOR_PRESETS.map((preset) => (
                                <button
                                  key={`${criterion.id}-${preset}`}
                                  type="button"
                                  onClick={() => {
                                    const categoryKey = rawCategory.trim()
                                    if (!categoryKey) return
                                    setCategoryColors((prev) => ({
                                      ...prev,
                                      [categoryKey]: preset,
                                    }))
                                  }}
                                  disabled={readOnly}
                                  className={`w-4 h-4 rounded border transition-opacity ${
                                    sanitizeColor(color) === sanitizeColor(preset)
                                      ? 'border-white'
                                      : 'border-gray-700'
                                  }`}
                                  style={{ backgroundColor: preset }}
                                  title={`Appliquer ${preset}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="md:col-span-4">
                          <label className="block text-[10px] text-gray-500 mb-0.5">Nom du critère</label>
                          <input
                            value={criterion.name}
                            onChange={(e) => updateCriterion(index, { name: e.target.value })}
                            placeholder="Rythme / Synchro"
                            className="w-full px-2 py-1.5 bg-surface border border-gray-700 rounded text-xs text-white focus:border-primary-500 focus:outline-none"
                            disabled={readOnly}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[10px] text-gray-500 mb-0.5">Noté sur</label>
                          <input
                            type="number"
                            value={criterion.max ?? 10}
                            onChange={(e) => updateCriterion(index, { max: Number(e.target.value) })}
                            min={1}
                            step={1}
                            className="w-full px-2 py-1.5 bg-surface border border-gray-700 rounded text-xs text-white text-center focus:border-primary-500 focus:outline-none"
                            disabled={readOnly}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[10px] text-gray-500 mb-0.5">Pas</label>
                          <input
                            type="number"
                            value={criterion.step ?? 0.5}
                            onChange={(e) => updateCriterion(index, { step: Number(e.target.value) })}
                            step={0.1}
                            className="w-full px-2 py-1.5 bg-surface border border-gray-700 rounded text-xs text-white text-center focus:border-primary-500 focus:outline-none"
                            disabled={readOnly}
                          />
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

                      <div className="grid grid-cols-1 gap-2 mt-2">
                        <div>
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
