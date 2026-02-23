import type { ComponentProps } from 'react'
import { useRef, useState } from 'react'
import { useSpreadsheetImport } from '@/components/interfaces/spreadsheet/hooks/useSpreadsheetImport'
import { useSpreadsheetManualClips } from '@/components/interfaces/spreadsheet/hooks/useSpreadsheetManualClips'
import { useSpreadsheetFrameTools } from '@/components/interfaces/spreadsheet/hooks/useSpreadsheetFrameTools'
import { useSpreadsheetGridNavigation } from '@/components/interfaces/spreadsheet/hooks/useSpreadsheetGridNavigation'
import { useSpreadsheetDerivedData } from '@/components/interfaces/spreadsheet/hooks/useSpreadsheetDerivedData'
import { useSpreadsheetContextActions } from '@/components/interfaces/spreadsheet/hooks/useSpreadsheetContextActions'
import { useSpreadsheetContextMenuHandlers } from '@/components/interfaces/spreadsheet/hooks/useSpreadsheetContextMenuHandlers'
import { useSpreadsheetCriterionChange } from '@/components/interfaces/spreadsheet/hooks/useSpreadsheetCriterionChange'
import { useSpreadsheetScoringState } from '@/components/interfaces/spreadsheet/hooks/useSpreadsheetScoringState'
import { useSpreadsheetNoVideoProps } from '@/components/interfaces/spreadsheet/hooks/useSpreadsheetNoVideoProps'
import { useSpreadsheetLoadedViewProps } from '@/components/interfaces/spreadsheet/hooks/useSpreadsheetLoadedViewProps'
import type { NoVideoState } from '@/components/interfaces/spreadsheet/NoVideoState'
import type { SpreadsheetLoadedView } from '@/components/interfaces/spreadsheet/SpreadsheetLoadedView'
import type { Bareme } from '@/types/bareme'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import { usePlayer } from '@/hooks/usePlayer'

interface SpreadsheetInterfaceController {
  currentBareme: Bareme | null
  hasClips: boolean
  noVideoStateProps: ComponentProps<typeof NoVideoState>
  spreadsheetLoadedViewProps: ComponentProps<typeof SpreadsheetLoadedView> | null
}

