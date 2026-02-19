import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { emit } from '@tauri-apps/api/event'
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Maximize2, Minimize2, X, ImagePlus } from 'lucide-react'
import { usePlayerStore } from '@/store/usePlayerStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { usePlayer } from '@/hooks/usePlayer'
import * as tauri from '@/services/tauri'
import { formatTime, getClipPrimaryLabel } from '@/utils/formatters'
import { buildNoteTimecodeMarkers, type NoteTimecodeMarker } from '@/utils/timecodes'
import SubtitleSelector from './SubtitleSelector'
import AudioTrackSelector from './AudioTrackSelector'

interface FloatingVideoPlayerProps {
  onClose: () => void
}

export function FloatingVideoPlayer({ onClose }: FloatingVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoAreaRef = useRef<HTMLDivElement | null>(null)
  const dragStartRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null)
  const panelWidth = typeof window !== 'undefined' ? Math.min(420, Math.max(260, window.innerWidth - 24)) : 320
  const videoHeight = Math.round(panelWidth * 0.5625)

  const [position, setPosition] = useState({
    left: typeof window !== 'undefined' ? Math.max(12, window.innerWidth - panelWidth - 16) : 0,
    top: 80,
  })

  const [isDragging, setIsDragging] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const {
    isPlaying,
    muted,
    isLoaded,
    currentTime,
    duration,
    togglePause,
    pause,
    seek,
    seekRelative,
    setMuted,
    toggleFullscreen,
    exitFullscreen,
    isFullscreen,
  } = usePlayer()
  const isDetached = usePlayerStore((state) => state.isDetached)
  const clips = useProjectStore((state) => state.clips)
  const currentClipIndex = useProjectStore((state) => state.currentClipIndex)
  const currentProject = useProjectStore((state) => state.currentProject)
  const setClipThumbnailTime = useProjectStore((state) => state.setClipThumbnailTime)
  const currentClip = clips[currentClipIndex]
  const currentBareme = useNotationStore((state) => state.currentBareme)
  const notes = useNotationStore((state) => state.notes)
  const currentNote = currentClip ? notes[currentClip.id] : undefined

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

    const el = videoAreaRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const x = Math.round(rect.left * dpr)
    const y = Math.round(rect.top * dpr)
    const w = Math.round(rect.width * dpr)
    const h = Math.round(rect.height * dpr)

    if (w > 0 && h > 0) {
      tauri.playerSetGeometry(x, y, w, h).catch(() => {})
    }
  }, [])

  const clampPosition = useCallback((nextLeft: number, nextTop: number) => {
    const maxLeft = Math.max(12, window.innerWidth - panelWidth - 12)
    const maxTop = Math.max(44, window.innerHeight - videoHeight - 64)
    return {
      left: Math.min(Math.max(12, nextLeft), maxLeft),
      top: Math.min(Math.max(44, nextTop), maxTop),
    }
  }, [panelWidth, videoHeight])

  useEffect(() => {
    const el = videoAreaRef.current
    if (!el) return

    const observer = new ResizeObserver(() => updateGeometry())
    observer.observe(el)
    window.addEventListener('resize', updateGeometry)
    updateGeometry()

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateGeometry)
    }
  }, [updateGeometry])

  useEffect(() => {
    if (!currentClip) return
    const timer = setInterval(updateGeometry, 200)
    return () => clearInterval(timer)
  }, [currentClip, updateGeometry])

  useEffect(() => {
    if (!currentClip?.filePath) {
      if (!usePlayerStore.getState().isDetached) {
        tauri.playerHide().catch(() => {})
      }
      return () => {}
    }

    const { isLoaded, currentFilePath } = usePlayerStore.getState()
    if (isLoaded && currentFilePath === currentClip.filePath) {
      tauri.playerShow().catch(() => {})
      updateGeometry()
      loadTracks().catch(() => {})
    } else {
      usePlayerStore.getState().setLoaded(false)
      tauri.playerLoad(currentClip.filePath)
        .then(() => {
          usePlayerStore.getState().setLoaded(true, currentClip.filePath)
          tauri.playerShow().catch(() => {})
          tauri.playerPlay().catch(() => {})
          loadTracks().catch(() => {})
          setTimeout(updateGeometry, 50)
        })
        .catch(console.error)
    }
  }, [currentClip?.filePath, updateGeometry, loadTracks])

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
    const handleResize = () => {
      setPosition((prev) => clampPosition(prev.left, prev.top))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [clampPosition])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && usePlayerStore.getState().isFullscreen) {
        exitFullscreen().catch(() => {})
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [exitFullscreen])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    dragStartRef.current = {
      x: position.left,
      y: position.top,
      startX: e.clientX,
      startY: e.clientY,
    }
    setIsDragging(true)
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStartRef.current) return

    const deltaX = e.clientX - dragStartRef.current.startX
    const deltaY = e.clientY - dragStartRef.current.startY

    setPosition(clampPosition(dragStartRef.current.x + deltaX, dragStartRef.current.y + deltaY))
  }, [clampPosition])

  const handleMouseUp = useCallback(() => {
    dragStartRef.current = null
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleClose = async () => {
    const store = usePlayerStore.getState()
    if (store.isFullscreen) {
      await tauri.playerSetFullscreen(false).catch(() => {})
    }
    tauri.playerHide().catch(() => {})
    onClose()
  }

  if (isDetached) {
    return null
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: `${position.left}px`,
        top: `${position.top}px`,
        width: `${panelWidth}px`,
        zIndex: 50,
      }}
      className="flex flex-col rounded-lg border border-gray-700 bg-black shadow-2xl overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Header Bar - Draggable */}
      <div
        onMouseDown={handleMouseDown}
        className={`flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800 px-3 py-1.5 cursor-move select-none ${
          isDragging ? 'opacity-100' : 'opacity-90 hover:opacity-100'
        }`}
      >
        <span className="text-[10px] font-medium text-gray-400">
          {isDetached ? 'Lecteur détaché' : currentClip ? getClipPrimaryLabel(currentClip) : 'Vidéo'}
        </span>
        {isHovering && (
          <button
            onClick={handleClose}
            className="flex items-center justify-center w-4 h-4 rounded hover:bg-gray-700 transition-colors"
            title="Fermer"
          >
            <X size={12} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* Video Container - mpv renders here */}
      <div
        ref={videoAreaRef}
        className="bg-black"
        style={{ width: `${panelWidth}px`, height: `${videoHeight}px` }}
      />

      <div className="bg-gray-900/90 px-2 py-1.5 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-gray-500 font-mono w-8 text-right">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              disabled={!isLoaded}
            />
            {duration > 0 && noteMarkers.length > 0 && (
              <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0">
                {noteMarkers.map((marker) => {
                  const left = Math.max(0, Math.min(100, (marker.seconds / duration) * 100))
                  return (
                    <button
                      key={marker.key}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkerJump(marker)
                      }}
                      className="pointer-events-auto absolute top-0 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border shadow-md hover:scale-110 transition-transform"
                      style={{
                        left: `${left}%`,
                        backgroundColor: marker.color,
                        borderColor: 'rgba(15,23,42,0.85)',
                      }}
                      title={marker.previewText
                        ? `${marker.raw} - ${marker.previewText}`
                        : `${marker.raw} - ${marker.category ?? 'Notes globales'}`}
                    />
                  )
                })}
              </div>
            )}
          </div>
          <span className="text-[9px] text-gray-500 font-mono w-8">
            {formatTime(duration)}
          </span>
        </div>

        {/* Mini Controls */}
        <div className="flex items-center justify-center gap-1 flex-wrap">
        <button
          onClick={() => seekRelative(-5)}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700 transition-colors"
          title="Reculer 5s"
          disabled={!isLoaded}
        >
          <SkipBack size={14} className="text-gray-300" />
        </button>

        <button
          onClick={togglePause}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700 transition-colors"
          title={isPlaying ? 'Pause' : 'Lecture'}
          disabled={!isLoaded}
        >
          {isPlaying ? (
            <Pause size={14} className="text-gray-300" />
          ) : (
            <Play size={14} className="text-gray-300" />
          )}
        </button>

        <button
          onClick={() => seekRelative(5)}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700 transition-colors"
          title="Avancer 5s"
          disabled={!isLoaded}
        >
          <SkipForward size={14} className="text-gray-300" />
        </button>

        <button
          onClick={() => setMuted(!muted)}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700 transition-colors"
          title={muted ? 'Activer le son' : 'Couper le son'}
        >
          {muted ? (
            <VolumeX size={14} className="text-gray-300" />
          ) : (
            <Volume2 size={14} className="text-gray-300" />
          )}
        </button>

        <SubtitleSelector />

        <AudioTrackSelector />

        <button
          onClick={toggleFullscreen}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700 transition-colors"
          title={isFullscreen ? 'Quitter le plein écran' : 'Agrandir'}
          disabled={!isLoaded}
        >
          {isFullscreen ? (
            <Minimize2 size={14} className="text-gray-300" />
          ) : (
            <Maximize2 size={14} className="text-gray-300" />
          )}
        </button>
        {miniaturesEnabled && (
          <button
            onClick={() => {
              handleSetMiniatureFrame().catch(() => {})
            }}
            className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700 transition-colors"
            title="Définir la frame miniature"
            disabled={!isLoaded}
          >
            <ImagePlus size={14} className="text-gray-300" />
          </button>
        )}
        </div>
      </div>
    </div>
  )
}
