import { useMemo, useState } from 'react'
import { Tag, X } from 'lucide-react'
import { AppSelect } from '@/components/ui/AppSelect'
import { useI18n } from '@/i18n'
import type { Clip } from '@/types/project'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import {
  normalizeContestCategory,
  normalizeContestCategoryPresets,
} from '@/utils/contestCategory'

interface ContestCategorySelectorDialogProps {
  clip: Clip
  categories: string[]
  onClose: () => void
  onSave: (category: string) => void
}

export function ContestCategorySelectorDialog({
  clip,
  categories,
  onClose,
  onSave,
}: ContestCategorySelectorDialogProps) {
  const { t } = useI18n()
  const currentCategory = normalizeContestCategory(clip.contestCategory)
  const availableCategories = useMemo(() => {
    const base = normalizeContestCategoryPresets(categories)
    if (!currentCategory) return base
    if (base.includes(currentCategory)) return base
    return [currentCategory, ...base]
  }, [categories, currentCategory])
  const [selectedCategory, setSelectedCategory] = useState(currentCategory)
  const title = currentCategory ? t('Modifier catégorie clip') : t('Définir catégorie clip')
  const secondaryLabel = getClipSecondaryLabel(clip)

  const options = useMemo(
    () => [
      { value: '', label: t('Aucune') },
      ...availableCategories.map((category) => ({ value: category, label: category })),
    ],
    [availableCategories, t],
  )

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
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-500/15 text-primary-200">
              <Tag size={16} />
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
          <label className="block space-y-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              {t('Catégorie clip')}
            </span>
            <AppSelect
              value={selectedCategory}
              onChange={setSelectedCategory}
              ariaLabel={t('Catégories clip')}
              className="w-full"
              options={options}
              size="md"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-700/60 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-surface-light px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:text-white"
          >
            {t('Annuler')}
          </button>
          <button
            type="button"
            onClick={() => onSave(selectedCategory)}
            className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-500"
          >
            {t('Enregistrer')}
          </button>
        </div>
      </div>
    </div>
  )
}
