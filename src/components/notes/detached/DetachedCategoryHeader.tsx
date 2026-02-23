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
      className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors hover:brightness-110"
      style={{
        backgroundColor: isExpanded ? withAlpha(color, 0.18) : withAlpha(color, 0.08),
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
            color: withAlpha(color, 0.6),
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </div>
    </button>
  )
}
