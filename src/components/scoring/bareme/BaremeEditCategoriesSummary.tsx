import { ArrowDown, ArrowUp } from 'lucide-react'
import { CATEGORY_COLOR_PRESETS, sanitizeColor, withAlpha } from '@/utils/colors'

interface BaremeEditCategoriesSummaryProps {
  readOnly: boolean
  categoryStats: Map<string, { count: number; total: number }>
  categoryOrder: string[]
  categoryColors: Record<string, string>
  getCategoryColor: (category: string) => string
  onMoveCategory: (category: string, direction: 'up' | 'down') => void
}

export function BaremeEditCategoriesSummary({
  readOnly,
  categoryStats,
  categoryOrder,
  categoryColors,
  getCategoryColor,
  onMoveCategory,
}: BaremeEditCategoriesSummaryProps) {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {Array.from(categoryStats.entries()).map(([category, stat], index) => {
          const color =
            category === 'Général'
              ? '#94a3b8'
              : sanitizeColor(
                  categoryColors[category],
                  CATEGORY_COLOR_PRESETS[index % CATEGORY_COLOR_PRESETS.length],
                )
          return (
            <span
              key={category}
              className="text-[11px] px-2 py-1 rounded border"
              style={{
                borderColor: withAlpha(color, 0.45),
                backgroundColor: withAlpha(color, 0.18),
                color,
              }}
            >
              {category}: {stat.count} crit. • /{stat.total}
            </span>
          )
        })}
      </div>

      {categoryOrder.length > 1 ? (
        <div className="rounded-lg border border-gray-700 bg-surface-dark/40 px-3 py-2">
          <div className="text-[11px] text-gray-400 mb-2">Ordre des catégories</div>
          <div className="flex flex-wrap gap-2">
            {categoryOrder.map((category, index) => {
              const color = getCategoryColor(category)
              return (
                <div
                  key={`order-${category}`}
                  className="inline-flex items-center gap-1.5 rounded border px-2 py-1"
                  style={{
                    borderColor: withAlpha(color, 0.45),
                    backgroundColor: withAlpha(color, 0.14),
                  }}
                >
                  <span className="text-[11px] font-medium" style={{ color }}>
                    {category}
                  </span>
                  {!readOnly ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onMoveCategory(category, 'up')}
                        disabled={index === 0}
                        className="p-0.5 rounded text-gray-400 hover:text-white hover:bg-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={`Monter ${category}`}
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveCategory(category, 'down')}
                        disabled={index >= categoryOrder.length - 1}
                        className="p-0.5 rounded text-gray-400 hover:text-white hover:bg-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={`Descendre ${category}`}
                      >
                        <ArrowDown size={12} />
                      </button>
                    </>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </>
  )
}
