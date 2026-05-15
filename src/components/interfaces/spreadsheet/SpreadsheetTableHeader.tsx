import { withAlpha } from '@/utils/colors'
import type { Bareme } from '@/types/bareme'
import type { CategoryGroup } from './types'
import { useI18n } from '@/i18n'

const PARTICIPANT_COLUMN_WIDTH_CLASS = 'w-[160px] min-w-[160px] max-w-[160px]'

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
  const { t } = useI18n()

  return (
    <thead className="sticky top-0 z-60 bg-surface-dark shadow-[0_1px_0_rgba(55,65,81,0.75)]">
      <tr>
        <th
          rowSpan={2}
          className="px-2 py-1.5 text-center text-[10px] font-medium text-gray-500 border-r border-b border-gray-700/60 w-8 bg-surface"
        >
          #
        </th>
        <th
          rowSpan={2}
          className={`px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 border-r border-b border-gray-700/60 bg-surface ${PARTICIPANT_COLUMN_WIDTH_CLASS}`}
        >
          {t('Participant')}
        </th>
        {categoryGroups.map((group) => (
          <th
            key={group.category}
            colSpan={group.criteria.length}
            className="px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider border-r border-b select-none"
            style={{
              backgroundColor: withAlpha(group.color, 0.18),
              borderColor: withAlpha(group.color, 0.3),
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
            {t('Total')}
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
              style={{ backgroundColor: withAlpha(group.color, 0.08) }}
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
