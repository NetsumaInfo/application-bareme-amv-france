import { ChevronLeft, ChevronRight, Play, Star } from 'lucide-react'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import type { Clip } from '@/types/project'
import { useI18n } from '@/i18n'
import {
  formatShortcutAnnotationForAction,
  type ShortcutAction,
} from '@/utils/shortcuts'

interface DetachedNotesHeaderProps {
  clip: Clip
  clipIndex: number
  totalClips: number
  hasVideo: boolean
  shouldHideTotals: boolean
  totalScore: number
  totalPoints: number
  shortcutBindings: Partial<Record<ShortcutAction, string>>
  onNavigate: (direction: 'prev' | 'next') => void
  onOpenPlayer: () => void
}

export function DetachedNotesHeader({
  clip,
  clipIndex,
  totalClips,
  hasVideo,
  shouldHideTotals,
  totalScore,
  totalPoints,
  shortcutBindings,
  onNavigate,
  onOpenPlayer,
}: DetachedNotesHeaderProps) {
  const { t } = useI18n()
  const primaryLabel = getClipPrimaryLabel(clip)
  const secondaryLabel = getClipSecondaryLabel(clip)
  const prevClipLabel = formatShortcutAnnotationForAction('prevClip', shortcutBindings, t)
  const nextClipLabel = formatShortcutAnnotationForAction('nextClip', shortcutBindings, t)
  return (
    <>
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 shrink-0 bg-surface">
        <HoverTextTooltip text={prevClipLabel}>
          <button
            onClick={() => onNavigate('prev')}
            disabled={clipIndex === 0}
            aria-label={prevClipLabel}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        </HoverTextTooltip>
        <div
          className="text-center min-w-0 flex-1 px-2"
          onDoubleClick={hasVideo ? onOpenPlayer : undefined}
        >
          <div className="flex items-center justify-center gap-2 min-w-0 text-[11px] leading-none">
            <HoverTextTooltip text={hasVideo ? t('Ouvrir la vidéo') : t('Vidéo indisponible')}>
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  if (!hasVideo) return
                  onOpenPlayer()
                }}
                disabled={!hasVideo}
                aria-label={hasVideo ? t('Ouvrir la vidéo') : t('Vidéo indisponible')}
                className="p-0.5 rounded hover:bg-surface-light text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <Play size={13} />
              </button>
            </HoverTextTooltip>
            <span className="font-semibold text-primary-300 truncate max-w-[38%]">{primaryLabel}</span>
            {secondaryLabel && (
              <>
                <span className="text-gray-600">-</span>
                <span className="text-gray-500 truncate max-w-[32%]">{secondaryLabel}</span>
              </>
            )}
            {clip.favorite ? (
              <HoverTextTooltip text={clip.favoriteComment?.trim() || t('Favori')}>
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-md border border-amber-300/35 bg-amber-400/12 text-amber-200">
                  <Star size={9} fill="currentColor" aria-hidden="true" />
                </span>
              </HoverTextTooltip>
            ) : null}
            <span className="text-gray-500 shrink-0">
              {clipIndex + 1}/{totalClips}
            </span>
          </div>
        </div>
        <HoverTextTooltip text={nextClipLabel}>
          <button
            onClick={() => onNavigate('next')}
            disabled={clipIndex >= totalClips - 1}
            aria-label={nextClipLabel}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </HoverTextTooltip>
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
