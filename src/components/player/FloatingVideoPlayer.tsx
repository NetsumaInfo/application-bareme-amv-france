import { useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import { usePlayerStore } from '@/store/usePlayerStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import { usePlayer } from '@/hooks/usePlayer'
import { useFloatingPlayerDrag } from '@/components/player/hooks/useFloatingPlayerDrag'
import { useFloatingPlayerBridge } from '@/components/player/hooks/useFloatingPlayerBridge'
import { getClipPrimaryLabel } from '@/utils/formatters'
import { FloatingPlayerHeader } from '@/components/player/floating/FloatingPlayerHeader'
import { FloatingPlayerTimeline } from '@/components/player/floating/FloatingPlayerTimeline'
import { FloatingPlayerControls } from '@/components/player/floating/FloatingPlayerControls'

interface FloatingVideoPlayerProps {
  onClose: () => void
}

export function FloatingVideoPlayer({ onClose }: FloatingVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoAreaRef = useRef<HTMLDivElement | null>(null)
  const {
    panelWidth,
    videoHeight,
    position,
    isDragging,
    isHovering,
    setIsHovering,
    handleMouseDown,
  } = useFloatingPlayerDrag()

  const {
    isPlaying,
    muted,
    isLoaded,
    currentTime,
    duration,
    togglePause,
    seek,
    seekRelative,
    setMuted,
    toggleFullscreen,
    pause,
    exitFullscreen,
    isFullscreen,
  } = usePlayer()
  const isDetached = usePlayerStore((state) => state.isDetached)
  const clips = useProjectStore((state) => state.clips)
  const currentClipIndex = useProjectStore((state) => state.currentClipIndex)
  const currentProject = useProjectStore((state) => state.currentProject)
  const showAudioDb = useUIStore((state) => state.showAudioDb)
  const setClipThumbnailTime = useProjectStore((state) => state.setClipThumbnailTime)
  const currentClip = clips[currentClipIndex]
  const currentBareme = useNotationStore((state) => state.currentBareme)
  const notes = useNotationStore((state) => state.notes)
  const currentNote = currentClip ? notes[currentClip.id] : undefined

  const {
    noteMarkers,
    miniaturesEnabled,
    handleSetMiniatureFrame,
    handleMarkerJump,
    handleClose,
  } = useFloatingPlayerBridge({
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
  })

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
      <FloatingPlayerHeader
        isDragging={isDragging}
        isHovering={isHovering}
        title={isDetached ? 'Lecteur détaché' : currentClip ? getClipPrimaryLabel(currentClip) : 'Vidéo'}
        onMouseDown={handleMouseDown}
        onClose={handleClose}
      />

      <div
        ref={videoAreaRef}
        className="bg-black relative"
        style={{ width: `${panelWidth}px`, height: `${videoHeight}px` }}
      >
        {currentClip && !currentClip.filePath && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/92">
            <div className="text-center">
              <AlertTriangle size={18} className="mx-auto mb-2 text-amber-400" />
              <p className="text-xs text-white font-medium">Aucune vidéo liée</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-900/90 px-2 py-1.5 space-y-1">
        <FloatingPlayerTimeline
          currentTime={currentTime}
          duration={duration}
          isLoaded={isLoaded}
          noteMarkers={noteMarkers}
          onSeek={(seconds) => seek(seconds)}
          onMarkerJump={(marker) => {
            handleMarkerJump(marker).catch(() => {})
          }}
        />

        <FloatingPlayerControls
          isLoaded={isLoaded}
          isPlaying={isPlaying}
          muted={muted}
          isFullscreen={isFullscreen}
          showAudioDb={showAudioDb}
          miniaturesEnabled={miniaturesEnabled}
          onSeekRelative={(seconds) => seekRelative(seconds)}
          onTogglePause={togglePause}
          onToggleMuted={() => setMuted(!muted)}
          onToggleFullscreen={toggleFullscreen}
          onSetMiniatureFrame={() => {
            handleSetMiniatureFrame().catch(() => {})
          }}
        />
      </div>
    </div>
  )
}
