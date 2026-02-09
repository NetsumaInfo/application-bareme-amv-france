import { useCallback, useEffect, useRef } from 'react'
import { usePlayerStore } from '@/store/usePlayerStore'
import { useProjectStore } from '@/store/useProjectStore'
import * as tauri from '@/services/tauri'

export function usePlayer() {
  const store = usePlayerStore()
  const { clips, currentClipIndex } = useProjectStore()
  const currentClip = clips[currentClipIndex]
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Poll player status every 250ms
  useEffect(() => {
    // Muted by default - set volume to 0 on init
    tauri.playerSetVolume(0).catch(() => {})

    const poll = async () => {
      try {
        const status = await tauri.playerGetStatus()
        store.setPlaying(status.is_playing)
        store.setCurrentTime(status.current_time)
        store.setDuration(status.duration)
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
      store.setCurrentTime(position)
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
      store.setVolume(volume)
    } catch { /* ignore */ }
  }, [])

  const setMuted = useCallback((muted: boolean) => {
    store.setMuted(muted)
    const vol = muted ? 0 : usePlayerStore.getState().volume
    tauri.playerSetVolume(vol).catch(() => {})
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const current = usePlayerStore.getState().isFullscreen
    try {
      await tauri.playerSetFullscreen(!current)
      usePlayerStore.getState().setFullscreen(!current)
    } catch { /* ignore */ }
  }, [])

  return {
    ...store,
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
