import { useCallback, useEffect, useRef, useState } from 'react'
import type { Clip, Project } from '@/types/project'
import * as tauri from '@/services/tauri'

interface SpreadsheetContextMenuState {
  clipId: string
  x: number
  y: number
}

interface UseSpreadsheetContextActionsOptions {
  clips: Clip[]
  currentClipIndex: number
  currentProject: Project | null
  setShowPipVideo: (show: boolean) => void
  updateSettings: (settings: Partial<Project['settings']>) => void
  setClipThumbnailTime: (clipId: string, seconds: number | null) => void
}

export function useSpreadsheetContextActions({
  clips,
  currentClipIndex,
  currentProject,
  setShowPipVideo,
  updateSettings,
  setClipThumbnailTime,
}: UseSpreadsheetContextActionsOptions) {
  const [contextMenu, setContextMenu] = useState<SpreadsheetContextMenuState | null>(null)
  const contextMenuRef = useRef<HTMLDivElement | null>(null)

  const openClipContextMenu = useCallback((clipId: string, x: number, y: number) => {
    const width = 210
    const height = 248
    const paddedX = Math.max(8, Math.min(x, window.innerWidth - width - 8))
    const paddedY = Math.max(8, Math.min(y, window.innerHeight - height - 8))
    setContextMenu({ clipId, x: paddedX, y: paddedY })
  }, [])

  useEffect(() => {
    if (!contextMenu) return
    const handleClick = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [contextMenu])

  const openPlayerAtFront = useCallback(() => {
    const targetClip = clips[currentClipIndex]
    if (!targetClip?.filePath) return
    setShowPipVideo(true)
    tauri.playerShow()
      .then(() => tauri.playerSyncOverlay().catch(() => {}))
      .catch(() => {})
    setTimeout(() => {
      tauri.playerSyncOverlay().catch(() => {})
    }, 120)
  }, [clips, currentClipIndex, setShowPipVideo])

  const setMiniatureFromCurrentFrame = useCallback(async (clipId: string) => {
    const target = clips.find((clip) => clip.id === clipId)
    if (!target?.filePath) return
    if (!currentProject?.settings.showMiniatures) {
      updateSettings({ showMiniatures: true })
    }
    const status = await tauri.playerGetStatus().catch(() => null)
    const seconds = Number(status?.current_time)
    if (!Number.isFinite(seconds) || seconds < 0) return
    setClipThumbnailTime(clipId, seconds)
  }, [clips, currentProject?.settings.showMiniatures, setClipThumbnailTime, updateSettings])

  return {
    contextMenu,
    setContextMenu,
    contextMenuRef,
    openClipContextMenu,
    openPlayerAtFront,
    setMiniatureFromCurrentFrame,
  }
}
