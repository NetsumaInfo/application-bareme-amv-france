import { useState, useRef, useCallback, useMemo, useEffect, type ChangeEvent } from 'react'
import { emit, listen } from '@tauri-apps/api/event'
import * as tauri from '@/services/tauri'
import { useUIStore } from '@/store/useUIStore'
import { useOverlayShortcutBindings } from '@/components/player/overlay/useOverlayShortcutBindings'
import { useOverlayViewport } from '@/components/player/overlay/useOverlayViewport'
import { useOverlayPlayerStatus } from '@/components/player/overlay/useOverlayPlayerStatus'
import { useOverlayClipMarkers } from '@/components/player/overlay/useOverlayClipMarkers'
import { useOverlayControlVisibility } from '@/components/player/overlay/useOverlayControlVisibility'
import { useOverlayTracks } from '@/components/player/overlay/useOverlayTracks'
import { useOverlayKeyboardShortcuts } from '@/components/player/overlay/useOverlayKeyboardShortcuts'
import type { OverlayTimecodeMarker } from '@/components/player/overlay/types'

const AUDIO_DB_UPDATED_EVENT = 'ui:audio-db-updated'

export function useFullscreenOverlayState() {
  const shortcutBindings = useOverlayShortcutBindings()
  const { compactControls, tinyControls } = useOverlayViewport()
  const {
    isPlayerFullscreen,
    isPlaying,
    currentTime,
    duration,
    volume: liveVolume,
    setCurrentTime,
  } = useOverlayPlayerStatus()
  const {
    controlsVisible,
    resetHideTimer,
  } = useOverlayControlVisibility({ isPlayerFullscreen })

  const [markerTooltip, setMarkerTooltip] = useState<{ left: number; text: string } | null>(null)
  const showAudioDb = useUIStore((state) => state.showAudioDb)
  const lastNonZeroVolumeRef = useRef(80)
  const volume = Number.isFinite(liveVolume) ? Math.max(0, Math.min(100, liveVolume)) : 0
  const isMuted = volume <= 0.001

  useEffect(() => {
    if (volume > 0.001) {
      lastNonZeroVolumeRef.current = volume
    }
  }, [volume])

  useEffect(() => {
    let active = true
    tauri.loadUserSettings().then((data) => {
      if (!active || !data || typeof data !== 'object') return
      const settings = data as Record<string, unknown>
      if (typeof settings.showAudioDb === 'boolean') {
        useUIStore.setState({ showAudioDb: settings.showAudioDb })
      }
    }).catch(() => {})
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let unlisten: (() => void) | null = null
    listen<{ enabled?: boolean }>(AUDIO_DB_UPDATED_EVENT, (event) => {
      const enabled = event.payload?.enabled
      if (typeof enabled === 'boolean') {
        useUIStore.setState({ showAudioDb: enabled })
      }
    })
      .then((off) => {
        unlisten = off
      })
      .catch(() => {})

    return () => {
      if (unlisten) unlisten()
    }
  }, [])

  const {
    subtitleTracks,
    audioTracks,
    currentSubtitleId,
    currentAudioId,
    subMenuOpen,
    audioMenuOpen,
    subRef,
    audioRef,
    setSubMenuOpen,
    setAudioMenuOpen,
    refreshTracks,
    handleSelectSubtitle,
    handleSelectAudio,
  } = useOverlayTracks({ resetHideTimer })

  const {
    clipInfo,
    noteMarkers,
    overlayClipId,
  } = useOverlayClipMarkers({ refreshTracks })

  useOverlayKeyboardShortcuts({
    shortcutBindings,
    isPlayerFullscreen,
    clipName: clipInfo.name,
    onResetHideTimer: resetHideTimer,
  })

  const handleTogglePause = useCallback(() => {
    tauri.playerTogglePause().catch(() => {})
    resetHideTimer()
  }, [resetHideTimer])

  const handleSeek = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const position = Number(event.target.value)
    tauri.playerSeek(position).catch(() => {})
    setCurrentTime(position)
    resetHideTimer()
  }, [resetHideTimer, setCurrentTime])

  const handleSeekRelative = useCallback((offset: number) => {
    tauri.playerSeekRelative(offset).catch(() => {})
    resetHideTimer()
  }, [resetHideTimer])

  const handleSetVolume = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextVolume = Number(event.target.value)
    if (Number.isFinite(nextVolume) && nextVolume > 0.001) {
      lastNonZeroVolumeRef.current = nextVolume
    }
    tauri.playerSetVolume(nextVolume).catch(() => {})
    resetHideTimer()
  }, [resetHideTimer])

  const handleToggleMute = useCallback(() => {
    const nextVolume = isMuted ? lastNonZeroVolumeRef.current : 0
    tauri.playerSetVolume(nextVolume).catch(() => {})
    resetHideTimer()
  }, [isMuted, resetHideTimer])

  const handleExitFullscreen = useCallback(() => {
    tauri.playerSetFullscreen(false).catch(() => {})
  }, [])

  const handleToggleFullscreen = useCallback(() => {
    tauri.playerSetFullscreen(!isPlayerFullscreen).catch(() => {})
    resetHideTimer()
  }, [isPlayerFullscreen, resetHideTimer])

  const handleClosePlayerWindow = useCallback(() => {
    tauri.playerSetFullscreen(false).catch(() => {})
    tauri.playerHide().catch(() => {})
    emit('overlay:close-player').catch(() => {})
  }, [])

  const handleMarkerJump = useCallback((marker: OverlayTimecodeMarker) => {
    tauri.playerSeek(marker.seconds).catch(() => {})
    tauri.playerPause().catch(() => {})
    setCurrentTime(marker.seconds)
    emit('overlay:focus-note-marker', {
      clipId: overlayClipId,
      seconds: marker.seconds,
      category: marker.category ?? null,
      criterionId: marker.criterionId ?? null,
      source: marker.source ?? null,
      raw: marker.raw,
    }).catch(() => {})
    resetHideTimer()
  }, [overlayClipId, resetHideTimer, setCurrentTime])

  const visibleMarkers = useMemo(() => {
    if (!(duration > 0) || noteMarkers.length === 0) return []
    return noteMarkers.filter((marker) => Number.isFinite(marker.seconds) && marker.seconds >= 0 && marker.seconds <= duration)
  }, [noteMarkers, duration])

  const handleNextClip = useCallback(() => {
    emit('overlay:next-clip').catch(() => {})
    resetHideTimer()
  }, [resetHideTimer])

  const handlePrevClip = useCallback(() => {
    emit('overlay:prev-clip').catch(() => {})
    resetHideTimer()
  }, [resetHideTimer])

  return {
    clipInfo,
    compactControls,
    controlsVisible,
    currentAudioId,
    currentSubtitleId,
    currentTime,
    duration,
    isMuted,
    isPlayerFullscreen,
    isPlaying,
    markerTooltip,
    setMarkerTooltip,
    showAudioDb,
    subtitleTracks,
    audioTracks,
    subMenuOpen,
    audioMenuOpen,
    subRef,
    audioRef,
    tinyControls,
    visibleMarkers,
    volume,
    setSubMenuOpen,
    setAudioMenuOpen,
    handleSelectSubtitle,
    handleSelectAudio,
    handleSeek,
    handleMarkerJump,
    handlePrevClip,
    handleNextClip,
    handleSeekRelative,
    handleTogglePause,
    handleToggleMute,
    handleSetVolume,
    handleExitFullscreen,
    handleToggleFullscreen,
    handleClosePlayerWindow,
    resetHideTimer,
  }
}
