import { useCallback, useMemo } from 'react'
import { Play, Pause } from 'lucide-react'
import { emit } from '@tauri-apps/api/event'
import { usePlayer } from '@/hooks/usePlayer'
import { usePlayerStore } from '@/store/usePlayerStore'
import { useUIStore } from '@/store/useUIStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { buildNoteTimecodeMarkers, type NoteTimecodeMarker } from '@/utils/timecodes'
import * as tauri from '@/services/tauri'
import PlayerSeekBar from '@/components/player/PlayerSeekBar'
import PlayerMainControls from '@/components/player/PlayerMainControls'

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

  const isFullscreen = usePlayerStore((state) => state.isFullscreen)
  const showAudioDb = useUIStore((state) => state.showAudioDb)
  const setShowPipVideo = useUIStore((state) => state.setShowPipVideo)
  const currentBareme = useNotationStore((state) => state.currentBareme)
  const notes = useNotationStore((state) => state.notes)
  const { clips, currentClipIndex, currentProject, setClipThumbnailTime } = useProjectStore()

  const currentClip = clips[currentClipIndex]
  const currentNote = currentClip ? notes[currentClip.id] : undefined
  const miniaturesEnabled = Boolean(currentProject?.settings.showMiniatures)

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

  const handleSetMiniatureFrame = useCallback(async () => {
    if (!currentClip) return
    const status = await tauri.playerGetStatus().catch(() => null)
    const seconds = Number(status?.current_time)
    if (!Number.isFinite(seconds) || seconds < 0) return
    setClipThumbnailTime(currentClip.id, seconds)
  }, [currentClip, setClipThumbnailTime])

  const handleToggleMuted = () => {
    setMuted(!muted)
  }

  const handleSetVolume = (value: number) => {
    setVolume(value)
    if (muted) setMuted(false)
  }

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

        <div className="flex-1">
          <PlayerSeekBar
            compact
            currentTime={currentTime}
            duration={duration}
            isLoaded={isLoaded}
            noteMarkers={noteMarkers}
            onSeek={seek}
            onMarkerJump={(marker) => {
              handleMarkerJump(marker).catch(() => {})
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 px-2 py-1.5 bg-surface rounded-lg">
      <PlayerSeekBar
        compact={false}
        currentTime={currentTime}
        duration={duration}
        isLoaded={isLoaded}
        noteMarkers={noteMarkers}
        onSeek={seek}
        onMarkerJump={(marker) => {
          handleMarkerJump(marker).catch(() => {})
        }}
      />

      <PlayerMainControls
        isLoaded={isLoaded}
        isPlaying={isPlaying}
        muted={muted}
        volume={volume}
        isFullscreen={isFullscreen}
        showAudioDb={showAudioDb}
        miniaturesEnabled={miniaturesEnabled}
        onFrameBackStep={frameBackStep}
        onSeekBack={() => seekRelative(-5)}
        onTogglePause={togglePause}
        onSeekForward={() => seekRelative(5)}
        onFrameStep={frameStep}
        onToggleMuted={handleToggleMuted}
        onSetVolume={handleSetVolume}
        onScreenshot={screenshot}
        onSetMiniatureFrame={() => {
          handleSetMiniatureFrame().catch(() => {})
        }}
        onToggleFullscreen={toggleFullscreen}
      />
    </div>
  )
}
