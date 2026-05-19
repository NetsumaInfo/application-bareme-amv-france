import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { ClipInfo } from '@/components/player/overlay/types'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'
import {
  formatShortcutAnnotationForAction,
  type ShortcutAction,
} from '@/utils/shortcuts'
import type { OverlayIconScale } from '@/components/player/overlay/overlayConstants'

interface OverlayTransportControlsProps {
  iconScale: OverlayIconScale
  clipInfo: ClipInfo
  isPlaying: boolean
  shortcutBindings: Partial<Record<ShortcutAction, string>>
  onPrevClip: () => void
  onNextClip: () => void
  onSeekRelative: (delta: number) => void
  onTogglePause: () => void
}

const ICON_BTN = `rounded-full text-white/85 transition-colors motion-reduce:transition-none
  hover:bg-primary-500/25 hover:text-white
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400
  disabled:opacity-30 disabled:cursor-default
  p-1.5 @[700px]/overlay:p-2.5`

const PLAY_BTN = `rounded-full bg-primary-500/25 text-white transition-colors motion-reduce:transition-none
  hover:bg-primary-500/45
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400
  p-2 mx-0.5 @[700px]/overlay:p-3.5 @[700px]/overlay:mx-1`

export function OverlayTransportControls({
  iconScale,
  clipInfo,
  isPlaying,
  shortcutBindings,
  onPrevClip,
  onNextClip,
  onSeekRelative,
  onTogglePause,
}: OverlayTransportControlsProps) {
  const { t } = useI18n()
  const prevClipLabel = formatShortcutAnnotationForAction('prevClip', shortcutBindings, t)
  const seekBackLabel = formatShortcutAnnotationForAction('seekBack', shortcutBindings, t)
  const togglePauseLabel = formatShortcutAnnotationForAction(
    'togglePause',
    shortcutBindings,
    t,
    isPlaying ? t('Pause') : t('Lecture'),
  )
  const seekForwardLabel = formatShortcutAnnotationForAction('seekForward', shortcutBindings, t)
  const nextClipLabel = formatShortcutAnnotationForAction('nextClip', shortcutBindings, t)

  return (
    <div className="flex items-center gap-1 @[700px]/overlay:gap-2">
      <HoverTextTooltip text={prevClipLabel}>
        <button
          onClick={onPrevClip}
          aria-label={prevClipLabel}
          className={ICON_BTN}
          disabled={clipInfo.index <= 0}
        >
          <ChevronLeft size={iconScale.chevronPx} />
        </button>
      </HoverTextTooltip>

      <HoverTextTooltip text={seekBackLabel}>
        <button
          onClick={() => onSeekRelative(-5)}
          aria-label={seekBackLabel}
          className={ICON_BTN}
        >
          <SkipBack size={iconScale.iconPx} />
        </button>
      </HoverTextTooltip>

      <HoverTextTooltip text={togglePauseLabel}>
        <button
          onClick={onTogglePause}
          aria-label={togglePauseLabel}
          className={PLAY_BTN}
        >
          {isPlaying ? <Pause size={iconScale.playPx} /> : <Play size={iconScale.playPx} />}
        </button>
      </HoverTextTooltip>

      <HoverTextTooltip text={seekForwardLabel}>
        <button
          onClick={() => onSeekRelative(5)}
          aria-label={seekForwardLabel}
          className={ICON_BTN}
        >
          <SkipForward size={iconScale.iconPx} />
        </button>
      </HoverTextTooltip>

      <HoverTextTooltip text={nextClipLabel}>
        <button
          onClick={onNextClip}
          aria-label={nextClipLabel}
          className={ICON_BTN}
          disabled={clipInfo.total > 0 && clipInfo.index >= clipInfo.total - 1}
        >
          <ChevronRight size={iconScale.chevronPx} />
        </button>
      </HoverTextTooltip>
    </div>
  )
}
