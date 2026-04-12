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

interface OverlayTransportControlsProps {
  compactControls: boolean
  clipInfo: ClipInfo
  isPlaying: boolean
  shortcutBindings: Partial<Record<ShortcutAction, string>>
  onPrevClip: () => void
  onNextClip: () => void
  onSeekRelative: (delta: number) => void
  onTogglePause: () => void
}

export function OverlayTransportControls({
  compactControls,
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
    <div className={`flex items-center ${compactControls ? 'gap-1' : 'gap-2'}`}>
      <HoverTextTooltip text={prevClipLabel}>
        <button
          onClick={onPrevClip}
          aria-label={prevClipLabel}
          className={`${compactControls ? 'p-1.5' : 'p-2.5'} rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-default`}
          disabled={clipInfo.index <= 0}
        >
          <ChevronLeft size={compactControls ? 18 : 24} />
        </button>
      </HoverTextTooltip>

      <HoverTextTooltip text={seekBackLabel}>
        <button
          onClick={() => onSeekRelative(-5)}
          aria-label={seekBackLabel}
          className={`${compactControls ? 'p-1.5' : 'p-2.5'} rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors`}
        >
          <SkipBack size={compactControls ? 16 : 22} />
        </button>
      </HoverTextTooltip>

      <HoverTextTooltip text={togglePauseLabel}>
        <button
          onClick={onTogglePause}
          aria-label={togglePauseLabel}
          className={`${compactControls ? 'p-2 mx-0.5' : 'p-3.5 mx-1'} rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors`}
        >
          {isPlaying ? <Pause size={compactControls ? 20 : 28} /> : <Play size={compactControls ? 20 : 28} />}
        </button>
      </HoverTextTooltip>

      <HoverTextTooltip text={seekForwardLabel}>
        <button
          onClick={() => onSeekRelative(5)}
          aria-label={seekForwardLabel}
          className={`${compactControls ? 'p-1.5' : 'p-2.5'} rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors`}
        >
          <SkipForward size={compactControls ? 16 : 22} />
        </button>
      </HoverTextTooltip>

      <HoverTextTooltip text={nextClipLabel}>
        <button
          onClick={onNextClip}
          aria-label={nextClipLabel}
          className={`${compactControls ? 'p-1.5' : 'p-2.5'} rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-default`}
          disabled={clipInfo.total > 0 && clipInfo.index >= clipInfo.total - 1}
        >
          <ChevronRight size={compactControls ? 18 : 24} />
        </button>
      </HoverTextTooltip>
    </div>
  )
}
