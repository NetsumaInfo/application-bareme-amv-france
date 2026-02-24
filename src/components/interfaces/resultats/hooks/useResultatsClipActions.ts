import { useCallback } from 'react'
import { emit } from '@tauri-apps/api/event'
import { usePlayerStore } from '@/store/usePlayerStore'
import * as tauri from '@/services/tauri'
import type { Clip } from '@/types/project'

interface UseResultatsClipActionsParams {
  clips: Clip[]
  setCurrentClip: (index: number) => void
  setShowPipVideo: (show: boolean) => void
}

export function useResultatsClipActions({
  clips,
  setCurrentClip,
  setShowPipVideo,
}: UseResultatsClipActionsParams) {
  const openClipInNotation = useCallback(async (clipId: string) => {
    const index = clips.findIndex((clip) => clip.id === clipId)
    if (index < 0) return

    const clip = clips[index]
    setCurrentClip(index)
    setShowPipVideo(true)
    try {
      const playerState = usePlayerStore.getState()
      if (clip.filePath) {
        if (!playerState.isLoaded || playerState.currentFilePath !== clip.filePath) {
          playerState.setLoaded(false)
          await tauri.playerLoad(clip.filePath)
          playerState.setLoaded(true, clip.filePath)
        }
      }
      await tauri.playerShow().catch(() => {})
      await tauri.playerSyncOverlay().catch(() => {})
    } catch (error) {
      console.error('Failed to open clip from results:', error)
    }
  }, [clips, setCurrentClip, setShowPipVideo])

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
  }, [clips, setCurrentClip, setShowPipVideo])

  return {
    openClipInNotation,
    jumpToTimecodeInNotation,
  }
}
