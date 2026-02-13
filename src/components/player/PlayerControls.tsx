import { useCallback, useMemo } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Minimize2, ChevronLeft, ChevronRight, Camera } from 'lucide-react'
import { emit } from '@tauri-apps/api/event'
import { usePlayer } from '@/hooks/usePlayer'
import { usePlayerStore } from '@/store/usePlayerStore'
import { useUIStore } from '@/store/useUIStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { formatTime } from '@/utils/formatters'
import { buildNoteTimecodeMarkers, type NoteTimecodeMarker } from '@/utils/timecodes'
import SubtitleSelector from './SubtitleSelector'
import AudioTrackSelector from './AudioTrackSelector'
import AudioDbMeter from './AudioDbMeter'

interface PlayerControlsProps {
  compact?: boolean
}

export default function PlayerControls({ compact }: PlayerControlsProps) {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    isLoaded,
    togglePause,
    pause,
    seek,
    seekRelative,
    setVolume,
    setMuted,
    toggleFullscreen,
    frameStep,
    frameBackStep,
    screenshot,
  } = usePlayer()
  const isFullscreen = usePlayerStore((s) => s.isFullscreen)
  const showAudioDb = useUIStore((s) => s.showAudioDb)
  const setShowPipVideo = useUIStore((s) => s.setShowPipVideo)
  const currentBareme = useNotationStore((s) => s.currentBareme)
  const notes = useNotationStore((s) => s.notes)
  const { clips, currentClipIndex } = useProjectStore()
  const currentClip = clips[currentClipIndex]
  const currentNote = currentClip ? notes[currentClip.id] : undefined

  const noteMarkers = useMemo(() => {
    if (!currentClip || !currentBareme || duration <= 0) return []
    return buildNoteTimecodeMarkers(currentNote, currentBareme, duration).slice(0, 90)
  }, [currentClip, currentBareme, currentNote, duration])

  const handleMarkerJump = useCallback(async (marker: NoteTimecodeMarker) => {
    if (!currentClip || !isLoaded) return
    setShowPipVideo(true)
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
  }, [currentClip, isLoaded, pause, seek, setShowPipVideo])

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-1">
        <button
          onClick={togglePause}
          className="p-1 rounded-full bg-primary-600 hover:bg-primary-500 text-white transition-colors"
          disabled={!isLoaded}
        >
          {isPlaying ? <Pause size={10} /> : <Play size={10} />}
        </button>
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
                    className="pointer-events-auto absolute top-0 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border shadow-sm hover:scale-110 transition-transform"
                    style={{
                      left: `${left}%`,
                      backgroundColor: marker.color,
                      borderColor: 'rgba(15,23,42,0.8)',
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
        <span className="text-[8px] text-gray-500 font-mono w-7 text-right shrink-0">
          {formatTime(currentTime)}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 px-2 py-1.5 bg-surface rounded-lg">
      {/* Seek bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-400 w-10 text-right font-mono">
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
                    className="pointer-events-auto absolute top-0 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border shadow-sm hover:scale-110 transition-transform"
                    style={{
                      left: `${left}%`,
                      backgroundColor: marker.color,
                      borderColor: 'rgba(15,23,42,0.8)',
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
        <span className="text-[10px] text-gray-400 w-10 font-mono">
          {formatTime(duration)}
        </span>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={frameBackStep}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
            disabled={!isLoaded}
            title="Image précédente (,)"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => seekRelative(-5)}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
            disabled={!isLoaded}
            title="- 5s"
          >
            <SkipBack size={14} />
          </button>
          <button
            onClick={togglePause}
            className="p-1.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white transition-colors"
            disabled={!isLoaded}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={() => seekRelative(5)}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
            disabled={!isLoaded}
            title="+ 5s"
          >
            <SkipForward size={14} />
          </button>
          <button
            onClick={frameStep}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
            disabled={!isLoaded}
            title="Image suivante (.)"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Volume */}
          <button
            onClick={() => setMuted(!muted)}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
          >
            {muted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={muted ? 0 : volume}
            onChange={(e) => {
              setVolume(Number(e.target.value))
              if (muted) setMuted(false)
            }}
            className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />

          <AudioDbMeter enabled={showAudioDb} compact className="ml-1" />

          {/* Subtitles */}
          <SubtitleSelector />

          {/* Audio tracks */}
          <AudioTrackSelector />

          {/* Screenshot */}
          <button
            onClick={screenshot}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
            disabled={!isLoaded}
            title="Capture d'écran (Ctrl+Shift+S)"
          >
            <Camera size={14} />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors ml-1"
            disabled={!isLoaded}
            title={isFullscreen ? 'Quitter le plein écran (F11)' : 'Plein écran (F11)'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}
