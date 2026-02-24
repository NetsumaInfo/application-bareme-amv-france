import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Minimize2, ChevronLeft, ChevronRight, Camera, ImagePlus } from 'lucide-react'
import SubtitleSelector from '@/components/player/SubtitleSelector'
import AudioTrackSelector from '@/components/player/AudioTrackSelector'
import AudioDbMeter from '@/components/player/AudioDbMeter'

interface PlayerMainControlsProps {
  isLoaded: boolean
  isPlaying: boolean
  muted: boolean
  volume: number
  isFullscreen: boolean
  showAudioDb: boolean
  miniaturesEnabled: boolean
  onFrameBackStep: () => void
  onSeekBack: () => void
  onTogglePause: () => void
  onSeekForward: () => void
  onFrameStep: () => void
  onToggleMuted: () => void
  onSetVolume: (value: number) => void
  onScreenshot: () => void
  onSetMiniatureFrame: () => void
  onToggleFullscreen: () => void
}

export default function PlayerMainControls({
  isLoaded,
  isPlaying,
  muted,
  volume,
  isFullscreen,
  showAudioDb,
  miniaturesEnabled,
  onFrameBackStep,
  onSeekBack,
  onTogglePause,
  onSeekForward,
  onFrameStep,
  onToggleMuted,
  onSetVolume,
  onScreenshot,
  onSetMiniatureFrame,
  onToggleFullscreen,
}: PlayerMainControlsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <button
          onClick={onFrameBackStep}
          className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
          disabled={!isLoaded}
          title="Image précédente (,)"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={onSeekBack}
          className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
          disabled={!isLoaded}
          title="- 5s"
        >
          <SkipBack size={14} />
        </button>
        <button
          onClick={onTogglePause}
          className="p-1.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white transition-colors"
          disabled={!isLoaded}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          onClick={onSeekForward}
          className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
          disabled={!isLoaded}
          title="+ 5s"
        >
          <SkipForward size={14} />
        </button>
        <button
          onClick={onFrameStep}
          className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
          disabled={!isLoaded}
          title="Image suivante (.)"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onToggleMuted}
          className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
        >
          {muted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={muted ? 0 : volume}
          onChange={(event) => {
            onSetVolume(Number(event.target.value))
          }}
          className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
        />

        <AudioDbMeter enabled={showAudioDb} compact muted={muted || volume === 0} className="ml-1" />
        <SubtitleSelector />
        <AudioTrackSelector />

        <button
          onClick={onScreenshot}
          className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
          disabled={!isLoaded}
          title="Capture d'écran (Ctrl+Shift+G)"
        >
          <Camera size={14} />
        </button>

        {miniaturesEnabled && (
          <button
            onClick={onSetMiniatureFrame}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
            disabled={!isLoaded}
            title="Définir la frame miniature (Ctrl+Shift+M)"
          >
            <ImagePlus size={14} />
          </button>
        )}

        <button
          onClick={onToggleFullscreen}
          className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors ml-1"
          disabled={!isLoaded}
          title={isFullscreen ? 'Quitter le plein écran (F11)' : 'Plein écran (F11)'}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>
    </div>
  )
}