export function useSpreadsheetInterfaceController(): SpreadsheetInterfaceController {
  const {
    currentBareme,
    updateCriterion,
    getNoteForClip,
    getScoreForClip,
    setTextNotes,
  } = useNotationStore()

  const { seek, pause } = usePlayer()
  const {
    clips,
    currentClipIndex,
    setCurrentClip,
    setClips,
    currentProject,
    updateProject,
    updateSettings,
    setClipScored,
    setClipThumbnailTime,
    markDirty,
    removeClip,
  } = useProjectStore()

  const { setShowPipVideo, hideAverages, hideTextNotes, setNotesDetached, shortcutBindings } = useUIStore()

  const cellRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map())
  const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  const [mediaInfoClip, setMediaInfoClip] = useState<{ name: string; path: string } | null>(null)

  const {
    isDragOver,
    suppressEmptyManualCleanupRef,
    isImportingClipsRef,
    handleImportFolder,
    handleImportFiles,
  } = useSpreadsheetImport({
    currentProject,
    markDirty,
    setClips,
    updateProject,
    updateSettings,
  })

  const {
    showNoVideoTableModal,
    noVideoTableAccepted,
    noVideoTableInput,
    noVideoTableError,
    editingManualClipId,
    pendingManualCleanupTimeoutsRef,
    setShowNoVideoTableModal,
    setNoVideoTableAccepted,
    setNoVideoTableInput,
    setNoVideoTableError,
    setEditingManualClipId,
    handleAddManualRow,
    handleManualClipFieldChange,
    handleManualClipBlur,
    handleAttachVideoToClip,
    resetNoVideoTableModal,
    handleCreateNoVideoTable,
  } = useSpreadsheetManualClips({
    isDragOver,
    isImportingClipsRef,
    suppressEmptyManualCleanupRef,
    markDirty,
    setClips,
    setCurrentClip,
    removeClip,
    updateSettings,
  })

  const criteriaCount = currentBareme?.criteria.length ?? 0

  const currentClip = clips[currentClipIndex]
  const currentNote = currentClip ? getNoteForClip(currentClip.id) : undefined
  const {
    categoryGroups,
    sortedClips,
    hideTotalsSetting,
    hideTotalsUntilAllScored,
    showMiniatures,
    showAddRowButton,
    getCategoryScore,
    hasAnyScoreInGroup,
    hasAnyScoreInBareme,
  } = useSpreadsheetDerivedData({
    currentBareme,
    clips,
    currentProject,
    getNoteForClip,
  })

  const { handleKeyDown } = useSpreadsheetGridNavigation({
    clips,
    sortedClips,
    criteriaCount,
    shortcutBindings,
    setCurrentClip,
    cellRefs,
    rowRefs,
  })

  const { clipFps, framePreview, showFramePreview, hideFramePreview } = useSpreadsheetFrameTools({
    currentClip,
    markDirty,
    setTextNotes,
    notesTextareaRef,
    shortcutBindings,
  })

  const {
    contextMenu,
    setContextMenu,
    contextMenuRef,
    openClipContextMenu,
    openPlayerAtFront,
    setMiniatureFromCurrentFrame,
  } = useSpreadsheetContextActions({
    clips,
    currentClipIndex,
    currentProject,
    setShowPipVideo,
    updateSettings,
    setClipThumbnailTime,
  })

  const {
    handleToggleScored,
    handleOpenNotes,
    handleAttachVideo,
    handleSetMiniatureFromCurrentFrame,
    handleResetMiniature,
    handleToggleMiniatures,
    handleShowMediaInfo,
    handleRemoveClip,
  } = useSpreadsheetContextMenuHandlers({
    clips,
    showMiniatures,
    updateSettings,
    setClipScored,
    setCurrentClip,
    setNotesDetached,
    handleAttachVideoToClip,
    setMiniatureFromCurrentFrame,
    setContextMenu,
    setMediaInfoClip,
  })

  const handleChange = useSpreadsheetCriterionChange({
    markDirty,
    updateCriterion,
  })

  const {
    contextClip,
    scoredClips,
    selectedScoringGroup,
    selectedScoringNote,
    selectedScoringCategoryScore,
    setScoringCategory,
    toggleScoringCategory,
  } = useSpreadsheetScoringState({
    clips,
    contextClipId: contextMenu?.clipId ?? null,
    currentClip,
    categoryGroups,
    getNoteForClip,
    getCategoryScore,
  })

  const noVideoStateProps = useSpreadsheetNoVideoProps({
    isDragOver,
    showNoVideoTableModal,
    noVideoTableAccepted,
    noVideoTableInput,
    noVideoTableError,
    handleImportFolder,
    handleImportFiles,
    setShowNoVideoTableModal,
    setNoVideoTableError,
    resetNoVideoTableModal,
    setNoVideoTableAccepted,
    setNoVideoTableInput,
    handleCreateNoVideoTable,
  })

  const spreadsheetLoadedViewProps = useSpreadsheetLoadedViewProps({
    isDragOver,
    clips,
    sortedClips,
    currentClipIndex,
    currentBareme,
    categoryGroups,
    hideTotalsSetting,
    hideTotalsUntilAllScored,
    hideAverages,
    scoredClips,
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
    showAddRowButton,
    handleAddManualRow,
    setCurrentClip,
    openClipContextMenu,
    openPlayerAtFront,
    setEditingManualClipId,
    handleManualClipBlur,
    handleManualClipFieldChange,
    handleChange,
    handleKeyDown,
    toggleScoringCategory,
    currentClip,
    hideTextNotes,
    currentNote,
    clipFps,
    notesTextareaRef,
    setTextNotes,
    markDirty,
    setShowPipVideo,
    seek,
    pause,
    showFramePreview,
    hideFramePreview,
    framePreview,
    contextMenu,
    contextClip,
    contextMenuRef,
    handleToggleScored,
    handleOpenNotes,
    handleAttachVideo,
    handleSetMiniatureFromCurrentFrame,
    handleResetMiniature,
    handleToggleMiniatures,
    handleShowMediaInfo,
    handleRemoveClip,
    mediaInfoClip,
    setMediaInfoClip,
    selectedScoringGroup,
    selectedScoringNote,
    selectedScoringCategoryScore,
    setScoringCategory,
  })

  return {
    currentBareme,
    hasClips: clips.length > 0,
    noVideoStateProps,
    spreadsheetLoadedViewProps,
  }
}
