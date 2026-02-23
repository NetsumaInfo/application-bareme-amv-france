import { useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import * as tauri from '@/services/tauri'
import { getClipPrimaryLabel } from '@/utils/formatters'
import type { Clip, Project } from '@/types/project'

interface UseSpreadsheetContextMenuHandlersOptions {
  clips: Clip[]
  showMiniatures: boolean
  updateSettings: (settings: Partial<Project['settings']>) => void
  setClipScored: (clipId: string, scored: boolean) => void
  setCurrentClip: (index: number) => void
  setNotesDetached: (detached: boolean) => void
  handleAttachVideoToClip: (clipId: string) => Promise<void>
  setMiniatureFromCurrentFrame: (clipId: string) => Promise<void>
  setContextMenu: Dispatch<SetStateAction<{ clipId: string; x: number; y: number } | null>>
  setMediaInfoClip: Dispatch<SetStateAction<{ name: string; path: string } | null>>
}

export function useSpreadsheetContextMenuHandlers({
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
}: UseSpreadsheetContextMenuHandlersOptions) {
  const setClipThumbnailTime = useProjectStore((state) => state.setClipThumbnailTime)
  const removeClip = useProjectStore((state) => state.removeClip)

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

  const handleSetMiniatureFromCurrentFrame = useCallback((clip: Clip) => {
    setMiniatureFromCurrentFrame(clip.id).catch(() => {})
    closeContextMenu()
  }, [closeContextMenu, setMiniatureFromCurrentFrame])

  const handleResetMiniature = useCallback((clip: Clip) => {
    setClipThumbnailTime(clip.id, null)
    closeContextMenu()
  }, [closeContextMenu, setClipThumbnailTime])

  const handleToggleMiniatures = useCallback(() => {
    updateSettings({ showMiniatures: !showMiniatures })
    closeContextMenu()
  }, [closeContextMenu, showMiniatures, updateSettings])

  const handleShowMediaInfo = useCallback((clip: Clip) => {
    if (!clip.filePath) return
    setMediaInfoClip({ name: getClipPrimaryLabel(clip), path: clip.filePath })
    closeContextMenu()
  }, [closeContextMenu, setMediaInfoClip])

  const handleRemoveClip = useCallback((clip: Clip) => {
    removeClip(clip.id)
    closeContextMenu()
  }, [closeContextMenu, removeClip])

  return {
    closeContextMenu,
    handleToggleScored,
    handleOpenNotes,
    handleAttachVideo,
    handleSetMiniatureFromCurrentFrame,
    handleResetMiniature,
    handleToggleMiniatures,
    handleShowMediaInfo,
    handleRemoveClip,
  }
}
