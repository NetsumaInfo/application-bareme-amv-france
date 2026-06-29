import { useCallback, useEffect, useRef } from 'react'
import { usePlayerStore } from '@/store/usePlayerStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import * as tauri from '@/services/tauri'
import { usePlayerStatusPolling } from '@/hooks/usePlayerStatusPolling'
import { buildScreenshotName } from '@/utils/screenshot'

export function usePlayer() {
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const playbackSpeed = usePlayerStore((s) => s.playbackSpeed)
  const isLoaded = usePlayerStore((s) => s.isLoaded)
  const currentFilePath = usePlayerStore((s) => s.currentFilePath)
  const subtitleTracks = usePlayerStore((s) => s.subtitleTracks)
  const audioTracks = usePlayerStore((s) => s.audioTracks)
  const currentSubtitleId = usePlayerStore((s) => s.currentSubtitleId)
  const currentAudioId = usePlayerStore((s) => s.currentAudioId)
  const isFullscreen = usePlayerStore((s) => s.isFullscreen)
  const clips = useProjectStore((s) => s.clips)
  const currentClipIndex = useProjectStore((s) => s.currentClipIndex)
  const currentClip = clips[currentClipIndex]
  const lastNonZeroVolumeRef = useRef(80)
  const muteOnStart = useUIStore((s) => s.muteOnStart)
  const showAudioDb = useUIStore((s) => s.showAudioDb)
  const settingsHydrated = useUIStore((s) => s.settingsHydrated)
  const startupAppliedRef = useRef(false)

  useEffect(() => {
    if (volume > 0.001) {
      lastNonZeroVolumeRef.current = volume
    }
  }, [volume])

  useEffect(() => {
    // Apply startup audio state once persisted prefs are loaded, so the
    // "muet au démarrage" preference is honored instead of always muting.
    if (!settingsHydrated || startupAppliedRef.current) return
    startupAppliedRef.current = true
    const startVolume = muteOnStart ? 0 : 80
    tauri.playerSetVolume(startVolume).catch(() => {})
    const state = usePlayerStore.getState()
    state.setVolume(startVolume)
    state.setMuted(startVolume <= 0.001)
    // Re-apply the (opt-in) dB-meter filter to match the restored preference.
    tauri.playerSetAudioMeter(showAudioDb).catch(() => {})
  }, [settingsHydrated, muteOnStart, showAudioDb])

  usePlayerStatusPolling((status, fullscreen) => {
    const state = usePlayerStore.getState()
    state.syncStatus({
      isPlaying: status.is_playing,
      currentTime: status.current_time,
      duration: status.duration,
      volume: status.volume,
      isFullscreen: fullscreen,
    })
  }, { ultraSnap: true })

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
