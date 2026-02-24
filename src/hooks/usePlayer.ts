import { useCallback, useEffect, useRef } from 'react'
import { usePlayerStore } from '@/store/usePlayerStore'
import { useProjectStore } from '@/store/useProjectStore'
import * as tauri from '@/services/tauri'
import { buildScreenshotName } from '@/utils/screenshot'

export function usePlayer() {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    playbackSpeed,
    isLoaded,
    currentFilePath,
    subtitleTracks,
    audioTracks,
    currentSubtitleId,
    currentAudioId,
    isFullscreen,
  } = usePlayerStore()
  const { clips, currentClipIndex } = useProjectStore()
  const currentClip = clips[currentClipIndex]
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastNonZeroVolumeRef = useRef(80)

  useEffect(() => {
    if (volume > 0.001) {
      lastNonZeroVolumeRef.current = volume
    }
  }, [volume])

  // Poll player status every 250ms
  useEffect(() => {
    // Muted by default - set volume to 0 on init
    tauri.playerSetVolume(0).catch(() => {})

    const poll = async () => {
      try {
        const [status, fullscreen] = await Promise.all([
          tauri.playerGetStatus(),
          tauri.playerIsFullscreen().catch(() => false),
        ])
        const state = usePlayerStore.getState()
        state.syncStatus({
          isPlaying: status.is_playing,
          currentTime: status.current_time,
          duration: status.duration,
          volume: status.volume,
          isFullscreen: fullscreen,
        })
      } catch {
        // Player not available
      }
    }

    poll()
    pollRef.current = setInterval(poll, 250)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const togglePause = useCallback(async () => {
    try {
      await tauri.playerTogglePause()
    } catch { /* ignore */ }
  }, [])

  const play = useCallback(async () => {
    try {
      await tauri.playerPlay()
    } catch { /* ignore */ }
  }, [])

  const pause = useCallback(async () => {
    try {
      await tauri.playerPause()
    } catch { /* ignore */ }
  }, [])

  const seek = useCallback(async (position: number) => {
    try {
      await tauri.playerSeek(position)
      usePlayerStore.getState().setCurrentTime(position)
    } catch { /* ignore */ }
  }, [])

  const seekRelative = useCallback(async (offset: number) => {
    try {
      await tauri.playerSeekRelative(offset)
    } catch { /* ignore */ }
  }, [])

  const setVolume = useCallback(async (volume: number) => {
    try {
      await tauri.playerSetVolume(volume)
      const state = usePlayerStore.getState()
      state.setVolume(volume)
      state.setMuted(volume <= 0.001)
    } catch { /* ignore */ }
  }, [])

  const setMuted = useCallback((muted: boolean) => {
    const state = usePlayerStore.getState()
    state.setMuted(muted)
    const vol = muted ? 0 : Math.max(1, lastNonZeroVolumeRef.current)
    if (!muted) state.setVolume(vol)
    tauri.playerSetVolume(vol).catch(() => {})
  }, [])

  const setFullscreen = useCallback(async (next: boolean) => {
    try {
      await tauri.playerSetFullscreen(next)
      usePlayerStore.getState().setFullscreen(next)
    } catch { /* ignore */ }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    await setFullscreen(!usePlayerStore.getState().isFullscreen)
  }, [setFullscreen])

  const exitFullscreen = useCallback(async () => {
    await setFullscreen(false)
  }, [setFullscreen])

  const frameStep = useCallback(async () => {
    try {
      await tauri.playerFrameStep()
    } catch { /* ignore */ }
  }, [])

  const frameBackStep = useCallback(async () => {
    try {
      await tauri.playerFrameBackStep()
    } catch { /* ignore */ }
  }, [])

  const screenshot = useCallback(async () => {
    try {
      const { clips: allClips, currentClipIndex: idx } = useProjectStore.getState()
      const clip = allClips[idx]
      const defaultName = buildScreenshotName('video', clip ? clip.displayName : undefined)
      const path = await tauri.saveScreenshotDialog(defaultName)
      if (path) await tauri.playerScreenshot(path)
    } catch { /* ignore */ }
  }, [])

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    playbackSpeed,
    isLoaded,
    currentFilePath,
    subtitleTracks,
    audioTracks,
    currentSubtitleId,
    currentAudioId,
    isFullscreen,
    currentClip,
    play,
    pause,
    togglePause,
    seek,
    seekRelative,
    setVolume,
    setMuted,
    setFullscreen,
    exitFullscreen,
    toggleFullscreen,
    frameStep,
    frameBackStep,
    screenshot,
  }
}
