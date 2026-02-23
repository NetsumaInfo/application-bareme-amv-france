import { useCallback } from 'react'
import { emit } from '@tauri-apps/api/event'
import { usePlayerStore } from '@/store/usePlayerStore'
import * as tauri from '@/services/tauri'
import type { Clip } from '@/types/project'

interface UseResultatsClipActionsParams {
  clips: Clip[]
  setCurrentClip: (index: number) => void
  setShowPipVideo: (show: boolean) => void
  switchInterface: (next: 'spreadsheet' | 'modern') => void
  switchTab: (tab: 'notation' | 'resultats' | 'export') => void
}

export function useResultatsClipActions({
  clips,
  setCurrentClip,
  setShowPipVideo,
  switchInterface,
  switchTab,
}: UseResultatsClipActionsParams) {
  const openClipInNotation = useCallback((clipId: string) => {
    const index = clips.findIndex((clip) => clip.id === clipId)
    if (index < 0) return

    setCurrentClip(index)
    setShowPipVideo(true)
    switchInterface('spreadsheet')
    switchTab('notation')

    tauri.playerShow()
      .then(() => tauri.playerSyncOverlay().catch(() => {}))
      .catch(() => {})

    setTimeout(() => {
      tauri.playerSyncOverlay().catch(() => {})
    }, 120)
  }, [clips, setCurrentClip, setShowPipVideo, switchInterface, switchTab])

  const jumpToTimecodeInNotation = useCallback(async (
    clipId: string,
    seconds: number,
    payload?: { category?: string | null; criterionId?: string | null },
  ) => {
    if (!Number.isFinite(seconds) || seconds < 0) return

    const index = clips.findIndex((clip) => clip.id === clipId)
    if (index < 0) return

    const clip = clips[index]
    if (!clip?.filePath) return

    setCurrentClip(index)
    setShowPipVideo(true)
    switchInterface('spreadsheet')
    switchTab('notation')

    const playerState = usePlayerStore.getState()
    try {
      if (!playerState.isLoaded || playerState.currentFilePath !== clip.filePath) {
        playerState.setLoaded(false)
        await tauri.playerLoad(clip.filePath)
        playerState.setLoaded(true, clip.filePath)
      }
      await tauri.playerShow().catch(() => {})
      await tauri.playerSeek(seconds)
      await tauri.playerPause().catch(() => {})
    } catch (error) {
      console.error('Failed to jump to timecode from results:', error)
    }

    const detail = {
      clipId,
      seconds,
      category: payload?.category ?? null,
      criterionId: payload?.criterionId ?? null,
    }
    window.dispatchEvent(new CustomEvent('amv:focus-note-marker', { detail }))
    emit('main:focus-note-marker', detail).catch(() => {})
  }, [clips, setCurrentClip, setShowPipVideo, switchInterface, switchTab])

  return {
    openClipInNotation,
    jumpToTimecodeInNotation,
  }
}
