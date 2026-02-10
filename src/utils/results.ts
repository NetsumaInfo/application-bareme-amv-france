import type { Bareme, Criterion } from '@/types/bareme'
import type { ImportedJudgeData } from '@/types/project'
import type { Note } from '@/types/notation'
import { CATEGORY_COLOR_PRESETS, sanitizeColor } from '@/utils/colors'

export interface CategoryGroup {
  category: string
  criteria: Criterion[]
  totalMax: number
  color: string
}

export interface NoteScoreLike {
  value: number | string | boolean
  isValid?: boolean
}

export interface NoteLike {
  scores: Record<string, NoteScoreLike>
  finalScore?: number
}

export interface JudgeSource {
  key: string
  judgeName: string
  notes: Record<string, NoteLike>
  isCurrentJudge: boolean
}

export function buildCategoryGroups(bareme: Bareme): CategoryGroup[] {
  const groups: CategoryGroup[] = []
  const indexByName = new Map<string, number>()

  for (const criterion of bareme.criteria) {
    const category = criterion.category?.trim() || 'Général'
    const existingIndex = indexByName.get(category)

    if (existingIndex === undefined) {
      const idx = groups.length
      const fallback = CATEGORY_COLOR_PRESETS[idx % CATEGORY_COLOR_PRESETS.length]
      groups.push({
        category,
        criteria: [criterion],
        totalMax: Number(criterion.max ?? 10),
        color: sanitizeColor(bareme.categoryColors?.[category], fallback),
      })
      indexByName.set(category, idx)
      continue
    }

    groups[existingIndex].criteria.push(criterion)
    groups[existingIndex].totalMax += Number(criterion.max ?? 10)
  }

  return groups
}

export function getCriterionNumericScore(
  note: NoteLike | undefined,
  criterion: Criterion,
): number {
  if (!note) return 0
  const score = note.scores[criterion.id]
  if (!score) return 0
  if (score.isValid === false) return 0

  if (typeof score.value === 'boolean') {
    return score.value ? Number(criterion.max ?? 1) : 0
  }

  const value = Number(score.value)
  if (!Number.isFinite(value)) return 0

  const min = Number.isFinite(criterion.min) ? Number(criterion.min) : 0
  const max = Number.isFinite(criterion.max) ? Number(criterion.max) : value
  return Math.min(Math.max(value, min), max)
}

export function getCategoryScore(
  note: NoteLike | undefined,
  criteria: Criterion[],
): number {
  const total = criteria.reduce(
    (sum, criterion) => sum + getCriterionNumericScore(note, criterion),
    0,
  )
  return Math.round(total * 100) / 100
}

export function getNoteTotal(note: NoteLike | undefined, bareme: Bareme): number {
  const total = bareme.criteria.reduce(
    (sum, criterion) => sum + getCriterionNumericScore(note, criterion),
    0,
  )
  return Math.round(total * 100) / 100
}

export function buildJudgeSources(
  judgeName: string | undefined,
  currentNotes: Record<string, Note>,
  importedJudges: ImportedJudgeData[],
): JudgeSource[] {
  const currentJudge: JudgeSource = {
    key: 'current',
    judgeName: judgeName?.trim() || 'Juge courant',
    notes: currentNotes,
    isCurrentJudge: true,
  }

  const imported: JudgeSource[] = importedJudges.map((judge, index) => ({
    key: `imported-${index}`,
    judgeName: judge.judgeName,
    notes: judge.notes,
    isCurrentJudge: false,
  }))

  return [currentJudge, ...imported]
}
