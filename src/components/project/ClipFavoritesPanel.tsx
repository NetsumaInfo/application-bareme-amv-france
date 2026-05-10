import { Star } from 'lucide-react'
import type { Clip } from '@/types/project'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { useI18n } from '@/i18n'

interface ClipFavoritesPanelProps {
  clips: Clip[]
  selectedClipId?: string | null
  compact?: boolean
  onSelectClip?: (clipId: string) => void
  onOpenClipInNotation?: (clipId: string) => void
}

export function ClipFavoritesPanel({
  clips,
  selectedClipId,
  compact = false,
  onSelectClip,
  onOpenClipInNotation,
}: ClipFavoritesPanelProps) {
  const { t } = useI18n()
  const favoriteClips = clips.filter((clip) => clip.favorite)

  if (favoriteClips.length === 0) return null

  return (
    <section className={`shrink-0 border-b border-gray-700/50 ${compact ? 'px-3 py-1.5' : 'px-2.5 py-2'}`}>
      <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-amber-200">
        <Star size={13} fill="currentColor" />
        <span>{t('Favoris coups de cœur')}</span>
        <span className="rounded-md bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-100">
          {favoriteClips.length}
        </span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {favoriteClips.map((clip) => {
          const secondaryLabel = getClipSecondaryLabel(clip)
          const comment = clip.favoriteComment?.trim()
          const selected = selectedClipId === clip.id
          const isInteractive = Boolean(onSelectClip || onOpenClipInNotation)
          const content = (
            <>
              <div className="flex min-w-0 items-center gap-1.5">
                <Star size={10} fill="currentColor" className="shrink-0 text-amber-200" />
                <span className="truncate text-[11px] font-semibold text-primary-200">
                  {getClipPrimaryLabel(clip)}
                </span>
                {secondaryLabel ? (
                  <span className="truncate text-[10px] text-gray-500">- {secondaryLabel}</span>
                ) : null}
              </div>
              {comment ? (
                <div className="mt-0.5 line-clamp-2 text-left text-[10px] leading-4 text-gray-400">
                  {comment}
                </div>
              ) : null}
            </>
          )
          const className = `min-w-[190px] max-w-[280px] rounded-md border px-2 py-1.5 text-left transition-colors ${
            selected
              ? 'border-amber-300/45 bg-amber-400/12'
              : 'border-gray-700/50 bg-white/[0.025] hover:border-amber-300/35 hover:bg-amber-400/8'
          }`

          if (!isInteractive) {
            return (
              <div key={clip.id} className={className}>
                {content}
              </div>
            )
          }

          return (
            <button
              key={clip.id}
              type="button"
              className={className}
              onClick={() => onSelectClip?.(clip.id)}
              onDoubleClick={() => onOpenClipInNotation?.(clip.id)}
            >
              {content}
            </button>
          )
        })}
      </div>
    </section>
  )
}
