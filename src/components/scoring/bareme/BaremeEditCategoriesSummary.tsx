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
  compact?: boolean
}

export function BaremeEditCategoriesSummary({
  readOnly,
  categoryStats,
  categoryOrder,
  categoryColors,
  onMoveCategory,
  compact = false,
}: BaremeEditCategoriesSummaryProps) {
  const { t } = useI18n()

  const visibleCategories = categoryOrder.filter((category) => {
    const stat = categoryStats.get(category)
    return Boolean(stat)
  })

  if (visibleCategories.length === 0) return null

  return (
    <div className={compact ? '' : 'rounded-xl border border-gray-700/70 bg-surface-dark/28 px-3 py-2.5'}>
      <div className={`${compact ? 'flex flex-nowrap overflow-x-auto gap-1 pr-1 scrollbar-thin' : 'flex flex-wrap gap-2'}`}>
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
              className={`inline-flex items-center rounded-lg border ${
                compact ? 'shrink-0 gap-1 px-1.5 py-0.5' : 'gap-2 px-2.5 py-1.5'
              }`}
              style={{
                borderColor: withAlpha(color, compact ? 0.26 : 0.32),
                backgroundColor: withAlpha(color, compact ? 0.08 : 0.1),
              }}
            >
              <span className={`${compact ? 'text-[10px]' : 'text-[11px]'} font-semibold tracking-[0.01em]`} style={{ color }}>
                {category}
              </span>
              <span className={`${compact ? 'text-[10px]' : 'text-[11px]'} amv-number-ui text-gray-300`}>
                {t('{count} crit. • /{total}', {
                  count: stat.count,
                  total: stat.total,
                })}
              </span>
              {!readOnly && categoryOrder.length > 1 ? (
                <div className={`inline-flex items-center ${compact ? 'gap-0' : 'ml-0.5 gap-0.5'}`}>
                  <HoverTextTooltip text={t('Monter {category}', { category })}>
                    <button
                      type="button"
                      onClick={() => onMoveCategory(category, 'up')}
                      disabled={index === 0}
                      aria-label={t('Monter {category}', { category })}
                      className={`${compact ? 'p-[2px]' : 'p-0.5'} rounded-sm text-gray-500 transition-colors hover:bg-surface hover:text-white disabled:cursor-not-allowed disabled:opacity-30`}
                    >
                      <ArrowUp size={compact ? 10 : 12} />
                    </button>
                  </HoverTextTooltip>
                  <HoverTextTooltip text={t('Descendre {category}', { category })}>
                    <button
                      type="button"
                      onClick={() => onMoveCategory(category, 'down')}
                      disabled={index >= visibleCategories.length - 1}
                      aria-label={t('Descendre {category}', { category })}
                      className={`${compact ? 'p-[2px]' : 'p-0.5'} rounded-sm text-gray-500 transition-colors hover:bg-surface hover:text-white disabled:cursor-not-allowed disabled:opacity-30`}
                    >
                      <ArrowDown size={compact ? 10 : 12} />
                    </button>
                  </HoverTextTooltip>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
