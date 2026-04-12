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

  const {
    setShowPipVideo,
    showPipVideo,
    hideAverages,
    hideTextNotes,
    setNotesDetached,
    shortcutBindings,
  } = useUIStore()

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
    handleStartClipIdentityEdit,
    handleSwapClipAuthorAndDisplayName,
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
  })

  const criteriaCount = currentBareme?.criteria.length ?? 0

  const currentClip = clips[currentClipIndex]
  const currentNote = currentClip ? getNoteForClip(currentClip.id) : undefined
  const {
    categoryGroups,
    sortedClips,
    hasAnyLinkedVideo,
    hideTotalsSetting,
    hideTotalsUntilAllScored,
    showMiniatures,
    showQuickActions,
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
    handleRenameClip,
    handleSwapPseudoAndClipName,
    handleSetMiniatureFromCurrentFrame,
    handleResetMiniature,
    handleToggleMiniatures,
    handleToggleQuickActions,
    handleShowMediaInfo,
    handleRemoveClip,
  } = useSpreadsheetContextMenuHandlers({
    clips,
    showMiniatures,
    showQuickActions,
    hasAnyLinkedVideo,
    updateSettings,
    setClipScored,
    setCurrentClip,
    setNotesDetached,
    handleAttachVideoToClip,
    startClipIdentityEdit: handleStartClipIdentityEdit,
    swapClipAuthorAndDisplayName: handleSwapClipAuthorAndDisplayName,
    setMiniatureFromCurrentFrame,
    setContextMenu,
    setMediaInfoClip,
  })

  const handleChange = useSpreadsheetCriterionChange({
    markDirty,
    updateCriterion,
  })

  const contextClip = contextMenu
    ? (clips.find((clip) => clip.id === contextMenu.clipId) ?? null)
    : null

  const noVideoStateProps = useSpreadsheetNoVideoProps({
    isDragOver,
    clipNamePattern: currentProject?.settings.clipNamePattern ?? 'pseudo_clip',
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
    showMiniatures,
    showQuickActions,
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
    currentClip,
    hideTextNotes,
    currentNote,
    clipFps,
    notesTextareaRef,
    setTextNotes,
    markDirty,
    setShowPipVideo,
    showPipVideo,
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
    handleRenameClip,
    handleSwapPseudoAndClipName,
    handleSetMiniatureFromCurrentFrame,
    handleResetMiniature,
    handleToggleMiniatures,
    handleToggleQuickActions,
    handleShowMediaInfo,
    handleRemoveClip,
    mediaInfoClip,
    setMediaInfoClip,
  })

  return {
    currentBareme,
    hasClips: clips.length > 0,
    noVideoStateProps,
    spreadsheetLoadedViewProps,
  }
}
