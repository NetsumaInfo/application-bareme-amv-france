import { useMemo, useState } from 'react'
import type { Note } from '@/types/notation'
import type { Clip } from '@/types/project'
import type { CategoryGroup } from '@/utils/results'

interface UseSpreadsheetScoringStateOptions {
  clips: Clip[]
  contextClipId: string | null
  currentClip: Clip | undefined
  categoryGroups: CategoryGroup[]
  getNoteForClip: (clipId: string) => Note | undefined
  getCategoryScore: (clipId: string, group: CategoryGroup) => number
}

export function useSpreadsheetScoringState({
  clips,
  contextClipId,
  currentClip,
  categoryGroups,
  getNoteForClip,
  getCategoryScore,
}: UseSpreadsheetScoringStateOptions) {
  const [scoringCategory, setScoringCategory] = useState<string | null>(null)

  const scoredClips = useMemo(
    () => clips.filter((clip) => clip.scored),
    [clips],
  )

  const contextClip = useMemo(
    () => (contextClipId ? clips.find((clip) => clip.id === contextClipId) ?? null : null),
    [clips, contextClipId],
  )

  const selectedScoringGroup = useMemo(
    () => (scoringCategory ? categoryGroups.find((group) => group.category === scoringCategory) ?? null : null),
    [categoryGroups, scoringCategory],
  )

  const selectedScoringNote = useMemo(
    () => (currentClip ? getNoteForClip(currentClip.id) : undefined),
    [currentClip, getNoteForClip],
  )

  const selectedScoringCategoryScore = useMemo(
    () => (currentClip && selectedScoringGroup
      ? getCategoryScore(currentClip.id, selectedScoringGroup)
      : 0),
    [currentClip, getCategoryScore, selectedScoringGroup],
  )

  const toggleScoringCategory = (category: string) => {
    setScoringCategory((prev) => (prev === category ? null : category))
  }

  return {
    contextClip,
    scoredClips,
    scoringCategory,
    selectedScoringGroup,
    selectedScoringNote,
    selectedScoringCategoryScore,
    setScoringCategory,
    toggleScoringCategory,
  }
}
