import { ArrowDown, ArrowUp } from 'lucide-react'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'
import { CATEGORY_COLOR_PRESETS, sanitizeColor, withAlpha } from '@/utils/colors'

interface BaremeEditCategoriesSummaryProps {
  readOnly: boolean
  categoryStats: Map<string, { count: number; total: number }>
  categoryOrder: string[]
  categoryColors: Record<string, string>
  onMoveCategory: (category: string, direction: 'up' | 'down') => void
}

export function BaremeEditCategoriesSummary({
  readOnly,
  categoryStats,
  categoryOrder,
  categoryColors,
  onMoveCategory,
}: BaremeEditCategoriesSummaryProps) {
  const { t } = useI18n()

  const visibleCategories = categoryOrder.filter((category) => categoryStats.has(category))

  if (visibleCategories.length === 0) return null

  const canReorder = !readOnly && visibleCategories.length > 1

  return (
    <div className="flex flex-col gap-1.5">
      {visibleCategories.map((category, index) => {
        const stat = categoryStats.get(category) ?? { count: 0, total: 0 }
        const color =
          category === 'Général'
            ? '#94a3b8'
            : sanitizeColor(
                categoryColors[category],
                CATEGORY_COLOR_PRESETS[index % CATEGORY_COLOR_PRESETS.length],
              )

        return (
          <div
            key={category}
            className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5"
            style={{
              borderColor: withAlpha(color, 0.28),
              backgroundColor: withAlpha(color, 0.08),
            }}
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-[11px] font-semibold" style={{ color }}>
              {category}
            </span>
            <span className="amv-number-ui shrink-0 text-[11px] text-gray-400">
              {t('{count} crit. • /{total}', { count: stat.count, total: stat.total })}
            </span>
            {canReorder && (
              <div className="flex shrink-0 items-center">
                <HoverTextTooltip text={t('Monter la catégorie')}>
                  <button
                    type="button"
                    onClick={() => onMoveCategory(category, 'up')}
                    disabled={index === 0}
                    aria-label={t('Monter la catégorie')}
                    className="rounded p-0.5 text-gray-500 transition-colors hover:bg-surface hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowUp size={12} />
                  </button>
                </HoverTextTooltip>
                <HoverTextTooltip text={t('Descendre la catégorie')}>
                  <button
                    type="button"
                    onClick={() => onMoveCategory(category, 'down')}
                    disabled={index >= visibleCategories.length - 1}
                    aria-label={t('Descendre la catégorie')}
                    className="rounded p-0.5 text-gray-500 transition-colors hover:bg-surface hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowDown size={12} />
                  </button>
                </HoverTextTooltip>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
