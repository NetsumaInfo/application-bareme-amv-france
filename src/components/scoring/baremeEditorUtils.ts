import { generateId } from '@/utils/formatters'
import { sanitizeColor } from '@/utils/colors'
import type { Bareme, Criterion } from '@/types/bareme'

export function emptyCriterion(): Criterion {
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

export function normalizeCriterion(raw: Criterion): Criterion {
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

export function getCriterionMax(criterion: Criterion): number {
  return Number.isFinite(criterion.max) ? Number(criterion.max) : 10
}

export function getTotalPoints(criteria: Criterion[]): number {
  return Math.round(
    criteria
      .filter((criterion) => criterion.name.trim())
      .reduce((sum, criterion) => sum + getCriterionMax(criterion), 0) * 100,
  ) / 100
}

export function getCriterionCategoryLabel(criterion: Criterion): string {
  const category = criterion.category?.trim()
  return category || 'Général'
}

export function normalizeImportedBaremes(data: unknown): Bareme[] {
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
      hideTotalsUntilAllScored:
        typeof row.hideTotalsUntilAllScored === 'boolean'
          ? row.hideTotalsUntilAllScored
          : typeof row.hide_totals_until_all_scored === 'boolean'
            ? row.hide_totals_until_all_scored
            : false,
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
