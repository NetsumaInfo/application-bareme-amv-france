import { useCallback, useMemo } from 'react'
import {
  buildCategoryGroups,
  buildJudgeSources,
  getCategoryScore,
  getCriterionNumericScore,
  getNoteTotal,
  hasAnyCriterionScore,
  type NoteLike,
} from '@/utils/results'
import type { Bareme } from '@/types/bareme'
import type { Clip, ImportedJudgeData } from '@/types/project'
import type { Note } from '@/types/notation'
import type { ResultatsRow } from '@/components/interfaces/resultats/types'
import { getClipPrimaryLabel } from '@/utils/formatters'

type SortMode = 'folder' | 'score' | 'name' | 'category' | 'criterion'
type SortDirection = 'asc' | 'desc'

function normalizeFavoriteFlag(value: unknown): boolean {
  return (
    value === true
    || value === 1
    || value === '1'
    || value === 'true'
  )
}

function normalizeFavoriteComment(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

type UseResultatsComputedDataParams = {
  currentBareme: Bareme | null
  currentJudgeName?: string
  notes: Record<string, Note>
  importedJudges: ImportedJudgeData[]
  clips: Clip[]
  sortMode: SortMode
  sortCategory?: string | null
  sortCriterion?: string | null
  sortDirection?: SortDirection
  canSortByScore: boolean
}

export function useResultatsComputedData({
  currentBareme,
  currentJudgeName,
  notes,
  importedJudges,
  clips,
  sortMode,
  sortCategory = null,
  sortCriterion = null,
  sortDirection = 'desc',
  canSortByScore,
}: UseResultatsComputedDataParams) {
  // +1 ascending, -1 descending. Applied to score/category/criterion/name sorts.
  const dirFactor = sortDirection === 'asc' ? 1 : -1
  const effectiveSortMode: SortMode = (() => {
    // Category/criterion sorts need a selected target; fall back to score otherwise.
    let mode: SortMode = sortMode
    if (mode === 'category' && !sortCategory) mode = 'score'
    if (mode === 'criterion' && !sortCriterion) mode = 'score'
    // Score-derived sorts are disabled while totals are hidden.
    if ((mode === 'score' || mode === 'category' || mode === 'criterion') && !canSortByScore) {
      mode = 'folder'
    }
    return mode
  })()

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

  // Mean of judges' score for one category (criteria sum) on a clip; 0 when unscored.
  const getClipCategoryAverage = useCallback(
    (clipId: string, category: string) => {
      const group = categoryGroups.find((g) => g.category === category)
      if (!group) return 0
      const values = judges
        .map((judge) => {
          const note = judge.notes[clipId] as NoteLike | undefined
          if (!hasAnyCriterionScore(note, group.criteria)) return null
          return getCategoryScore(note, group.criteria)
        })
        .filter((value): value is number => value !== null)
      return values.length > 0
        ? values.reduce((sum, v) => sum + v, 0) / values.length
        : 0
    },
    [categoryGroups, judges],
  )

  // Mean of judges' raw score for one criterion on a clip; 0 when unscored.
  const getClipCriterionAverage = useCallback(
    (clipId: string, criterionId: string) => {
      const criterion = categoryGroups
        .flatMap((g) => g.criteria)
        .find((c) => c.id === criterionId)
      if (!criterion) return 0
      const values = judges
        .map((judge) => {
          const note = judge.notes[clipId] as NoteLike | undefined
          if (!hasAnyCriterionScore(note, [criterion])) return null
          return getCriterionNumericScore(note, criterion)
        })
        .filter((value): value is number => value !== null)
      return values.length > 0
        ? values.reduce((sum, v) => sum + v, 0) / values.length
        : 0
    },
    [categoryGroups, judges],
  )

  const sortedClips = useMemo(() => {
    const base = [...clips]
    const originalIndex = new Map(clips.map((clip, index) => [clip.id, index]))

    if (effectiveSortMode === 'criterion' && sortCriterion && canSortByScore) {
      base.sort((a, b) => {
        const scoreA = getClipCriterionAverage(a.id, sortCriterion)
        const scoreB = getClipCriterionAverage(b.id, sortCriterion)
        if (scoreA !== scoreB) return dirFactor * (scoreA - scoreB)
        // Tie-break on overall total, same direction.
        const totalA = getClipAverageTotal(a.id)
        const totalB = getClipAverageTotal(b.id)
        if (totalA !== totalB) return dirFactor * (totalA - totalB)
        return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0)
      })
      return base
    }

    if (effectiveSortMode === 'category' && sortCategory && canSortByScore) {
      base.sort((a, b) => {
        const scoreA = getClipCategoryAverage(a.id, sortCategory)
        const scoreB = getClipCategoryAverage(b.id, sortCategory)
        if (scoreA !== scoreB) return dirFactor * (scoreA - scoreB)
        // Tie-break on overall total, same direction.
        const totalA = getClipAverageTotal(a.id)
        const totalB = getClipAverageTotal(b.id)
        if (totalA !== totalB) return dirFactor * (totalA - totalB)
        return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0)
      })
      return base
    }

    if (effectiveSortMode === 'score' && canSortByScore) {
      base.sort((a, b) => {
        const scoreA = getClipAverageTotal(a.id)
        const scoreB = getClipAverageTotal(b.id)
        if (scoreA !== scoreB) return dirFactor * (scoreA - scoreB)
        return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0)
      })
      return base
    }

    if (effectiveSortMode === 'name') {
      base.sort((a, b) => {
        const cmp = getClipPrimaryLabel(a).localeCompare(getClipPrimaryLabel(b), undefined, {
          sensitivity: 'base',
          numeric: true,
        })
        if (cmp !== 0) return dirFactor * cmp
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
  }, [clips, effectiveSortMode, sortCategory, sortCriterion, dirFactor, getClipAverageTotal, getClipCategoryAverage, getClipCriterionAverage, canSortByScore])

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
      const judgeFavorites = judges.map((judge) => {
        if (judge.isCurrentJudge) {
          return {
            isFavorite: Boolean(clip.favorite),
            comment: (clip.favoriteComment ?? '').trim(),
          }
        }

        const note = judge.notes[clip.id] as unknown as {
          favorite?: unknown
          isFavorite?: unknown
          is_favorite?: unknown
          favoriteComment?: unknown
          favorite_comment?: unknown
        } | undefined

        return {
          isFavorite: normalizeFavoriteFlag(note?.favorite ?? note?.isFavorite ?? note?.is_favorite),
          comment: normalizeFavoriteComment(note?.favoriteComment ?? note?.favorite_comment),
        }
      })

      return {
        clip,
        categoryJudgeScores,
        judgeTotals,
        averageTotal,
        judgeFavorites,
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
