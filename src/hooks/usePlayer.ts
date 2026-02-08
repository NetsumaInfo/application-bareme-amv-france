import { useCallback, useEffect, useRef } from 'react'
import { usePlayerStore } from '@/store/usePlayerStore'
import { useProjectStore } from '@/store/useProjectStore'
import * as tauri from '@/services/tauri'

export function usePlayer() {
  const store = usePlayerStore()
  const { clips, currentClipIndex } = useProjectStore()
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentClip = clips[currentClipIndex]

  const fetchTracks = useCallback(async () => {
    try {
      const tracks = await tauri.playerGetTracks()
      store.setSubtitleTracks(
        tracks.subtitle_tracks.map((t) => ({
          id: t.id,
          lang: t.lang ?? undefined,
          title: t.title ?? undefined,
          codec: t.codec ?? undefined,
          external: t.external,
        })),
      )
      store.setAudioTracks(
        tracks.audio_tracks.map((t) => ({
          id: t.id,
          lang: t.lang ?? undefined,
          title: t.title ?? undefined,
          codec: t.codec ?? undefined,
        })),
      )
    } catch {
      // Tracks not available
    }
  }, [])

  const loadVideo = useCallback(async (path: string) => {
    try {
      await tauri.playerLoad(path)
      store.setLoaded(true, path)
      // Start polling for status updates
      startPolling()
      // Fetch tracks after a short delay to let mpv parse them
      setTimeout(fetchTracks, 500)
    } catch (e) {
      console.error('Failed to load video:', e)
      store.setLoaded(false)
    }
  }, [])

  const play = useCallback(async () => {
    try {
      await tauri.playerPlay()
      store.setPlaying(true)
    } catch (e) {
      console.error('Failed to play:', e)
    }
  }, [])

  const pause = useCallback(async () => {
    try {
      await tauri.playerPause()
      store.setPlaying(false)
    } catch (e) {
      console.error('Failed to pause:', e)
    }
  }, [])

  const togglePause = useCallback(async () => {
    try {
      await tauri.playerTogglePause()
      store.setPlaying(!store.isPlaying)
    } catch (e) {
      console.error('Failed to toggle pause:', e)
    }
  }, [store.isPlaying])

  const seek = useCallback(async (position: number) => {
    try {
      await tauri.playerSeek(position)
      store.setCurrentTime(position)
    } catch (e) {
      console.error('Failed to seek:', e)
    }
  }, [])

  const seekRelative = useCallback(async (offset: number) => {
    try {
      await tauri.playerSeekRelative(offset)
    } catch (e) {
      console.error('Failed to seek relative:', e)
    }
  }, [])

  const setVolume = useCallback(async (volume: number) => {
    try {
      await tauri.playerSetVolume(volume)
      store.setVolume(volume)
    } catch (e) {
      console.error('Failed to set volume:', e)
    }
  }, [])

  const setSpeed = useCallback(async (speed: number) => {
    try {
      await tauri.playerSetSpeed(speed)
      store.setPlaybackSpeed(speed)
    } catch (e) {
      console.error('Failed to set speed:', e)
    }
  }, [])

  const pollStatus = useCallback(async () => {
    try {
      const status = await tauri.playerGetStatus()
      store.setPlaying(status.is_playing)
      store.setCurrentTime(status.current_time)
      store.setDuration(status.duration)
    } catch {
      // Silently ignore polling errors
    }
  }, [])

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(pollStatus, 250)
  }, [pollStatus])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  // Load current clip when it changes
  useEffect(() => {
    if (currentClip?.filePath) {
      loadVideo(currentClip.filePath)
    }
    return () => stopPolling()
  }, [currentClip?.filePath])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling()
  }, [])

  return {
    ...store,
    currentClip,
    loadVideo,
    play,
    pause,
    togglePause,
    seek,
    seekRelative,
    setVolume,
    setSpeed,
  }
}
