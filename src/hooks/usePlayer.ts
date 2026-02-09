import { useCallback, useEffect, useRef } from 'react'
import { usePlayerStore } from '@/store/usePlayerStore'
import { useProjectStore } from '@/store/useProjectStore'
import * as tauri from '@/services/tauri'

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
        state.setPlaying(status.is_playing)
        state.setCurrentTime(status.current_time)
        state.setDuration(status.duration)
        state.setFullscreen(fullscreen)
      } catch {
        // Player not available
      }
    }

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
      usePlayerStore.getState().setVolume(volume)
    } catch { /* ignore */ }
  }, [])

  const setMuted = useCallback((muted: boolean) => {
    usePlayerStore.getState().setMuted(muted)
    const vol = muted ? 0 : usePlayerStore.getState().volume
    tauri.playerSetVolume(vol).catch(() => {})
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const current = usePlayerStore.getState().isFullscreen
    try {
      const next = !current
      await tauri.playerSetFullscreen(next)
      usePlayerStore.getState().setFullscreen(next)
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
    toggleFullscreen,
  }
}
