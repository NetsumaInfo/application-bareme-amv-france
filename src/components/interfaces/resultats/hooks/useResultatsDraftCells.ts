import { useCallback, useState } from 'react'

interface UseResultatsDraftCellsOptions {
  applyCategoryValue: (clipId: string, category: string, judgeKey: string, valueRaw: number) => void
}

export function useResultatsDraftCells({ applyCategoryValue }: UseResultatsDraftCellsOptions) {
  const [draftCells, setDraftCells] = useState<Record<string, string>>({})

  const getCellKey = useCallback((clipId: string, category: string, judgeKey: string) => (
    `${clipId}|${category}|${judgeKey}`
  ), [])

  const commitDraftCell = useCallback((clipId: string, category: string, judgeKey: string) => {
    const key = getCellKey(clipId, category, judgeKey)
    const raw = draftCells[key]
    if (raw === undefined) return
    const numeric = Number(raw.replace(',', '.'))
    if (Number.isFinite(numeric)) {
      applyCategoryValue(clipId, category, judgeKey, numeric)
    }
    setDraftCells((previous) => {
      const next = { ...previous }
      delete next[key]
      return next
    })
  }, [applyCategoryValue, draftCells, getCellKey])

  const setDraftCell = useCallback((key: string, value: string) => {
    setDraftCells((previous) => ({ ...previous, [key]: value }))
  }, [])

  const clearDraftCell = useCallback((key: string) => {
    setDraftCells((previous) => {
      const next = { ...previous }
      delete next[key]
      return next
    })
  }, [])

  return {
    draftCells,
    getCellKey,
    commitDraftCell,
    setDraftCell,
    clearDraftCell,
  }
}
