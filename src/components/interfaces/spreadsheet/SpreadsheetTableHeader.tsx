import { withAlpha } from '@/utils/colors'
import type { Bareme } from '@/types/bareme'
import type { CategoryGroup } from './types'
import { useProjectStore } from '@/store/useProjectStore'

function blendWithSurface(hexColor: string, intensity: number): string {
  const hex = hexColor.replace('#', '').trim()
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return 'rgb(24, 31, 58)'

  const colorR = parseInt(hex.slice(0, 2), 16)
  const colorG = parseInt(hex.slice(2, 4), 16)
  const colorB = parseInt(hex.slice(4, 6), 16)

  const baseR = 15
  const baseG = 15
  const baseB = 35
  const ratio = Math.max(0, Math.min(1, intensity))

  const r = Math.round(baseR + (colorR - baseR) * ratio)
  const g = Math.round(baseG + (colorG - baseG) * ratio)
  const b = Math.round(baseB + (colorB - baseB) * ratio)

  return `rgb(${r}, ${g}, ${b})`
}

interface SpreadsheetTableHeaderProps {
  categoryGroups: CategoryGroup[]
  currentBareme: Bareme
  hideTotalsSetting: boolean
}

export function SpreadsheetTableHeader({
  categoryGroups,
  currentBareme,
  hideTotalsSetting,
}: SpreadsheetTableHeaderProps) {
  const multiPseudoDisplayMode = useProjectStore(
    (state) => state.currentProject?.settings.multiPseudoDisplayMode ?? 'collab_mep',
  )
  const pseudoColumnWidthClass =
    multiPseudoDisplayMode === 'collab_mep'
      ? 'w-[170px] min-w-[170px] max-w-[170px]'
      : multiPseudoDisplayMode === 'first_three'
        ? 'w-[220px] min-w-[220px] max-w-[220px]'
        : 'w-[300px] min-w-[300px] max-w-[300px]'

  return (
    <thead className="sticky top-0 z-40 bg-surface-dark shadow-[0_2px_0_0_rgba(31,41,55,0.95)]">
      <tr>
        <th
          rowSpan={2}
          className="px-2 py-1.5 text-center text-[10px] font-medium text-gray-500 border-r border-b border-gray-700 w-7 bg-surface-dark sticky left-0 z-50"
        >
          #
        </th>
        <th
          rowSpan={2}
          className={`px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 border-r border-b border-gray-700 bg-surface-dark sticky left-7 z-50 ${pseudoColumnWidthClass}`}
        >
          Pseudo
        </th>
        {categoryGroups.map((group) => (
          <th
            key={group.category}
            colSpan={group.criteria.length}
            className="px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider border-r border-b border-gray-600 select-none"
            style={{
              backgroundColor: blendWithSurface(group.color, 0.28),
              borderColor: '#374151',
            }}
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
              style={{ backgroundColor: blendWithSurface(group.color, 0.2) }}
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
