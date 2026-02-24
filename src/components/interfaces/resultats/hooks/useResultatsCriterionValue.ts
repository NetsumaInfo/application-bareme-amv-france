import { useCallback } from 'react'
import { computeNoteTotalForBareme } from '@/components/interfaces/resultats/scoreDistribution'
import type { Bareme } from '@/types/bareme'
import type {
  ImportedJudgeCriterionScore,
  ImportedJudgeData,
  ImportedJudgeNote,
} from '@/types/project'
import type { JudgeSource } from '@/utils/results'

interface UseResultatsCriterionValueParams {
  currentBareme: Bareme | null
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

export function useResultatsCriterionValue({
  currentBareme,
  importedJudges,
  judges,
  updateCriterion,
  markDirty,
  setImportedJudges,
}: UseResultatsCriterionValueParams) {
  const applyCriterionValue = useCallback((
    clipId: string,
    criterionId: string,
    judgeKey: string,
    valueRaw: number,
  ) => {
    if (!currentBareme) return
    const criterion = currentBareme.criteria.find((item) => item.id === criterionId)
    if (!criterion) return
    const judge = judges.find((item) => item.key === judgeKey)
    if (!judge) return

    const min = Number.isFinite(criterion.min) ? Number(criterion.min) : 0
    const max = Number.isFinite(criterion.max) ? Number(criterion.max) : valueRaw
    const clamped = Math.max(min, Math.min(max, valueRaw))

    if (judge.isCurrentJudge) {
      updateCriterion(clipId, criterion.id, clamped)
      markDirty()
      return
    }

    const importedIndex = resolveImportedJudgeIndex(judge.key)
    if (importedIndex === null || importedIndex >= importedJudges.length) return

    const nextImported = importedJudges.map((importedJudge, idx) => {
      if (idx !== importedIndex) return importedJudge

      const previousNote = importedJudge.notes[clipId] ?? { scores: {} }
      const nextScores: Record<string, ImportedJudgeCriterionScore> = {
        ...previousNote.scores,
        [criterion.id]: {
          value: clamped,
          isValid: true,
        },
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
  }, [currentBareme, importedJudges, judges, markDirty, setImportedJudges, updateCriterion])

  return {
    applyCriterionValue,
  }
}
