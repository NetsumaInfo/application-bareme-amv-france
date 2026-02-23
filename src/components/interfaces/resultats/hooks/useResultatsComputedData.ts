import { useCallback, useMemo } from 'react'
import {
  buildCategoryGroups,
  buildJudgeSources,
  getCategoryScore,
  getNoteTotal,
  hasAnyCriterionScore,
  type NoteLike,
} from '@/utils/results'
import type { Bareme } from '@/types/bareme'
import type { Clip, ImportedJudgeData } from '@/types/project'
import type { Note } from '@/types/notation'
import type { ResultatsRow } from '@/components/interfaces/resultats/types'

type SortMode = 'folder' | 'score'

type UseResultatsComputedDataParams = {
  currentBareme: Bareme | null
  currentJudgeName?: string
  notes: Record<string, Note>
  importedJudges: ImportedJudgeData[]
  clips: Clip[]
  sortMode: SortMode
  canSortByScore: boolean
}

export function useResultatsComputedData({
  currentBareme,
  currentJudgeName,
  notes,
  importedJudges,
  clips,
  sortMode,
  canSortByScore,
}: UseResultatsComputedDataParams) {
  const effectiveSortMode: SortMode =
    sortMode === 'score' && !canSortByScore ? 'folder' : sortMode

  const categoryGroups = useMemo(
    () => (currentBareme ? buildCategoryGroups(currentBareme) : []),
    [currentBareme],
  )

  const judges = useMemo(
    () => buildJudgeSources(currentJudgeName, notes, importedJudges),
    [currentJudgeName, notes, importedJudges],
  )

  const currentJudge = judges.find((judge) => judge.isCurrentJudge)

  const getClipAverageTotal = useCallback(
    (clipId: string) => {
      if (!currentBareme) return 0
      const totals = judges
        .map((judge) => {
          const note = judge.notes[clipId] as NoteLike | undefined
          if (!hasAnyCriterionScore(note, currentBareme.criteria)) return null
          return getNoteTotal(note, currentBareme)
        })
        .filter((value): value is number => value !== null)
      return totals.length > 0
        ? totals.reduce((sum, v) => sum + v, 0) / totals.length
        : 0
    },
    [currentBareme, judges],
  )

  const sortedClips = useMemo(() => {
    const base = [...clips]
    const originalIndex = new Map(clips.map((clip, index) => [clip.id, index]))

    if (effectiveSortMode === 'score' && canSortByScore) {
      base.sort((a, b) => {
        const scoreA = getClipAverageTotal(a.id)
        const scoreB = getClipAverageTotal(b.id)
        if (scoreB !== scoreA) return scoreB - scoreA
        return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0)
      })
      return base
    }

    base.sort((a, b) => {
      const orderA = Number.isFinite(a.order)
        ? a.order
        : (originalIndex.get(a.id) ?? 0)
      const orderB = Number.isFinite(b.order)
        ? b.order
        : (originalIndex.get(b.id) ?? 0)
      if (orderA !== orderB) return orderA - orderB
      return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0)
    })
    return base
  }, [clips, effectiveSortMode, getClipAverageTotal, canSortByScore])

  const rows = useMemo<ResultatsRow[]>(() => {
    if (!currentBareme) return []

    return sortedClips.map((clip) => {
      const categoryJudgeScores: Record<string, number[]> = {}

      for (const group of categoryGroups) {
        categoryJudgeScores[group.category] = judges.map((judge) =>
          getCategoryScore(judge.notes[clip.id] as NoteLike | undefined, group.criteria),
        )
      }

      const judgeTotals = judges.map((judge) => {
        const note = judge.notes[clip.id] as NoteLike | undefined
        return getNoteTotal(note, currentBareme)
      })
      const nonEmptyTotals = judges
        .map((judge) => {
          const note = judge.notes[clip.id] as NoteLike | undefined
          if (!hasAnyCriterionScore(note, currentBareme.criteria)) return null
          return getNoteTotal(note, currentBareme)
        })
        .filter((value): value is number => value !== null)
      const averageTotal = nonEmptyTotals.length > 0
        ? Math.round(
            (nonEmptyTotals.reduce((sum, value) => sum + value, 0) / nonEmptyTotals.length) *
              100,
          ) / 100
        : 0

      return {
        clip,
        categoryJudgeScores,
        judgeTotals,
        averageTotal,
      }
    })
  }, [categoryGroups, currentBareme, judges, sortedClips])

  return {
    effectiveSortMode,
    categoryGroups,
    judges,
    currentJudge,
    sortedClips,
    rows,
  }
}
