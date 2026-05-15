import type { ComponentProps, FocusEvent, KeyboardEvent as ReactKeyboardEvent, MutableRefObject } from 'react'
import { buildSpreadsheetTableProps } from '@/components/interfaces/spreadsheet/hooks/useSpreadsheetTableProps'
import { buildSpreadsheetNotesPanelProps } from '@/components/interfaces/spreadsheet/hooks/useSpreadsheetNotesPanelProps'
import { buildSpreadsheetContextMenuProps } from '@/components/interfaces/spreadsheet/hooks/useSpreadsheetContextMenuProps'
import type { SpreadsheetLoadedView } from '@/components/interfaces/spreadsheet/SpreadsheetLoadedView'
import type { Bareme } from '@/types/bareme'
import type { CategoryGroup } from '@/utils/results'
import type { Clip, Project } from '@/types/project'
import type { Note } from '@/types/notation'
import type { ShortcutAction } from '@/utils/shortcuts'
import { useI18n } from '@/i18n'
import {
  ALL_CONTEST_CATEGORY_KEY,
  getClipContestCategory,
  getContestCategoryColor,
  normalizeContestCategoryPresets,
} from '@/utils/contestCategory'

interface UseSpreadsheetLoadedViewPropsParams {
  isDragOver: boolean
  clips: Clip[]
  allSortedClips: Clip[]
  sortedClips: Clip[]
  currentClipIndex: number
  currentBareme: Bareme | null
  categoryGroups: CategoryGroup[]
  hideTotalsSetting: boolean
  hideTotalsUntilAllScored: boolean
  hideAverages: boolean
  showMiniatures: boolean
  showQuickActions: boolean
  contestCategoriesEnabled: boolean
  contestCategoryPresets: string[]
  contestCategoryColors: Record<string, string>
  activeContestCategoryView: string
  onSelectContestCategoryView: (categoryKey: string) => void
  hasAnyLinkedVideo: boolean
  shortcutBindings: Record<ShortcutAction, string>
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
  handleAddManualRow: () => void
  setCurrentClip: (index: number) => void
  openClipContextMenu: (clipId: string, x: number, y: number) => void
  openPlayerAtFront: () => void
  setEditingManualClipId: (clipId: string | null) => void
  handleManualClipBlur: (clipId: string, event: FocusEvent<HTMLDivElement>) => void
  handleManualClipFieldChange: (
    clipId: string,
    field: 'author' | 'displayName' | 'contestCategory',
    value: string,
  ) => void
  handleChange: (clipId: string, criterionId: string, value: string) => void
  handleKeyDown: (event: ReactKeyboardEvent<Element>, clipIdx: number, critIdx: number) => void
  seek: (time: number) => Promise<void>
  pause: () => Promise<void>
  showFramePreview: (params: { seconds: number; anchorRect: DOMRect }) => Promise<void>
  hideFramePreview: () => void
  currentClip: Clip | undefined
  hideTextNotes: boolean
  currentNote: Note | undefined
  clipFps: number | null
  notesTextareaRef: MutableRefObject<HTMLTextAreaElement | null>
  setTextNotes: (clipId: string, text: string) => void
  markDirty: () => void
  setShowPipVideo: (show: boolean) => void
  showPipVideo: boolean
  framePreview: {
    visible: boolean
    left: number
    top: number
    image: string | null
    loading: boolean
  }
  contextMenu: { clipId: string; x: number; y: number } | null
  contextClip: Clip | null
  contextMenuRef: MutableRefObject<HTMLDivElement | null>
  favoriteDialogProps: ComponentProps<typeof SpreadsheetLoadedView>['favoriteDialogProps']
  contestCategoryDialogProps: ComponentProps<typeof SpreadsheetLoadedView>['contestCategoryDialogProps']
  handleToggleScored: (clip: Clip) => void
  handleOpenFavorite: (clip: Clip) => void
  handleOpenNotes: (clip: Clip) => void
  handleAttachVideo: (clip: Clip) => void
  handleRenameClip: (clip: Clip) => void
  handleEditContestCategory: (clip: Clip) => void
  handleSwapPseudoAndClipName: (clip: Clip) => void
  handleSetMiniatureFromCurrentFrame: (clip: Clip) => void
  handleResetMiniature: (clip: Clip) => void
  handleToggleMiniatures: () => void
  handleToggleQuickActions: () => void
  handleShowMediaInfo: (clip: Clip) => void
  handleRemoveClip: (clip: Clip) => void
  mediaInfoClip: { name: string; path: string } | null
  setMediaInfoClip: (clip: { name: string; path: string } | null) => void
}

