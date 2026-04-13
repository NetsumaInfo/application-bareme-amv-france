import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import type { Clip } from '@/types/project'
import { useI18n } from '@/i18n'
import {
  formatShortcutAnnotationForAction,
  type ShortcutAction,
} from '@/utils/shortcuts'

interface NotationClipHeaderProps {
  clip: Clip
  currentClipIndex: number
  totalClips: number
  hasVideo: boolean
  totalScore: number
  totalPoints: number
  shouldHideTotals: boolean
  shortcutBindings: Partial<Record<ShortcutAction, string>>
  onNavigate: (direction: 'next' | 'prev') => void
  onOpenPlayer: () => void
}

export function NotationClipHeader({
  clip,
  currentClipIndex,
  totalClips,
  hasVideo,
  totalScore,
  totalPoints,
  shouldHideTotals,
  shortcutBindings,
  onNavigate,
  onOpenPlayer,
}: NotationClipHeaderProps) {
  const { t } = useI18n()
  const prevClipLabel = formatShortcutAnnotationForAction('prevClip', shortcutBindings, t)
  const nextClipLabel = formatShortcutAnnotationForAction('nextClip', shortcutBindings, t)
  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-700/80 bg-surface px-3 py-1.5 shrink-0">
        <HoverTextTooltip text={prevClipLabel}>
          <button
            onClick={() => onNavigate('prev')}
            disabled={currentClipIndex === 0}
            aria-label={prevClipLabel}
            className="inline-flex h-5 w-5 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </button>
        </HoverTextTooltip>
        <div
          className="text-center min-w-0 flex-1 px-2"
          onDoubleClick={hasVideo ? onOpenPlayer : undefined}
        >
          <div className="flex items-center justify-center gap-1.5 min-w-0 text-[10px] leading-none">
            <HoverTextTooltip text={hasVideo ? t('Ouvrir la vidéo') : t('Vidéo indisponible')}>
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  if (!hasVideo) return
                  onOpenPlayer()
                }}
                disabled={!hasVideo}
                aria-label={hasVideo ? t('Ouvrir la vidéo') : t('Vidéo indisponible')}
                className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 shrink-0"
              >
                <Play size={11.5} />
              </button>
            </HoverTextTooltip>
            <span className="text-[11px] font-semibold text-white truncate max-w-[40%]">
              {getClipPrimaryLabel(clip)}
            </span>
            {getClipSecondaryLabel(clip) && (
              <>
                <span className="text-gray-600">-</span>
                <span className="text-primary-300 truncate max-w-[32%]">{getClipSecondaryLabel(clip)}</span>
              </>
            )}
            <span className="text-gray-500 shrink-0">
              {currentClipIndex + 1}/{totalClips}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <HoverTextTooltip text={nextClipLabel}>
            <button
              onClick={() => onNavigate('next')}
              disabled={currentClipIndex >= totalClips - 1}
              aria-label={nextClipLabel}
              className="inline-flex h-5 w-5 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </HoverTextTooltip>
        </div>
      </div>

      {!shouldHideTotals && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-700/50 shrink-0 bg-surface-dark">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">{t('Score total')}</span>
          <span className="text-sm font-bold text-white">
            {totalScore}
            <span className="text-xs text-gray-400 font-normal">/{totalPoints}</span>
          </span>
        </div>
      )}
    </>
  )
}
