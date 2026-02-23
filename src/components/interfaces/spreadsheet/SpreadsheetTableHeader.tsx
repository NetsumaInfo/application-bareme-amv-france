import { withAlpha } from '@/utils/colors'
import type { Bareme } from '@/types/bareme'
import type { CategoryGroup } from './types'

interface SpreadsheetTableHeaderProps {
  categoryGroups: CategoryGroup[]
  currentBareme: Bareme
  hideTotalsSetting: boolean
  onToggleScoringCategory: (category: string) => void
}

export function SpreadsheetTableHeader({
  categoryGroups,
  currentBareme,
  hideTotalsSetting,
  onToggleScoringCategory,
}: SpreadsheetTableHeaderProps) {
  return (
    <thead className="sticky top-0 z-10">
      <tr>
        <th
          rowSpan={2}
          className="px-2 py-1.5 text-center text-[10px] font-medium text-gray-500 border-r border-b border-gray-700 w-7 bg-surface-dark sticky left-0 z-20"
        >
          #
        </th>
        <th
          rowSpan={2}
          className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 border-r border-b border-gray-700 min-w-[120px] bg-surface-dark sticky left-7 z-20"
        >
          Pseudo
        </th>
        {categoryGroups.map((group) => (
          <th
            key={group.category}
            colSpan={group.criteria.length}
            className="px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider border-r border-b border-gray-600 cursor-pointer select-none transition-all hover:brightness-125"
            style={{
              backgroundColor: withAlpha(group.color, 0.22),
              borderColor: withAlpha(group.color, 0.35),
            }}
            onClick={() => onToggleScoringCategory(group.category)}
            title={`Cliquez pour noter "${group.category}"`}
          >
            <span style={{ color: group.color }}>{group.category}</span>
            <span className="font-normal text-gray-500 ml-1">/{group.totalMax}</span>
          </th>
        ))}
        {!hideTotalsSetting && (
          <th
            rowSpan={2}
            className="px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider border-b border-gray-700 min-w-[50px] bg-surface-dark"
          >
            Total
            <div className="font-normal text-gray-500">/{currentBareme.totalPoints}</div>
          </th>
        )}
      </tr>
      <tr>
        {categoryGroups.map((group) =>
          group.criteria.map((criterion) => (
            <th
              key={criterion.id}
              className="px-1 py-1 text-center text-[9px] font-medium border-r border-b border-gray-700 min-w-[76px]"
              title={criterion.description}
              style={{ backgroundColor: withAlpha(group.color, 0.12) }}
            >
              <div className="truncate" style={{ color: withAlpha(group.color, 0.92) }}>
                {group.criteria.length === 1 ? '' : criterion.name}
              </div>
              <div className="text-gray-500 font-normal">/{criterion.max ?? 10}</div>
            </th>
          )),
        )}
      </tr>
    </thead>
  )
}
