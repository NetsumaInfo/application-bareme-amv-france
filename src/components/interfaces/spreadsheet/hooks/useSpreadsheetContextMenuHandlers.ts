import { useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { useClipDeletionStore } from '@/store/useClipDeletionStore'
import * as tauri from '@/services/tauri'
import { getClipPrimaryLabel } from '@/utils/formatters'
import type { Clip, Project } from '@/types/project'

interface UseSpreadsheetContextMenuHandlersOptions {
  clips: Clip[]
  showMiniatures: boolean
  showQuickActions: boolean
  hasAnyLinkedVideo: boolean
  updateSettings: (settings: Partial<Project['settings']>) => void
  setClipScored: (clipId: string, scored: boolean) => void
  setCurrentClip: (index: number) => void
  setNotesDetached: (detached: boolean) => void
  handleAttachVideoToClip: (clipId: string) => Promise<void>
  startClipIdentityEdit: (clipId: string) => void
  swapClipAuthorAndDisplayName: (clipId: string) => void
  setMiniatureFromCurrentFrame: (clipId: string) => Promise<void>
  setContextMenu: Dispatch<SetStateAction<{ clipId: string; x: number; y: number } | null>>
  setMediaInfoClip: Dispatch<SetStateAction<{ name: string; path: string } | null>>
}

export function useSpreadsheetContextMenuHandlers({
  clips,
  showMiniatures,
  showQuickActions,
  hasAnyLinkedVideo,
  updateSettings,
  setClipScored,
  setCurrentClip,
  setNotesDetached,
  handleAttachVideoToClip,
  startClipIdentityEdit,
  swapClipAuthorAndDisplayName,
  setMiniatureFromCurrentFrame,
  setContextMenu,
  setMediaInfoClip,
}: UseSpreadsheetContextMenuHandlersOptions) {
  const setClipThumbnailTime = useProjectStore((state) => state.setClipThumbnailTime)
  const requestClipDeletion = useClipDeletionStore((state) => state.requestClipDeletion)

  const closeContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [setContextMenu])

  const handleToggleScored = useCallback((clip: Clip) => {
    setClipScored(clip.id, !clip.scored)
    closeContextMenu()
  }, [closeContextMenu, setClipScored])

  const handleOpenNotes = useCallback((clip: Clip) => {
    const index = clips.findIndex((item) => item.id === clip.id)
    if (index >= 0) setCurrentClip(index)
    tauri.openNotesWindow().then(() => setNotesDetached(true)).catch(() => {})
    closeContextMenu()
  }, [clips, closeContextMenu, setCurrentClip, setNotesDetached])

  const handleAttachVideo = useCallback((clip: Clip) => {
    handleAttachVideoToClip(clip.id).catch(() => {})
    closeContextMenu()
  }, [closeContextMenu, handleAttachVideoToClip])

  const handleRenameClip = useCallback((clip: Clip) => {
    startClipIdentityEdit(clip.id)
    closeContextMenu()
  }, [closeContextMenu, startClipIdentityEdit])

  const handleSwapPseudoAndClipName = useCallback((clip: Clip) => {
    swapClipAuthorAndDisplayName(clip.id)
    closeContextMenu()
  }, [closeContextMenu, swapClipAuthorAndDisplayName])

  const handleSetMiniatureFromCurrentFrame = useCallback((clip: Clip) => {
    setMiniatureFromCurrentFrame(clip.id).catch(() => {})
    closeContextMenu()
  }, [closeContextMenu, setMiniatureFromCurrentFrame])

  const handleResetMiniature = useCallback((clip: Clip) => {
    setClipThumbnailTime(clip.id, null)
    closeContextMenu()
  }, [closeContextMenu, setClipThumbnailTime])

  const handleToggleMiniatures = useCallback(() => {
    if (!hasAnyLinkedVideo) {
      closeContextMenu()
      return
    }
    updateSettings({ showMiniatures: !showMiniatures })
    closeContextMenu()
  }, [closeContextMenu, hasAnyLinkedVideo, showMiniatures, updateSettings])

  const handleToggleQuickActions = useCallback(() => {
    updateSettings({ showQuickActions: !showQuickActions })
    closeContextMenu()
  }, [closeContextMenu, showQuickActions, updateSettings])

  const handleShowMediaInfo = useCallback((clip: Clip) => {
    if (!clip.filePath) return
    setMediaInfoClip({ name: getClipPrimaryLabel(clip), path: clip.filePath })
    closeContextMenu()
  }, [closeContextMenu, setMediaInfoClip])

  const handleRemoveClip = useCallback((clip: Clip) => {
    requestClipDeletion(clip.id)
    closeContextMenu()
  }, [closeContextMenu, requestClipDeletion])

  return {
    closeContextMenu,
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
  }
}
