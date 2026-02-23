import { generateId } from '@/utils/formatters'
import { CATEGORY_COLOR_PRESETS, sanitizeColor } from '@/utils/colors'
import {
  emptyCriterion,
  getCriterionCategoryLabel,
  getTotalPoints,
  normalizeCriterion,
} from '@/components/scoring/baremeEditorUtils'
import type { Bareme, Criterion } from '@/types/bareme'

export function createInitialCriteria() {
  return [emptyCriterion()]
}

export function duplicateBareme(bareme: Bareme): Bareme {
  const now = new Date().toISOString()
  return {
    ...bareme,
    id: `custom-${generateId()}`,
    name: `${bareme.name} (copie)`,
    isOfficial: false,
    createdAt: now,
    updatedAt: now,
    criteria: bareme.criteria.map((criterion) => ({ ...criterion, id: generateId() })),
    categoryColors: { ...(bareme.categoryColors || {}) },
  }
}

export function addCriterionItem(criteria: Criterion[]) {
  return [...criteria, emptyCriterion()]
}

export function removeCriterionItem(criteria: Criterion[], index: number) {
  if (criteria.length <= 1) return criteria
  return criteria.filter((_, criterionIndex) => criterionIndex !== index)
}

export function moveCriterionItem(criteria: Criterion[], index: number, direction: 'up' | 'down') {
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= criteria.length) return criteria
  const next = [...criteria]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  return next
}

export function moveCategoryGroup(criteria: Criterion[], category: string, direction: 'up' | 'down') {
  const grouped = new Map<string, Criterion[]>()
  for (const criterion of criteria) {
    const key = getCriterionCategoryLabel(criterion)
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)?.push(criterion)
  }

  const order = Array.from(grouped.keys())
  const index = order.indexOf(category)
  if (index < 0) return criteria
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= order.length) return criteria

  const nextOrder = [...order]
  ;[nextOrder[index], nextOrder[target]] = [nextOrder[target], nextOrder[index]]
  return nextOrder.flatMap((key) => grouped.get(key) ?? [])
}

export function updateCriterionItem(criteria: Criterion[], index: number, updates: Partial<Criterion>) {
  return criteria.map((criterion, criterionIndex) =>
    criterionIndex === index ? normalizeCriterion({ ...criterion, ...updates }) : criterion,
  )
}

export function commitCategoryColorValue(
  categoryColors: Record<string, string>,
  rawCategory: string,
) {
  const category = rawCategory.trim()
  if (!category) return categoryColors
  if (categoryColors[category]) return categoryColors
  const color = CATEGORY_COLOR_PRESETS[Object.keys(categoryColors).length % CATEGORY_COLOR_PRESETS.length]
  return { ...categoryColors, [category]: color }
}

export function setCategoryColorValue(
  categoryColors: Record<string, string>,
  category: string,
  color: string,
) {
  const key = category.trim()
  if (!key) return categoryColors
  return { ...categoryColors, [key]: color }
}

export function applyGlobalStepValue(criteria: Criterion[], globalStep: number) {
  return criteria.map((criterion) => normalizeCriterion({ ...criterion, step: globalStep }))
}

export function validateCriteriaBeforeSave(criteria: Criterion[]) {
  const normalized = criteria
    .map((criterion) => normalizeCriterion(criterion))
    .filter((criterion) => criterion.name.trim())

  if (normalized.length === 0) {
    return { normalized, error: 'Ajoute au moins un critere.' }
  }

  for (const criterion of normalized) {
    if ((criterion.step ?? 0) <= 0) {
      return { normalized, error: `Pas invalide pour "${criterion.name}".` }
    }
  }

  return { normalized, error: null as string | null }
}

export function buildCategoryColorsForCriteria(
  normalizedCriteria: Criterion[],
  categoryColors: Record<string, string>,
  getCategoryColor: (category: string) => string,
) {
  const usedCategories = new Set(
    normalizedCriteria
      .map((criterion) => criterion.category?.trim())
      .filter((category): category is string => Boolean(category)),
  )

  const nextCategoryColors: Record<string, string> = {}
  for (const category of usedCategories) {
    nextCategoryColors[category] = sanitizeColor(categoryColors[category], getCategoryColor(category))
  }
  return nextCategoryColors
}

export function buildBaremeFromForm({
  editingBareme,
  name,
  description,
  hideTotalsUntilAllScored,
  normalizedCriteria,
  categoryColors,
}: {
  editingBareme: Bareme | null
  name: string
  description: string
  hideTotalsUntilAllScored: boolean
  normalizedCriteria: Criterion[]
  categoryColors: Record<string, string>
}): Bareme {
  const now = new Date().toISOString()
  return {
    id: editingBareme?.id || `custom-${generateId()}`,
    name: name.trim(),
    description: description.trim() || undefined,
    isOfficial: false,
    hideTotalsUntilAllScored,
    criteria: normalizedCriteria.map((criterion) => ({
      ...criterion,
      name: criterion.name.trim(),
      category: criterion.category?.trim() || undefined,
    })),
    categoryColors,
    totalPoints: getTotalPoints(normalizedCriteria),
    createdAt: editingBareme?.createdAt || now,
    updatedAt: now,
  }
}
