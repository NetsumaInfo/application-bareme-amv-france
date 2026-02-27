import { useEffect, useMemo } from 'react'
import type { Bareme } from '@/types/bareme'
import type { Clip, ImportedJudgeData, Project } from '@/types/project'
import type { Note } from '@/types/notation'
import {
  buildCategoryGroups,
  buildJudgeSources,
  getCategoryScore,
  getCriterionNumericScore,
  getNoteTotal,
  type NoteLike,
} from '@/utils/results'
import type { ExportMode } from '@/components/interfaces/export/types'

interface UseExportDataOptions {
  currentBareme: Bareme | null
  notes: Record<string, Note>
  currentProject: Project | null
  clips: Clip[]
  importedJudges: ImportedJudgeData[]
  exportMode: ExportMode
  selectedJudgeKey: string
  onSelectedJudgeKeyChange: (key: string) => void
}

export function useExportData({
  currentBareme,
  notes,
  currentProject,
  clips,
  importedJudges,
  exportMode,
  selectedJudgeKey,
  onSelectedJudgeKeyChange,
}: UseExportDataOptions) {
  const categoryGroups = useMemo(
    () => (currentBareme ? buildCategoryGroups(currentBareme) : []),
    [currentBareme],
  )

  const judges = useMemo(
    () => buildJudgeSources(currentProject?.judgeName, notes, importedJudges),
    [currentProject?.judgeName, notes, importedJudges],
  )

  const orderedClips = useMemo(() => {
    const base = [...clips]
    const originalIndex = new Map(clips.map((clip, index) => [clip.id, index]))
    base.sort((a, b) => {
      const orderA = Number.isFinite(a.order) ? a.order : (originalIndex.get(a.id) ?? 0)
      const orderB = Number.isFinite(b.order) ? b.order : (originalIndex.get(b.id) ?? 0)
      if (orderA !== orderB) return orderA - orderB
      return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0)
    })
    return base
  }, [clips])

  const rows = useMemo(() => {
    if (!currentBareme) return []
    return orderedClips.map((clip) => {
      const categoryJudgeScores: Record<string, number[]> = {}
      const categoryAverages: Record<string, number> = {}
      const criterionJudgeScores: Record<string, number[]> = {}
      const criterionAverages: Record<string, number> = {}
      for (const group of categoryGroups) {
        const values = judges.map((judge) =>
          getCategoryScore(judge.notes[clip.id] as NoteLike | undefined, group.criteria),
        )
        categoryJudgeScores[group.category] = values
        const average = values.length > 0
          ? values.reduce((sum, value) => sum + value, 0) / values.length
          : 0

        categoryAverages[group.category] = Math.round(average * 100) / 100

        for (const criterion of group.criteria) {
          const criterionValues = judges.map((judge) =>
            getCriterionNumericScore(judge.notes[clip.id] as NoteLike | undefined, criterion),
          )
          criterionJudgeScores[criterion.id] = criterionValues
          const criterionAverage = criterionValues.length > 0
            ? criterionValues.reduce((sum, value) => sum + value, 0) / criterionValues.length
            : 0
          criterionAverages[criterion.id] = Math.round(criterionAverage * 100) / 100
        }
      }

      const judgeTotals = judges.map((judge) =>
        getNoteTotal(judge.notes[clip.id] as NoteLike | undefined, currentBareme),
      )
      const averageTotal = judgeTotals.length > 0
        ? Math.round((judgeTotals.reduce((sum, value) => sum + value, 0) / judgeTotals.length) * 100) / 100
        : 0

      return {
        clip,
        categoryJudgeScores,
        categoryAverages,
        criterionJudgeScores,
        criterionAverages,
        judgeTotals,
        averageTotal,
      }
    })
  }, [orderedClips, categoryGroups, currentBareme, judges])

  useEffect(() => {
    if (judges.length === 0) return
    if (!judges.some((judge) => judge.key === selectedJudgeKey)) {
      const current = judges.find((judge) => judge.isCurrentJudge)
      onSelectedJudgeKeyChange((current ?? judges[0]).key)
    }
  }, [judges, selectedJudgeKey, onSelectedJudgeKeyChange])

  const selectedJudgeIndex = useMemo(() => {
    const index = judges.findIndex((judge) => judge.key === selectedJudgeKey)
    return index >= 0 ? index : 0
  }, [judges, selectedJudgeKey])

  const selectedJudge = judges[selectedJudgeIndex]

  const displayRows = useMemo(() => {
    const orderByClipId = new Map(orderedClips.map((clip, index) => [clip.id, index]))
    const ranked = [...rows]
    ranked.sort((a, b) => {
      const scoreA = exportMode === 'individual'
        ? (a.judgeTotals[selectedJudgeIndex] ?? 0)
        : a.averageTotal
      const scoreB = exportMode === 'individual'
        ? (b.judgeTotals[selectedJudgeIndex] ?? 0)
        : b.averageTotal
      if (scoreB !== scoreA) return scoreB - scoreA
      return (orderByClipId.get(a.clip.id) ?? 0) - (orderByClipId.get(b.clip.id) ?? 0)
    })
    return ranked
  }, [rows, orderedClips, exportMode, selectedJudgeIndex])

  const rankByClipId = useMemo(() => {
    const ranks = new Map<string, number>()
    displayRows.forEach((row, index) => {
      ranks.set(row.clip.id, index + 1)
    })
    return ranks
  }, [displayRows])

  return {
    categoryGroups,
    judges,
    selectedJudge,
    selectedJudgeIndex,
    displayRows,
    rankByClipId,
  }
}
