import { withAlpha } from '@/utils/colors'
import type { Bareme } from '@/types/bareme'
import type { Clip } from '@/types/project'
import type { CategoryGroup } from './types'
import { useI18n } from '@/i18n'

interface SpreadsheetTableFooterProps {
  clips: Clip[]
  currentBareme: Bareme
  categoryGroups: CategoryGroup[]
  hideTotalsSetting: boolean
  hasAnyScoreInGroup: (clipId: string, group: CategoryGroup) => boolean
  getCategoryScore: (clipId: string, group: CategoryGroup) => number
  hasAnyScoreInBareme: (clipId: string) => boolean
  getScoreForClip: (clipId: string) => number
}

export function SpreadsheetTableFooter({
  clips,
  currentBareme,
  categoryGroups,
  hideTotalsSetting,
  hasAnyScoreInGroup,
  getCategoryScore,
  hasAnyScoreInBareme,
  getScoreForClip,
}: SpreadsheetTableFooterProps) {
  const { t } = useI18n()
  return (
    <tfoot>
      {/* react-doctor-disable-next-line react-doctor/control-has-associated-label -- decorative 2px divider row, not a control */}
      <tr>
        <td
          // react-doctor-disable-next-line react-doctor/no-aria-hidden-on-focusable -- decorative non-focusable spacer cell
          aria-hidden="true"
          colSpan={2 + currentBareme.criteria.length + (hideTotalsSetting ? 0 : 1)}
          className="h-[2px] bg-gray-500"
        />
      </tr>
      <tr className="bg-surface-dark">
        <td
          colSpan={2}
          className="px-2 py-2 font-bold text-[10px] uppercase tracking-wider text-gray-300 border-r border-gray-600 bg-surface-dark"
        >
          {t('Moyennes')}
        </td>
        {categoryGroups.map((group) =>
          group.criteria.map((criterion, index) => {
            if (index !== 0) return null
            const values = clips.reduce<number[]>((acc, clip) => {
              if (hasAnyScoreInGroup(clip.id, group)) acc.push(getCategoryScore(clip.id, group))
              return acc
            }, [])
            const avg = values.length > 0
              ? values.reduce((sum, value) => sum + value, 0) / values.length
              : 0
            return (
              <td
                key={`avg-${criterion.id}`}
                colSpan={group.criteria.length}
                className="px-1 py-2 text-center border-r border-gray-600"
                style={{ backgroundColor: withAlpha(group.color, 0.16) }}
              >
                <span className="amv-number-ui text-[11px] font-bold" style={{ color: group.color }}>
                  {avg.toFixed(1)}
                </span>
                <span className="text-[9px] text-gray-400">/{group.totalMax}</span>
              </td>
            )
          }),
        )}
        {!hideTotalsSetting && (
          <td className="amv-number-ui px-2 py-2 text-center font-bold text-[12px] text-white bg-surface-dark">
            {(() => {
              const values = clips.reduce<number[]>((acc, clip) => {
                if (hasAnyScoreInBareme(clip.id)) acc.push(getScoreForClip(clip.id))
                return acc
              }, [])
              return (
                values.length > 0
                  ? values.reduce((sum, value) => sum + value, 0) / values.length
                  : 0
              ).toFixed(1)
            })()}
          </td>
        )}
      </tr>
    </tfoot>
  )
}
