import type { ComponentProps, FocusEvent, KeyboardEvent as ReactKeyboardEvent, MutableRefObject } from 'react'
import type { SpreadsheetTable } from '@/components/interfaces/spreadsheet/SpreadsheetTable'
import type { Bareme } from '@/types/bareme'
import type { CategoryGroup } from '@/utils/results'
import type { Clip, Project } from '@/types/project'
import type { Note } from '@/types/notation'

interface UseSpreadsheetTablePropsParams {
  clips: Clip[]
  sortedClips: Clip[]
  currentClipIndex: number
  currentBareme: Bareme
  categoryGroups: CategoryGroup[]
  hideTotalsSetting: boolean
  hideTotalsUntilAllScored: boolean
  hideAverages: boolean
  showMiniatures: boolean
  currentProject: Project | null
  editingManualClipId: string | null
  cellRefs: MutableRefObject<Map<string, HTMLInputElement>>
  rowRefs: MutableRefObject<Map<number, HTMLTableRowElement>>
  pendingManualCleanupTimeoutsRef: MutableRefObject<Map<string, ReturnType<typeof setTimeout>>>
  getNoteForClip: (clipId: string) => Note | undefined
  getScoreForClip: (clipId: string) => number
  getCategoryScore: (clipId: string, group: CategoryGroup) => number
  hasAnyScoreInGroup: (clipId: string, group: CategoryGroup) => boolean
  hasAnyScoreInBareme: (clipId: string) => boolean
  setCurrentClip: (index: number) => void
  openClipContextMenu: (clipId: string, x: number, y: number) => void
  openPlayerAtFront: () => void
  setEditingManualClipId: (clipId: string | null) => void
  handleManualClipBlur: (clipId: string, event: FocusEvent<HTMLDivElement>) => void
  handleManualClipFieldChange: (clipId: string, field: 'author' | 'displayName', value: string) => void
  handleChange: (clipId: string, criterionId: string, value: string) => void
  handleKeyDown: (event: ReactKeyboardEvent<Element>, clipIdx: number, critIdx: number) => void
  toggleScoringCategory: (category: string) => void
}

export function buildSpreadsheetTableProps({
  clips,
  sortedClips,
  currentClipIndex,
  currentBareme,
  categoryGroups,
  hideTotalsSetting,
  hideTotalsUntilAllScored,
  hideAverages,
  showMiniatures,
  currentProject,
  editingManualClipId,
  cellRefs,
  rowRefs,
  pendingManualCleanupTimeoutsRef,
  getNoteForClip,
  getScoreForClip,
  getCategoryScore,
  hasAnyScoreInGroup,
  hasAnyScoreInBareme,
  setCurrentClip,
  openClipContextMenu,
  openPlayerAtFront,
  setEditingManualClipId,
  handleManualClipBlur,
  handleManualClipFieldChange,
  handleChange,
  handleKeyDown,
  toggleScoringCategory,
}: UseSpreadsheetTablePropsParams): ComponentProps<typeof SpreadsheetTable> {
  return {
    clips,
    sortedClips,
    currentClipIndex,
    currentBareme,
    categoryGroups,
    hideTotalsSetting,
    hideTotalsUntilAllScored,
    hideAverages,
    showMiniatures,
    thumbnailDefaultSeconds: currentProject?.settings.thumbnailDefaultTimeSec ?? 10,
    editingManualClipId,
    cellRefs,
    rowRefs,
    pendingManualCleanupTimeoutsRef,
    getNoteForClip,
    getScoreForClip,
    getCategoryScore,
    hasAnyScoreInGroup,
    hasAnyScoreInBareme,
    onSetCurrentClip: setCurrentClip,
    onOpenClipContextMenu: openClipContextMenu,
    onOpenPlayerAtFront: openPlayerAtFront,
    onSetEditingManualClipId: setEditingManualClipId,
    onManualClipBlur: handleManualClipBlur,
    onManualClipFieldChange: handleManualClipFieldChange,
    onCellChange: handleChange,
    onCellKeyDown: handleKeyDown,
    onToggleScoringCategory: toggleScoringCategory,
  }
}
