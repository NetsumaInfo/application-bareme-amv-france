import type { ComponentProps } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import {
  ALL_CONTEST_CATEGORY_KEY,
  matchesContestCategoryKey,
  normalizeContestCategoryPresets,
} from '@/utils/contestCategory'

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
    setClipContestCategory,
    setClipFavorite,
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
  const [activeContestCategoryView, setActiveContestCategoryView] = useState<string>(ALL_CONTEST_CATEGORY_KEY)

  const [mediaInfoClip, setMediaInfoClip] = useState<{ name: string; path: string } | null>(null)
  const [favoriteDialogClipId, setFavoriteDialogClipId] = useState<string | null>(null)
  const [contestCategoryDialogClipId, setContestCategoryDialogClipId] = useState<string | null>(null)

  const {
    isDragOver,
    suppressEmptyManualCleanupRef,
    isImportingClipsRef,
    handleImportFolder,
    handleImportFiles,
  } = useSpreadsheetImport({
    currentProject,
    activeContestCategoryView,
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
    activeContestCategoryView,
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
  const favoriteDialogClip = favoriteDialogClipId
    ? (clips.find((clip) => clip.id === favoriteDialogClipId) ?? null)
    : null
  const contestCategoryDialogClip = contestCategoryDialogClipId
    ? (clips.find((clip) => clip.id === contestCategoryDialogClipId) ?? null)
    : null
  const contestCategoryDialogOptions = useMemo(
    () => normalizeContestCategoryPresets(currentProject?.settings.contestCategoryPresets ?? []),
    [currentProject?.settings.contestCategoryPresets],
  )

  const handleRenameCurrentClip = useCallback(() => {
    if (!currentClip) return
    handleStartClipIdentityEdit(currentClip.id)
  }, [currentClip, handleStartClipIdentityEdit])

  const handleSwapCurrentClipIdentity = useCallback(() => {
    if (!currentClip) return
    handleSwapClipAuthorAndDisplayName(currentClip.id)
  }, [currentClip, handleSwapClipAuthorAndDisplayName])

  const spreadsheetShortcuts = useMemo(() => ({
    [shortcutBindings.renameClip]: handleRenameCurrentClip,
    [shortcutBindings.swapPseudoAndClipName]: handleSwapCurrentClipIdentity,
  }), [
    handleRenameCurrentClip,
    handleSwapCurrentClipIdentity,
    shortcutBindings.renameClip,
    shortcutBindings.swapPseudoAndClipName,
  ])

  useKeyboardShortcuts(spreadsheetShortcuts)

  const {
    categoryGroups,
    sortedClips,
    hasAnyLinkedVideo,
    hideTotalsSetting,
    hideTotalsUntilAllScored,
    showMiniatures,
    showQuickActions,
    contestCategoriesEnabled,
    contestCategoryPresets,
    contestCategoryColors,
    getCategoryScore,
    hasAnyScoreInGroup,
    hasAnyScoreInBareme,
  } = useSpreadsheetDerivedData({
    currentBareme,
    clips,
    currentProject,
    getNoteForClip,
  })

  useEffect(() => {
    if (!contestCategoriesEnabled || contestCategoryPresets.length === 0) {
      if (activeContestCategoryView !== ALL_CONTEST_CATEGORY_KEY) {
        setActiveContestCategoryView(ALL_CONTEST_CATEGORY_KEY)
      }
      return
    }

    if (
      activeContestCategoryView !== ALL_CONTEST_CATEGORY_KEY
      && !contestCategoryPresets.includes(activeContestCategoryView)
    ) {
      setActiveContestCategoryView(ALL_CONTEST_CATEGORY_KEY)
    }
  }, [activeContestCategoryView, contestCategoriesEnabled, contestCategoryPresets])

  const visibleSortedClips = useMemo(
    () => sortedClips.filter((clip) => matchesContestCategoryKey(clip, activeContestCategoryView)),
    [activeContestCategoryView, sortedClips],
  )

  useEffect(() => {
    if (visibleSortedClips.length === 0) return
    if (currentClip && visibleSortedClips.some((clip) => clip.id === currentClip.id)) return
    const firstVisibleClipId = visibleSortedClips[0]?.id
    if (!firstVisibleClipId) return
    const nextIndex = clips.findIndex((clip) => clip.id === firstVisibleClipId)
    if (nextIndex < 0 || nextIndex === currentClipIndex) return
    setCurrentClip(nextIndex)
  }, [clips, currentClip, currentClipIndex, setCurrentClip, visibleSortedClips])

  const { handleKeyDown } = useSpreadsheetGridNavigation({
    clips,
    sortedClips: visibleSortedClips,
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
  } = useSpreadsheetContextMenuHandlers({
    clips,
    showMiniatures,
    showQuickActions,
    hasAnyLinkedVideo,
    updateSettings,
    setClipScored,
    setCurrentClip,
    setNotesDetached,
    openContestCategorySelector: (clipId) => setContestCategoryDialogClipId(clipId),
    openFavoriteDialog: (clip) => setFavoriteDialogClipId(clip.id),
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
    contestCategoriesEnabled,
    contestCategoryPresets,
    contestCategoryColors,
    activeContestCategoryView,
    onSelectContestCategoryView: setActiveContestCategoryView,
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
    allSortedClips: sortedClips,
    sortedClips: visibleSortedClips,
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
    onSelectContestCategoryView: setActiveContestCategoryView,
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
    favoriteDialogProps: favoriteDialogClip
      ? {
          clip: favoriteDialogClip,
          onClose: () => setFavoriteDialogClipId(null),
          onSave: (clip, comment) => {
            setClipFavorite(clip.id, true, comment)
            setFavoriteDialogClipId(null)
          },
          onRemove: (clip) => {
            setClipFavorite(clip.id, false)
            setFavoriteDialogClipId(null)
          },
        }
      : null,
    contestCategoryDialogProps: contestCategoryDialogClip
      ? {
          clip: contestCategoryDialogClip,
          categories: contestCategoryDialogOptions,
          onClose: () => setContestCategoryDialogClipId(null),
          onSave: (category) => {
            setClipContestCategory(contestCategoryDialogClip.id, category)
            setContestCategoryDialogClipId(null)
          },
        }
      : null,
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
  })

  return {
    currentBareme,
    hasClips: clips.length > 0,
    noVideoStateProps,
    spreadsheetLoadedViewProps,
  }
}
