import {
  ImagePlus,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react'
import SubtitleSelector from '@/components/player/SubtitleSelector'
import AudioTrackSelector from '@/components/player/AudioTrackSelector'
import AudioDbMeter from '@/components/player/AudioDbMeter'

interface FloatingPlayerControlsProps {
  isLoaded: boolean
  isPlaying: boolean
  muted: boolean
  isFullscreen: boolean
  showAudioDb: boolean
  miniaturesEnabled: boolean
  onSeekRelative: (seconds: number) => void
  onTogglePause: () => void
  onToggleMuted: () => void
  onToggleFullscreen: () => void
  onSetMiniatureFrame: () => void
}

export function FloatingPlayerControls({
  isLoaded,
  isPlaying,
  muted,
  isFullscreen,
  showAudioDb,
  miniaturesEnabled,
  onSeekRelative,
  onTogglePause,
  onToggleMuted,
  onToggleFullscreen,
  onSetMiniatureFrame,
}: FloatingPlayerControlsProps) {
  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      <button
        onClick={() => onSeekRelative(-5)}
        className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700 transition-colors"
        title="Reculer 5s"
        disabled={!isLoaded}
      >
        <SkipBack size={14} className="text-gray-300" />
      </button>

      <button
        onClick={onTogglePause}
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
        onClick={() => onSeekRelative(5)}
        className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700 transition-colors"
        title="Avancer 5s"
        disabled={!isLoaded}
      >
        <SkipForward size={14} className="text-gray-300" />
      </button>

      <button
        onClick={onToggleMuted}
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
      <AudioDbMeter enabled={showAudioDb} compact muted={muted} />

      <button
        onClick={onToggleFullscreen}
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
          onClick={onSetMiniatureFrame}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700 transition-colors"
          title="Définir la frame miniature"
          disabled={!isLoaded}
        >
          <ImagePlus size={14} className="text-gray-300" />
        </button>
      )}
    </div>
  )
}
