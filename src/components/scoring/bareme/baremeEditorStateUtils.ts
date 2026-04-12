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

export function addCriterionItem(criteria: Criterion[], criterion: Criterion = emptyCriterion()) {
  return [...criteria, criterion]
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

  const visibleOrder = Array.from(
    new Set(
      criteria
        .filter((criterion) => criterion.name.trim())
        .map((criterion) => getCriterionCategoryLabel(criterion)),
    ),
  )
  const hiddenOrder = Array.from(grouped.keys()).filter((key) => !visibleOrder.includes(key))

  const index = visibleOrder.indexOf(category)
  if (index < 0) return criteria
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= visibleOrder.length) return criteria

  const nextOrder = [...visibleOrder]
  ;[nextOrder[index], nextOrder[target]] = [nextOrder[target], nextOrder[index]]
  return [...nextOrder, ...hiddenOrder].flatMap((key) => grouped.get(key) ?? [])
}

export function updateCriterionItem(criteria: Criterion[], index: number, updates: Partial<Criterion>) {
  return criteria.map((criterion, criterionIndex) =>
    criterionIndex === index ? normalizeCriterion({ ...criterion, ...updates }) : criterion,
  )
}

export function updateCriterionCategoryItem(criteria: Criterion[], index: number, rawCategory: string) {
  const criterion = criteria[index]
  if (!criterion) return criteria

  const nextCriterion = normalizeCriterion({
    ...criterion,
    category: rawCategory,
  })
  const nextCategory = nextCriterion.category?.trim() || ''
  const currentCategory = criterion.category?.trim() || ''

  if (!nextCategory || nextCategory === currentCategory) {
    return criteria.map((item, itemIndex) => (itemIndex === index ? nextCriterion : item))
  }

  const matchesTargetCategory = criteria.some(
    (item, itemIndex) =>
      itemIndex !== index &&
      (item.category?.trim() || '') === nextCategory,
  )

  if (!matchesTargetCategory) {
    return criteria.map((item, itemIndex) => (itemIndex === index ? nextCriterion : item))
  }

  const next = [...criteria]
  next.splice(index, 1)

  let insertIndex = next.length
  for (let itemIndex = 0; itemIndex < next.length; itemIndex += 1) {
    if ((next[itemIndex].category?.trim() || '') === nextCategory) {
      insertIndex = itemIndex + 1
    }
  }

  next.splice(insertIndex, 0, nextCriterion)
  return next
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
