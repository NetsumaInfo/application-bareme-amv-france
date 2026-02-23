import { useCallback, useMemo, useState } from 'react'
import { CATEGORY_COLOR_PRESETS, sanitizeColor } from '@/utils/colors'
import { getCriterionCategoryLabel, getCriterionMax, normalizeCriterion } from '@/components/scoring/baremeEditorUtils'
import {
  addCriterionItem,
  applyGlobalStepValue,
  buildBaremeFromForm,
  buildCategoryColorsForCriteria,
  commitCategoryColorValue,
  createInitialCriteria,
  moveCategoryGroup,
  moveCriterionItem,
  removeCriterionItem,
  setCategoryColorValue,
  updateCriterionItem,
  validateCriteriaBeforeSave,
} from '@/components/scoring/bareme/baremeEditorStateUtils'
import type { Bareme, Criterion } from '@/types/bareme'

interface UseBaremeEditorFormParams {
  addBareme: (bareme: Bareme) => void
}

export function useBaremeEditorForm({ addBareme }: UseBaremeEditorFormParams) {
  const [editingBareme, setEditingBareme] = useState<Bareme | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [criteria, setCriteria] = useState<Criterion[]>(createInitialCriteria())
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({})
  const [globalStep, setGlobalStep] = useState(0.5)
  const [hideTotalsUntilAllScored, setHideTotalsUntilAllScored] = useState(false)
  const [error, setError] = useState('')

  const readOnly = editingBareme?.isOfficial === true

  const categoryOrder = useMemo(
    () => Array.from(new Set(criteria.map((criterion) => getCriterionCategoryLabel(criterion)))),
    [criteria],
  )

  const categoryStats = useMemo(() => {
    const stats = new Map<string, { count: number; total: number }>()
    for (const criterion of criteria) {
      if (!criterion.name.trim()) continue
      const key = getCriterionCategoryLabel(criterion)
      const current = stats.get(key) ?? { count: 0, total: 0 }
      stats.set(key, {
        count: current.count + 1,
        total: Math.round((current.total + getCriterionMax(criterion)) * 100) / 100,
      })
    }
    return stats
  }, [criteria])

  const getCategoryColor = useCallback(
    (category: string) => {
      if (!category || category === 'Général') return '#94a3b8'
      const fromMap = categoryColors[category]
      if (fromMap) return sanitizeColor(fromMap)
      const idx = categoryOrder.indexOf(category)
      return CATEGORY_COLOR_PRESETS[idx >= 0 ? idx % CATEGORY_COLOR_PRESETS.length : 0]
    },
    [categoryColors, categoryOrder],
  )

  const resetForm = useCallback(() => {
    setEditingBareme(null)
    setName('')
    setDescription('')
    setCriteria(createInitialCriteria())
    setCategoryColors({})
    setGlobalStep(0.5)
    setHideTotalsUntilAllScored(false)
    setError('')
  }, [])

  const startEdit = useCallback((bareme: Bareme) => {
    setEditingBareme(bareme)
    setName(bareme.name)
    setDescription(bareme.description || '')
    setCriteria(bareme.criteria.map((criterion) => normalizeCriterion(criterion)))
    setCategoryColors(
      Object.fromEntries(
        Object.entries(bareme.categoryColors || {}).map(([key, value]) => [key, sanitizeColor(value)]),
      ),
    )
    setGlobalStep(
      bareme.criteria.length > 0 && Number.isFinite(bareme.criteria[0].step)
        ? Number(bareme.criteria[0].step)
        : 0.5,
    )
    setHideTotalsUntilAllScored(Boolean(bareme.hideTotalsUntilAllScored))
    setError('')
  }, [])

  const addCriterion = useCallback(() => {
    setCriteria((prev) => addCriterionItem(prev))
  }, [])

  const removeCriterion = useCallback((index: number) => {
    setCriteria((prev) => removeCriterionItem(prev, index))
  }, [])

  const moveCriterion = useCallback((index: number, direction: 'up' | 'down') => {
    setCriteria((prev) => moveCriterionItem(prev, index, direction))
  }, [])

  const moveCategory = useCallback((category: string, direction: 'up' | 'down') => {
    setCriteria((prev) => moveCategoryGroup(prev, category, direction))
  }, [])

  const updateCriterion = useCallback((index: number, updates: Partial<Criterion>) => {
    setCriteria((prev) => updateCriterionItem(prev, index, updates))
  }, [])

  const updateCategoryForCriterion = useCallback((index: number, rawCategory: string) => {
    setCriteria((prev) => updateCriterionItem(prev, index, { category: rawCategory }))
  }, [])

  const commitCategoryColor = useCallback((rawCategory: string) => {
    setCategoryColors((prev) => commitCategoryColorValue(prev, rawCategory))
  }, [])

  const setCategoryColor = useCallback((category: string, color: string) => {
    setCategoryColors((prev) => setCategoryColorValue(prev, category, color))
  }, [])

  const applyGlobalStep = useCallback(() => {
    const nextStep = Number(globalStep)
    if (!Number.isFinite(nextStep) || nextStep <= 0) {
      setError('Pas global invalide.')
      return
    }
    setError('')
    setCriteria((prev) => applyGlobalStepValue(prev, nextStep))
  }, [globalStep])

  const saveBareme = useCallback((): boolean => {
    setError('')

    if (!name.trim()) {
      setError('Le nom du bareme est requis.')
      return false
    }

    const { normalized, error: validationError } = validateCriteriaBeforeSave(criteria)
    if (validationError) {
      setError(validationError)
      return false
    }

    const nextCategoryColors = buildCategoryColorsForCriteria(
      normalized,
      categoryColors,
      getCategoryColor,
    )

    const bareme = buildBaremeFromForm({
      editingBareme,
      name,
      description,
      hideTotalsUntilAllScored,
      normalizedCriteria: normalized,
      categoryColors: nextCategoryColors,
    })

    addBareme(bareme)
    return true
  }, [
    addBareme,
    categoryColors,
    criteria,
    description,
    editingBareme,
    getCategoryColor,
    hideTotalsUntilAllScored,
    name,
  ])

  return {
    editingBareme,
    readOnly,
    name,
    description,
    criteria,
    categoryStats,
    categoryOrder,
    categoryColors,
    globalStep,
    hideTotalsUntilAllScored,
    error,
    getCategoryColor,
    startEdit,
    setName,
    setDescription,
    setGlobalStep,
    setHideTotalsUntilAllScored,
    moveCategory,
    moveCriterion,
    removeCriterion,
    updateCriterion,
    updateCategoryForCriterion,
    commitCategoryColor,
    setCategoryColor,
    applyGlobalStep,
    addCriterion,
    saveBareme,
    resetForm,
  }
}
