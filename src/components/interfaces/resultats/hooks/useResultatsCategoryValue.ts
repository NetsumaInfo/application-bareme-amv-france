import { useCallback } from 'react'
import {
  computeNoteTotalForBareme,
} from '@/components/interfaces/resultats/scoreDistribution'
import type { Bareme } from '@/types/bareme'
import type { Note } from '@/types/notation'
import type {
  ImportedJudgeCriterionScore,
  ImportedJudgeData,
  ImportedJudgeNote,
} from '@/types/project'
import type { CategoryGroup, JudgeSource } from '@/utils/results'

interface UseResultatsCategoryValueParams {
  currentBareme: Bareme | null
  notes: Record<string, Note>
  categoryGroups: CategoryGroup[]
  importedJudges: ImportedJudgeData[]
  judges: JudgeSource[]
  updateCriterion: (clipId: string, criterionId: string, value: number | string | boolean) => void
  markDirty: () => void
  setImportedJudges: (judges: ImportedJudgeData[]) => void
}

function getGroupStep(criteria: Array<{ step?: number | null }>): number {
  const steps = criteria
    .map((criterion) => Number(criterion.step))
    .filter((value) => Number.isFinite(value) && value > 0)
  if (steps.length === 0) return 0.5
  return Math.min(...steps)
}

function roundToStep(value: number, step: number): number {
  if (!Number.isFinite(step) || step <= 0) return value
  return Math.round(value / step) * step
}

function distributeCategoryScore(
  criteria: Bareme['criteria'],
  note: Pick<ImportedJudgeNote, 'scores'> | Note | undefined,
  targetRaw: number,
): Record<string, number> {
  const totalMax = criteria.reduce((sum, criterion) => sum + Number(criterion.max ?? 10), 0)
  if (totalMax <= 0) {
    return criteria.reduce<Record<string, number>>((acc, criterion) => {
      acc[criterion.id] = 0
      return acc
    }, {})
  }

  const target = Math.max(0, Math.min(totalMax, Number.isFinite(targetRaw) ? targetRaw : 0))
  const step = getGroupStep(criteria)

  const currentValues = criteria.map((criterion) => {
    const score = note?.scores?.[criterion.id]
    const value = Number(score?.value ?? 0)
    return Number.isFinite(value) ? value : 0
  })
  const currentTotal = currentValues.reduce((sum, value) => sum + value, 0)

  const values = criteria.map((criterion, index) => {
    const max = Number(criterion.max ?? 10)
    if (max <= 0) return 0

    if (currentTotal > 0) {
      return Math.min(max, (currentValues[index] / currentTotal) * target)
    }

    return Math.min(max, (max / totalMax) * target)
  })

  const rounded = values.map((value, index) => {
    const max = Number(criteria[index].max ?? 10)
    return Math.max(0, Math.min(max, roundToStep(value, step)))
  })

  let delta = target - rounded.reduce((sum, value) => sum + value, 0)
  const minStep = step > 0 ? step : 0.5
  let guard = 0
  while (Math.abs(delta) >= minStep / 2 && guard < 1200) {
    let adjusted = false
    const direction = delta > 0 ? 1 : -1

    for (let index = 0; index < criteria.length; index += 1) {
      const max = Number(criteria[index].max ?? 10)
      const nextValue = rounded[index] + direction * minStep
      if (nextValue < 0 || nextValue > max) continue
      rounded[index] = roundToStep(nextValue, minStep)
      delta -= direction * minStep
      adjusted = true
      if (Math.abs(delta) < minStep / 2) break
    }

    if (!adjusted) break
    guard += 1
  }

  return criteria.reduce<Record<string, number>>((acc, criterion, index) => {
    acc[criterion.id] = Math.round(rounded[index] * 1000) / 1000
    return acc
  }, {})
}

function resolveImportedJudgeIndex(judgeKey: string): number | null {
  const parsed = Number(judgeKey.replace('imported-', ''))
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return parsed
}

export function useResultatsCategoryValue({
  currentBareme,
  notes,
  categoryGroups,
  importedJudges,
  judges,
  updateCriterion,
  markDirty,
  setImportedJudges,
}: UseResultatsCategoryValueParams) {
  const applyCategoryValue = useCallback((
    clipId: string,
    category: string,
    judgeKey: string,
    valueRaw: number,
  ) => {
    if (!currentBareme) return

    const group = categoryGroups.find((item) => item.category === category)
    if (!group) return

    const judge = judges.find((item) => item.key === judgeKey)
    if (!judge) return

    if (judge.isCurrentJudge) {
      const note = notes[clipId]
      const nextByCriterion = distributeCategoryScore(group.criteria, note, valueRaw)
      for (const criterion of group.criteria) {
        updateCriterion(clipId, criterion.id, nextByCriterion[criterion.id] ?? 0)
      }
      markDirty()
      return
    }

    const importedIndex = resolveImportedJudgeIndex(judge.key)
    if (importedIndex === null || importedIndex >= importedJudges.length) return

    const nextImported = importedJudges.map((importedJudge, idx) => {
      if (idx !== importedIndex) return importedJudge

      const previousNote = importedJudge.notes[clipId] ?? { scores: {} }
      const nextByCriterion = distributeCategoryScore(group.criteria, previousNote, valueRaw)

      const nextScores: Record<string, ImportedJudgeCriterionScore> = { ...previousNote.scores }
      for (const criterion of group.criteria) {
        const value = nextByCriterion[criterion.id] ?? 0
        nextScores[criterion.id] = {
          value,
          isValid: true,
        }
      }

      const nextNote: ImportedJudgeNote = {
        ...previousNote,
        scores: nextScores,
      }
      nextNote.finalScore = computeNoteTotalForBareme(currentBareme.criteria, nextNote)

      return {
        ...importedJudge,
        notes: {
          ...importedJudge.notes,
          [clipId]: nextNote,
        },
      }
    })

    setImportedJudges(nextImported)
  }, [categoryGroups, currentBareme, importedJudges, judges, markDirty, notes, setImportedJudges, updateCriterion])

  return {
    applyCategoryValue,
  }
}
