import { useMemo, useState } from 'react'
import { Star, X } from 'lucide-react'
import type { Clip } from '@/types/project'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { useI18n } from '@/i18n'

interface ClipFavoriteDialogProps {
  clip: Clip
  onClose: () => void
  onSave: (clip: Clip, comment: string) => void
  onRemove: (clip: Clip) => void
}

export function ClipFavoriteDialog({
  clip,
  onClose,
  onSave,
  onRemove,
}: ClipFavoriteDialogProps) {
  const { t } = useI18n()
  const [comment, setComment] = useState(clip.favoriteComment ?? '')
  const title = clip.favorite ? t('Modifier le favori') : t('Mettre en favori')
  const secondaryLabel = getClipSecondaryLabel(clip)
  const canRemove = Boolean(clip.favorite)
  const normalizedComment = useMemo(() => comment.trim(), [comment])

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md overflow-hidden rounded-lg border border-gray-700 bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-700/60 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-400/12 text-amber-200">
              <Star size={16} fill="currentColor" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{title}</div>
              <div className="truncate text-[11px] text-gray-400">
                <span className="text-primary-300">{getClipPrimaryLabel(clip)}</span>
                {secondaryLabel ? <span> - {secondaryLabel}</span> : null}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Fermer')}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-3 px-4 py-4">
          <p className="text-xs leading-5 text-gray-400">
            {t('Ajoutez la raison du coup de cœur. Ce commentaire sera visible dans les résultats et les exports.')}
          </p>
          <label className="block space-y-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              {t('Commentaire favori')}
            </span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={t('Pourquoi ce clip est un favori ?')}
              className="min-h-[120px] w-full resize-y rounded-md border border-gray-700 bg-surface-dark px-3 py-2 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-primary-500"
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-gray-700/60 px-4 py-3">
          <button
            type="button"
            onClick={() => onRemove(clip)}
            disabled={!canRemove}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-rose-200 transition-colors hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {t('Retirer des favoris')}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-surface-light px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:text-white"
            >
              {t('Annuler')}
            </button>
            <button
              type="button"
              onClick={() => onSave(clip, normalizedComment)}
              className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-500"
            >
              {t('Enregistrer le favori')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
