import { withAlpha } from '@/utils/colors'

interface DetachedCategoryHeaderProps {
  category: string
  color: string
  isExpanded: boolean
  shouldHideTotals: boolean
  categoryScore: number
  totalMax: number
  onToggle: () => void
}

export function DetachedCategoryHeader({
  category,
  color,
  isExpanded,
  shouldHideTotals,
  categoryScore,
  totalMax,
  onToggle,
}: DetachedCategoryHeaderProps) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors border-l-[3px] border-b border-white/5 hover:bg-surface-light/85"
      style={{
        borderLeftColor: color,
        backgroundColor: isExpanded
          ? 'rgb(var(--color-surface-light) / 0.92)'
          : 'rgb(var(--color-surface) / 0.82)',
        boxShadow: isExpanded ? `inset 0 1px 0 ${withAlpha(color, 0.12)}` : 'none',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
          {category}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {!shouldHideTotals ? (
          <>
            <span className="text-xs font-mono font-bold" style={{ color: categoryScore > 0 ? color : '#6b7280' }}>
              {categoryScore}
            </span>
            <span className="text-[10px] text-gray-500">/{totalMax}</span>
          </>
        ) : (
          <span className="text-xs font-mono font-bold text-gray-600">-</span>
        )}
          <span
            className="text-[10px] transition-transform"
            style={{
              color: withAlpha(color, 0.72),
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
          ▼
        </span>
      </div>
    </button>
  )
}
