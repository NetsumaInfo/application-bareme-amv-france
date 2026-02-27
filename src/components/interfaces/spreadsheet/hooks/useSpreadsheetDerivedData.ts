import { useCallback, useMemo } from 'react'
import { getClipPrimaryLabel } from '@/utils/formatters'
import { CATEGORY_COLOR_PRESETS, sanitizeColor } from '@/utils/colors'
import { isNoteComplete } from '@/utils/scoring'
import type { CategoryGroup } from '@/components/interfaces/spreadsheet/types'
import type { Bareme } from '@/types/bareme'
import type { Clip, Project } from '@/types/project'
import type { Note } from '@/types/notation'

type UseSpreadsheetDerivedDataParams = {
  currentBareme: Bareme | null
  clips: Clip[]
  currentProject: Project | null
  getNoteForClip: (clipId: string) => Note | undefined
}

export function useSpreadsheetDerivedData({
  currentBareme,
  clips,
  currentProject,
  getNoteForClip,
}: UseSpreadsheetDerivedDataParams) {
  const categoryGroups = useMemo((): CategoryGroup[] => {
    if (!currentBareme) return []
    const groups: CategoryGroup[] = []
    const seen = new Map<string, number>()

    for (const criterion of currentBareme.criteria) {
      const category = criterion.category || 'Général'
      if (seen.has(category)) {
        groups[seen.get(category)!].criteria.push(criterion)
        groups[seen.get(category)!].totalMax += criterion.max ?? 10
      } else {
        seen.set(category, groups.length)
        const colorFromBareme = currentBareme.categoryColors?.[category]
        groups.push({
          category,
          criteria: [criterion],
          totalMax: criterion.max ?? 10,
          color: sanitizeColor(
            colorFromBareme,
            CATEGORY_COLOR_PRESETS[groups.length % CATEGORY_COLOR_PRESETS.length],
          ),
        })
      }
    }
    return groups
  }, [currentBareme])

  const sortedClips = useMemo(() => {
    const base = [...clips]
    const originalIndex = new Map(clips.map((clip, index) => [clip.id, index]))
    base.sort((a, b) => {
      const labelA = getClipPrimaryLabel(a)
      const labelB = getClipPrimaryLabel(b)
      const compare = labelA.localeCompare(labelB, 'fr', { sensitivity: 'base' })
      if (compare !== 0) return compare
      return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0)
    })
    return base
  }, [clips])

  const allClipsScored = useMemo(
    () => clips.length > 0 && clips.every((clip) => {
      if (clip.scored) return true
      if (!currentBareme) return false
      const note = getNoteForClip(clip.id)
      return note ? isNoteComplete(note, currentBareme) : false
    }),
    [clips, currentBareme, getNoteForClip],
  )
  const hasAnyLinkedVideo = clips.some((clip) => Boolean(clip.filePath))
  const hideTotalsSetting = Boolean(currentProject?.settings.hideTotals)
  const hideTotalsUntilAllScored =
    Boolean(currentProject?.settings.hideFinalScoreUntilEnd)
    && hasAnyLinkedVideo
    && !allClipsScored
  const showMiniatures = Boolean(currentProject?.settings.showMiniatures)
  const showAddRowButton = Boolean(currentProject?.settings.showAddRowButton)

  const getCategoryScore = useCallback(
    (clipId: string, group: CategoryGroup): number => {
      const note = getNoteForClip(clipId)
      if (!note) return 0
      let total = 0
      for (const criterion of group.criteria) {
        const score = note.scores[criterion.id]
        if (score && score.isValid && typeof score.value === 'number') {
          total += score.value
        }
      }
      return Math.round(total * 100) / 100
    },
    [getNoteForClip],
  )

  const hasAnyScoreInGroup = useCallback(
    (clipId: string, group: CategoryGroup): boolean => {
      const note = getNoteForClip(clipId)
      if (!note) return false
      for (const criterion of group.criteria) {
        const score = note.scores[criterion.id]
        if (!score) continue
        if (score.isValid === false) continue
        if (typeof score.value === 'boolean') return true
        const value = Number(score.value)
        if (Number.isFinite(value)) return true
      }
      return false
    },
    [getNoteForClip],
  )

  const hasAnyScoreInBareme = useCallback(
    (clipId: string): boolean => {
      if (!currentBareme) return false
      const note = getNoteForClip(clipId)
      if (!note) return false
      for (const criterion of currentBareme.criteria) {
        const score = note.scores[criterion.id]
        if (!score) continue
        if (score.isValid === false) continue
        if (typeof score.value === 'boolean') return true
        const value = Number(score.value)
        if (Number.isFinite(value)) return true
      }
      return false
    },
    [currentBareme, getNoteForClip],
  )

  return {
    categoryGroups,
    sortedClips,
    allClipsScored,
    hasAnyLinkedVideo,
    hideTotalsSetting,
    hideTotalsUntilAllScored,
    showMiniatures,
    showAddRowButton,
    getCategoryScore,
    hasAnyScoreInGroup,
    hasAnyScoreInBareme,
  }
}
