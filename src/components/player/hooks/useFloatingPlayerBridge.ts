import { useCallback, useEffect, useMemo, type MutableRefObject } from 'react'
import { emit } from '@tauri-apps/api/event'
import { usePlayerStore } from '@/store/usePlayerStore'
import { buildNoteTimecodeMarkers, type NoteTimecodeMarker } from '@/utils/timecodes'
import type { Note } from '@/types/notation'
import type { Bareme } from '@/types/bareme'
import type { Clip, Project } from '@/types/project'
import * as tauri from '@/services/tauri'

interface UseFloatingPlayerBridgeOptions {
  videoAreaRef: MutableRefObject<HTMLDivElement | null>
  currentClip: Clip | undefined
  currentBareme: Bareme | null
  currentNote: Note | undefined
  currentProject: Project | null
  duration: number
  isLoaded: boolean
  position: { left: number; top: number }
  setClipThumbnailTime: (clipId: string, seconds: number | null) => void
  pause: () => Promise<void>
  seek: (seconds: number) => Promise<void>
  exitFullscreen: () => Promise<void>
  onClose: () => void
}

export function useFloatingPlayerBridge({
  videoAreaRef,
  currentClip,
  currentBareme,
  currentNote,
  currentProject,
  duration,
  isLoaded,
  position,
  setClipThumbnailTime,
  pause,
  seek,
  exitFullscreen,
  onClose,
}: UseFloatingPlayerBridgeOptions) {
  const noteMarkers = useMemo(() => {
    if (!currentClip || !currentBareme || duration <= 0) return []
    return buildNoteTimecodeMarkers(currentNote, currentBareme, duration).slice(0, 90)
  }, [currentClip, currentBareme, currentNote, duration])
  const miniaturesEnabled = Boolean(currentProject?.settings.showMiniatures)

  const handleSetMiniatureFrame = useCallback(async () => {
    if (!currentClip) return
    const status = await tauri.playerGetStatus().catch(() => null)
    const seconds = Number(status?.current_time)
    if (!Number.isFinite(seconds) || seconds < 0) return
    setClipThumbnailTime(currentClip.id, seconds)
  }, [currentClip, setClipThumbnailTime])

  const handleMarkerJump = useCallback(async (marker: NoteTimecodeMarker) => {
    if (!currentClip || !isLoaded) return
    await seek(marker.seconds)
    await pause()

    const payload = {
      clipId: currentClip.id,
      seconds: marker.seconds,
      category: marker.category ?? null,
      criterionId: marker.criterionId ?? null,
      source: marker.source,
      raw: marker.raw,
    }

    window.dispatchEvent(new CustomEvent('amv:focus-note-marker', { detail: payload }))
    emit('main:focus-note-marker', payload).catch(() => {})
  }, [currentClip, isLoaded, pause, seek])

  const loadTracks = useCallback(async () => {
    try {
      const tracks = await tauri.playerGetTracks()
      const store = usePlayerStore.getState()
      store.setSubtitleTracks(tracks.subtitle_tracks.map((track) => ({
        id: track.id,
        title: track.title ?? undefined,
        lang: track.lang ?? undefined,
        codec: track.codec ?? undefined,
        external: track.external,
      })))
      store.setAudioTracks(tracks.audio_tracks.map((track) => ({
        id: track.id,
        title: track.title ?? undefined,
        lang: track.lang ?? undefined,
        codec: track.codec ?? undefined,
        external: track.external,
      })))
      if (tracks.audio_tracks.length > 0) {
        store.setCurrentAudioId(tracks.audio_tracks[0].id)
      }
    } catch {
      // Ignore track loading failures
    }
  }, [])

  const updateGeometry = useCallback(() => {
    if (usePlayerStore.getState().isDetached) return

    const element = videoAreaRef.current
    if (!element) return

    const rect = element.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const x = Math.round(rect.left * dpr)
    const y = Math.round(rect.top * dpr)
    const w = Math.round(rect.width * dpr)
    const h = Math.round(rect.height * dpr)

    if (w > 0 && h > 0) {
      tauri.playerSetGeometry(x, y, w, h).catch(() => {})
    }
  }, [videoAreaRef])

  useEffect(() => {
    const element = videoAreaRef.current
    if (!element) return

    const observer = new ResizeObserver(() => updateGeometry())
    observer.observe(element)
    window.addEventListener('resize', updateGeometry)
    updateGeometry()

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateGeometry)
    }
  }, [updateGeometry, videoAreaRef])

  useEffect(() => {
    if (!currentClip) return
    const timer = setInterval(updateGeometry, 200)
    return () => clearInterval(timer)
  }, [currentClip, updateGeometry])

  useEffect(() => {
    if (!currentClip?.filePath) {
      usePlayerStore.getState().setLoaded(false)
      tauri.playerPause().catch(() => {})
      tauri.playerStop().catch(() => {})
      return
    }

    const store = usePlayerStore.getState()
    if (store.isLoaded && store.currentFilePath === currentClip.filePath) {
      tauri.playerShow().catch(() => {})
      updateGeometry()
      loadTracks().catch(() => {})
    } else {
      store.setLoaded(false)
      tauri.playerLoad(currentClip.filePath)
        .then(() => {
          const nextStore = usePlayerStore.getState()
          nextStore.setLoaded(true, currentClip.filePath)
          tauri.playerShow().catch(() => {})
          tauri.playerPlay().catch(() => {})
          loadTracks().catch(() => {})
          setTimeout(updateGeometry, 50)
        })
        .catch(console.error)
    }
  }, [currentClip?.filePath, loadTracks, updateGeometry])

  useEffect(() => {
    return () => {
      const store = usePlayerStore.getState()
      if (!store.isDetached && !store.isFullscreen) {
        tauri.playerHide().catch(() => {})
      }
    }
  }, [])

  useEffect(() => {
    updateGeometry()
  }, [position.left, position.top, updateGeometry])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && usePlayerStore.getState().isFullscreen) {
        exitFullscreen().catch(() => {})
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [exitFullscreen])

  const handleClose = useCallback(async () => {
    const store = usePlayerStore.getState()
    if (store.isFullscreen) {
      await tauri.playerSetFullscreen(false).catch(() => {})
    }
    tauri.playerHide().catch(() => {})
    onClose()
  }, [onClose])

  return {
    noteMarkers,
    miniaturesEnabled,
    handleSetMiniatureFrame,
    handleMarkerJump,
    handleClose,
  }
}