export function useSpreadsheetLoadedViewProps({
  isDragOver,
  clips,
  allSortedClips,
  sortedClips,
  currentClipIndex,
  currentBareme,
  categoryGroups,
  hideTotalsSetting,
  hideTotalsUntilAllScored,
  hideAverages,
  showMiniatures,
  showQuickActions,
  contestCategoriesEnabled,
  contestCategoryPresets,
  contestCategoryColors,
  activeContestCategoryView,
  onSelectContestCategoryView,
  hasAnyLinkedVideo,
  shortcutBindings,
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
  handleAddManualRow,
  setCurrentClip,
  openClipContextMenu,
  openPlayerAtFront,
  setEditingManualClipId,
  handleManualClipBlur,
  handleManualClipFieldChange,
  handleChange,
  handleKeyDown,
  seek,
  pause,
  showFramePreview,
  hideFramePreview,
  currentClip,
  hideTextNotes,
  currentNote,
  clipFps,
  notesTextareaRef,
  setTextNotes,
  markDirty,
  setShowPipVideo,
  showPipVideo,
  framePreview,
  contextMenu,
  contextClip,
  contextMenuRef,
  favoriteDialogProps,
  contestCategoryDialogProps,
  handleToggleScored,
  handleOpenFavorite,
  handleOpenNotes,
  handleAttachVideo,
  handleRenameClip,
  handleEditContestCategory,
  handleSwapPseudoAndClipName,
  handleSetMiniatureFromCurrentFrame,
  handleResetMiniature,
  handleToggleMiniatures,
  handleToggleQuickActions,
  handleShowMediaInfo,
  handleRemoveClip,
  mediaInfoClip,
  setMediaInfoClip,
}: UseSpreadsheetLoadedViewPropsParams): ComponentProps<typeof SpreadsheetLoadedView> | null {
  const { t } = useI18n()
  if (!currentBareme) return null
  const normalizedContestPresets = normalizeContestCategoryPresets(contestCategoryPresets)
  const contestCategoryViewTabs = [
    {
      key: ALL_CONTEST_CATEGORY_KEY,
      label: t('Toutes catégories'),
      color: 'rgb(var(--color-primary-500) / 0.75)',
      count: allSortedClips.length,
    },
    ...normalizedContestPresets.map((category, index) => ({
      key: category,
      label: category,
      color: getContestCategoryColor(category, contestCategoryColors, index),
      count: allSortedClips.filter((clip) => getClipContestCategory(clip) === category).length,
    })),
  ]
  const hasContestCategories = normalizedContestPresets.length > 0

  const tableProps = buildSpreadsheetTableProps({
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
    seek,
    pause,
    showFramePreview,
    hideFramePreview,
  })

  const notesPanelProps = buildSpreadsheetNotesPanelProps({
    currentClip,
    hideTextNotes,
    currentNote,
    categoryGroups,
    clipFps,
    notesTextareaRef,
    getCategoryScore,
    setTextNotes,
    markDirty,
    setShowPipVideo,
    seek,
    pause,
    showFramePreview,
    hideFramePreview,
  })

  const contextMenuProps = buildSpreadsheetContextMenuProps({
    contextMenu,
    contextClip,
    currentClip,
    showMiniatures,
    showQuickActions,
    hasAnyLinkedVideo,
    hasContestCategories,
    shortcutBindings,
    contextMenuRef,
    handleToggleScored,
    handleOpenFavorite,
    handleOpenNotes,
    handleAttachVideo,
    handleRenameClip,
    handleEditContestCategory,
    handleSwapPseudoAndClipName,
    handleSetMiniatureFromCurrentFrame,
    handleResetMiniature,
    handleToggleMiniatures,
    handleToggleQuickActions,
    handleShowMediaInfo,
    handleRemoveClip,
  })

  return {
    isDragOver,
    hasClips: clips.length > 0,
    showQuickActions,
    toolbarProps: {
      currentClip,
      contestCategoriesEnabled,
      contestCategoryViewTabs,
      activeContestCategoryView,
      onAddManualRow: handleAddManualRow,
      onSelectContestCategoryView,
      onToggleScored: handleToggleScored,
      onOpenFavorite: handleOpenFavorite,
      onOpenNotes: handleOpenNotes,
      onAttachVideo: handleAttachVideo,
      onRenameClip: handleRenameClip,
      onEditContestCategory: handleEditContestCategory,
      onSwapPseudoAndClipName: handleSwapPseudoAndClipName,
      onToggleMiniatures: handleToggleMiniatures,
      onShowMediaInfo: handleShowMediaInfo,
      onRemoveClip: handleRemoveClip,
      onTogglePipVideo: () => setShowPipVideo(!showPipVideo),
      showMiniatures,
      hasAnyLinkedVideo,
      hasContestCategories,
      showPipVideo,
    },
    tableProps,
    notesPanelProps,
    framePreviewProps: {
      framePreview,
    },
    contextMenuProps,
    favoriteDialogProps,
    contestCategoryDialogProps,
    mediaInfoClip,
    onCloseMediaInfo: () => setMediaInfoClip(null),
  } satisfies ComponentProps<typeof SpreadsheetLoadedView>
}
