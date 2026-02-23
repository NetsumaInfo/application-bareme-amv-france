import { withAlpha } from '@/utils/colors'
import type { Bareme } from '@/types/bareme'
import type { Clip } from '@/types/project'
import type { CategoryGroup } from './types'

interface SpreadsheetTableFooterProps {
  currentBareme: Bareme
  categoryGroups: CategoryGroup[]
  hideTotalsSetting: boolean
  scoredClips: Clip[]
  hasAnyScoreInGroup: (clipId: string, group: CategoryGroup) => boolean
  getCategoryScore: (clipId: string, group: CategoryGroup) => number
  hasAnyScoreInBareme: (clipId: string) => boolean
  getScoreForClip: (clipId: string) => number
}

export function SpreadsheetTableFooter({
  currentBareme,
  categoryGroups,
  hideTotalsSetting,
  scoredClips,
  hasAnyScoreInGroup,
  getCategoryScore,
  hasAnyScoreInBareme,
  getScoreForClip,
}: SpreadsheetTableFooterProps) {
  return (
    <tfoot>
      <tr>
        <td
          colSpan={2 + currentBareme.criteria.length + (hideTotalsSetting ? 0 : 1)}
          className="h-[2px] bg-gray-500"
        />
      </tr>
      <tr className="bg-surface-dark">
        <td
          colSpan={2}
          className="px-2 py-2 font-bold text-[10px] uppercase tracking-wider text-gray-300 border-r border-gray-600 sticky left-0 z-10 bg-surface-dark"
        >
          Moyennes
        </td>
        {categoryGroups.map((group) =>
          group.criteria.map((criterion, index) => {
            if (index !== 0) return null
            const values = scoredClips
              .filter((clip) => hasAnyScoreInGroup(clip.id, group))
              .map((clip) => getCategoryScore(clip.id, group))
            const avg = values.length > 0
              ? values.reduce((sum, value) => sum + value, 0) / values.length
              : 0
            return (
              <td
                key={`avg-${criterion.id}`}
                colSpan={group.criteria.length}
                className="px-1 py-2 text-center border-r border-gray-600"
                style={{ backgroundColor: withAlpha(group.color, 0.22) }}
              >
                <span className="text-[11px] font-mono font-bold" style={{ color: group.color }}>
                  {avg.toFixed(1)}
                </span>
                <span className="text-[9px] text-gray-400">/{group.totalMax}</span>
              </td>
            )
          }),
        )}
        {!hideTotalsSetting && (
          <td className="px-2 py-2 text-center font-mono font-bold text-[12px] text-white bg-surface-dark">
            {(() => {
              const values = scoredClips
                .filter((clip) => hasAnyScoreInBareme(clip.id))
                .map((clip) => getScoreForClip(clip.id))
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
