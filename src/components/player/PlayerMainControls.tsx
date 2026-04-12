import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Minimize2, ChevronLeft, ChevronRight, Camera, ImagePlus } from 'lucide-react'
import SubtitleSelector from '@/components/player/SubtitleSelector'
import AudioTrackSelector from '@/components/player/AudioTrackSelector'
import AudioDbMeter from '@/components/player/AudioDbMeter'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { AppRangeSlider } from '@/components/ui/AppRangeSlider'
import { useUIStore } from '@/store/useUIStore'
import { useI18n } from '@/i18n'
import { formatShortcutAnnotationForAction } from '@/utils/shortcuts'

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
  const { t } = useI18n()
  const shortcutBindings = useUIStore((state) => state.shortcutBindings)
  const frameBackLabel = formatShortcutAnnotationForAction('frameBack', shortcutBindings, t)
  const seekBackLabel = formatShortcutAnnotationForAction('seekBack', shortcutBindings, t)
  const togglePauseLabel = formatShortcutAnnotationForAction(
    'togglePause',
    shortcutBindings,
    t,
    isPlaying ? t('Pause') : t('Lecture'),
  )
  const seekForwardLabel = formatShortcutAnnotationForAction('seekForward', shortcutBindings, t)
  const frameForwardLabel = formatShortcutAnnotationForAction('frameForward', shortcutBindings, t)
  const screenshotLabel = formatShortcutAnnotationForAction('screenshot', shortcutBindings, t)
  const miniatureLabel = formatShortcutAnnotationForAction('setMiniatureFrame', shortcutBindings, t)
  const fullscreenLabel = formatShortcutAnnotationForAction(
    isFullscreen ? 'exitFullscreen' : 'fullscreen',
    shortcutBindings,
    t,
    isFullscreen ? t('Quitter le plein écran') : t('Plein écran'),
  )

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <HoverTextTooltip text={frameBackLabel}>
          <button
            onClick={onFrameBackStep}
            aria-label={frameBackLabel}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
            disabled={!isLoaded}
          >
            <ChevronLeft size={14} />
          </button>
        </HoverTextTooltip>
        <HoverTextTooltip text={seekBackLabel}>
          <button
            onClick={onSeekBack}
            aria-label={seekBackLabel}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
            disabled={!isLoaded}
          >
            <SkipBack size={14} />
          </button>
        </HoverTextTooltip>
        <HoverTextTooltip text={togglePauseLabel}>
          <button
            onClick={onTogglePause}
            aria-label={togglePauseLabel}
            className="p-1.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white transition-colors"
            disabled={!isLoaded}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
        </HoverTextTooltip>
        <HoverTextTooltip text={seekForwardLabel}>
          <button
            onClick={onSeekForward}
            aria-label={seekForwardLabel}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
            disabled={!isLoaded}
          >
            <SkipForward size={14} />
          </button>
        </HoverTextTooltip>
        <HoverTextTooltip text={frameForwardLabel}>
          <button
            onClick={onFrameStep}
            aria-label={frameForwardLabel}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
            disabled={!isLoaded}
          >
            <ChevronRight size={14} />
          </button>
        </HoverTextTooltip>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onToggleMuted}
          className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
        >
          {muted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        <AppRangeSlider
          min={0}
          max={100}
          value={muted ? 0 : volume}
          onChange={onSetVolume}
          className="w-16"
          ariaLabel={t('Volume')}
        />

        <AudioDbMeter enabled={showAudioDb} compact muted={muted || volume === 0} className="ml-1" />
        <SubtitleSelector />
        <AudioTrackSelector />

        <HoverTextTooltip text={screenshotLabel}>
          <button
            onClick={onScreenshot}
            aria-label={screenshotLabel}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
            disabled={!isLoaded}
          >
            <Camera size={14} />
          </button>
        </HoverTextTooltip>

        {miniaturesEnabled && (
          <HoverTextTooltip text={miniatureLabel}>
            <button
              onClick={onSetMiniatureFrame}
              aria-label={miniatureLabel}
              className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
              disabled={!isLoaded}
            >
              <ImagePlus size={14} />
            </button>
          </HoverTextTooltip>
        )}

        <HoverTextTooltip text={fullscreenLabel}>
          <button
            onClick={onToggleFullscreen}
            aria-label={fullscreenLabel}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors ml-1"
            disabled={!isLoaded}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </HoverTextTooltip>
      </div>
    </div>
  )
}
