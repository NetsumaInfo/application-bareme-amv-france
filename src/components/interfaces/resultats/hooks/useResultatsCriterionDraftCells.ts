import { useCallback, useState } from 'react'

interface UseResultatsCriterionDraftCellsOptions {
  applyCriterionValue: (clipId: string, criterionId: string, judgeKey: string, valueRaw: number) => void
}

export function useResultatsCriterionDraftCells({
  applyCriterionValue,
}: UseResultatsCriterionDraftCellsOptions) {
  const [criterionDraftCells, setCriterionDraftCells] = useState<Record<string, string>>({})

  const getCriterionCellKey = useCallback((clipId: string, criterionId: string, judgeKey: string) => (
    `${clipId}|${criterionId}|${judgeKey}`
  ), [])

  const commitCriterionDraftCell = useCallback((clipId: string, criterionId: string, judgeKey: string) => {
    const key = getCriterionCellKey(clipId, criterionId, judgeKey)
    const raw = criterionDraftCells[key]
    if (raw === undefined) return
    const numeric = Number(raw.replace(',', '.'))
    if (Number.isFinite(numeric)) {
      applyCriterionValue(clipId, criterionId, judgeKey, numeric)
    }
    setCriterionDraftCells((previous) => {
      const next = { ...previous }
      delete next[key]
      return next
    })
  }, [applyCriterionValue, criterionDraftCells, getCriterionCellKey])

  const setCriterionDraftCell = useCallback((key: string, value: string) => {
    setCriterionDraftCells((previous) => ({ ...previous, [key]: value }))
  }, [])

  const clearCriterionDraftCell = useCallback((key: string) => {
    setCriterionDraftCells((previous) => {
      const next = { ...previous }
      delete next[key]
      return next
    })
  }, [])

  return {
    criterionDraftCells,
    getCriterionCellKey,
    commitCriterionDraftCell,
    setCriterionDraftCell,
    clearCriterionDraftCell,
  }
}

