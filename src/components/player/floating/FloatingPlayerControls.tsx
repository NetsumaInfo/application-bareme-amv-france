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
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useUIStore } from '@/store/useUIStore'
import { useI18n } from '@/i18n'
import { formatShortcutAnnotationForAction } from '@/utils/shortcuts'

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
  const { t } = useI18n()
  const shortcutBindings = useUIStore((state) => state.shortcutBindings)
  const seekBackLabel = formatShortcutAnnotationForAction('seekBack', shortcutBindings, t)
  const togglePauseLabel = formatShortcutAnnotationForAction(
    'togglePause',
    shortcutBindings,
    t,
    isPlaying ? t('Pause') : t('Lecture'),
  )
  const seekForwardLabel = formatShortcutAnnotationForAction('seekForward', shortcutBindings, t)
  const fullscreenLabel = formatShortcutAnnotationForAction(
    isFullscreen ? 'exitFullscreen' : 'fullscreen',
    shortcutBindings,
    t,
    isFullscreen ? t('Quitter le plein écran') : t('Agrandir'),
  )
  const miniatureLabel = formatShortcutAnnotationForAction('setMiniatureFrame', shortcutBindings, t)
  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      <HoverTextTooltip text={seekBackLabel}>
        <button
          onClick={() => onSeekRelative(-5)}
          aria-label={seekBackLabel}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700 transition-colors"
          disabled={!isLoaded}
        >
          <SkipBack size={14} className="text-gray-300" />
        </button>
      </HoverTextTooltip>

      <HoverTextTooltip text={togglePauseLabel}>
        <button
          onClick={onTogglePause}
          aria-label={togglePauseLabel}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700 transition-colors"
          disabled={!isLoaded}
        >
          {isPlaying ? (
            <Pause size={14} className="text-gray-300" />
          ) : (
            <Play size={14} className="text-gray-300" />
          )}
        </button>
      </HoverTextTooltip>

      <HoverTextTooltip text={seekForwardLabel}>
        <button
          onClick={() => onSeekRelative(5)}
          aria-label={seekForwardLabel}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700 transition-colors"
          disabled={!isLoaded}
        >
          <SkipForward size={14} className="text-gray-300" />
        </button>
      </HoverTextTooltip>

      <HoverTextTooltip text={muted ? t('Activer le son') : t('Couper le son')}>
        <button
          onClick={onToggleMuted}
          aria-label={muted ? t('Activer le son') : t('Couper le son')}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700 transition-colors"
        >
          {muted ? (
            <VolumeX size={14} className="text-gray-300" />
          ) : (
            <Volume2 size={14} className="text-gray-300" />
          )}
        </button>
      </HoverTextTooltip>

      <SubtitleSelector />
      <AudioTrackSelector />
      <AudioDbMeter enabled={showAudioDb} compact muted={muted} />

      <HoverTextTooltip text={fullscreenLabel}>
        <button
          onClick={onToggleFullscreen}
          aria-label={fullscreenLabel}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700 transition-colors"
          disabled={!isLoaded}
        >
          {isFullscreen ? (
            <Minimize2 size={14} className="text-gray-300" />
          ) : (
            <Maximize2 size={14} className="text-gray-300" />
          )}
        </button>
      </HoverTextTooltip>
      {miniaturesEnabled && (
        <HoverTextTooltip text={miniatureLabel}>
          <button
            onClick={onSetMiniatureFrame}
            aria-label={miniatureLabel}
            className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700 transition-colors"
            disabled={!isLoaded}
          >
            <ImagePlus size={14} className="text-gray-300" />
          </button>
        </HoverTextTooltip>
      )}
    </div>
  )
}
