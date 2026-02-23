import { useCallback } from 'react'

interface UseSpreadsheetCriterionChangeOptions {
  markDirty: () => void
  updateCriterion: (clipId: string, criterionId: string, value: number | string | boolean) => void
}

export function useSpreadsheetCriterionChange({
  markDirty,
  updateCriterion,
}: UseSpreadsheetCriterionChangeOptions) {
  return useCallback(
    (clipId: string, criterionId: string, value: string) => {
      const parsedValue = value === '' ? '' : Number(value)
      if (typeof parsedValue === 'number' && Number.isNaN(parsedValue)) return
      updateCriterion(clipId, criterionId, parsedValue as number)
      markDirty()
    },
    [markDirty, updateCriterion],
  )
}
