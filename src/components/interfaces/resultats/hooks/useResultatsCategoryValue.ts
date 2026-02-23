import { useCallback } from 'react'
import {
  computeNoteTotalForBareme,
  distributeCategoryScore,
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
