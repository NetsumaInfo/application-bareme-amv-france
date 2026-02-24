import { useCallback } from 'react'
import { parseNumericInputValue } from '@/utils/numberInput'

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
      const parsedValue = parseNumericInputValue(value)
      if (parsedValue === null) return
      updateCriterion(clipId, criterionId, parsedValue)
      markDirty()
    },
    [markDirty, updateCriterion],
  )
}
