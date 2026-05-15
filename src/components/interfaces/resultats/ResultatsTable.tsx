import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { withAlpha } from '@/utils/colors'
import type { CategoryGroup, JudgeSource } from '@/utils/results'
import type { ResultatsRow } from '@/components/interfaces/resultats/types'
import { RESULTATS_PARTICIPANT_COLUMN_WIDTH_CLASS } from '@/components/interfaces/resultats/layout'
import { useI18n } from '@/i18n'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'

function getGroupStep(criteria: Array<{ step?: number | null }>): number {
  const steps = criteria
    .map((criterion) => Number(criterion.step))
    .filter((value) => Number.isFinite(value) && value > 0)
  if (steps.length === 0) return 0.5
  return Math.min(...steps)
}

interface ResultatsTableProps {
  canSortByScore: boolean
  currentBaremeTotalPoints: number
  categoryGroups: CategoryGroup[]
  judges: JudgeSource[]
  rows: ResultatsRow[]
  selectedClipId: string | null
  draftCells: Record<string, string>
  onSelectClip: (clipId: string) => void
  onOpenClipInNotation: (clipId: string) => void
  onOpenClipContextMenu: (clipId: string, x: number, y: number) => void
  getCellKey: (clipId: string, category: string, judgeKey: string) => string
  onSetDraftCell: (key: string, value: string) => void
  onCommitDraftCell: (clipId: string, category: string, judgeKey: string) => void
  onClearDraftCell: (key: string) => void
  staticExport?: boolean
}

export function ResultatsTable({
  canSortByScore,
  currentBaremeTotalPoints,
  categoryGroups,
  judges,
  rows,
  selectedClipId,
  draftCells,
  onSelectClip,
  onOpenClipInNotation,
  onOpenClipContextMenu,
  getCellKey,
  onSetDraftCell,
  onCommitDraftCell,
  onClearDraftCell,
  staticExport = false,
}: ResultatsTableProps) {
  const { t } = useI18n()
  return (
    <div className={`relative isolate flex-1 rounded-lg border border-gray-700 ${staticExport ? 'overflow-visible' : 'amv-results-scroll'}`}>
      <table className="w-full border-separate border-spacing-0 text-xs">
        <thead className={staticExport ? undefined : 'sticky top-0 z-[60] bg-surface-dark shadow-[0_1px_0_rgba(55,65,81,0.75)]'}>
          <tr>
            <th
              rowSpan={2}
              className={` px-2 py-1.5 text-center text-[10px] font-medium text-gray-500 border-r border-b border-gray-700 w-8 bg-surface-dark`}
            >
              #
            </th>
            <th
              rowSpan={2}
              className={` px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 border-r border-b border-gray-700 bg-surface-dark ${RESULTATS_PARTICIPANT_COLUMN_WIDTH_CLASS}`}
            >
              {t('Participant')}
            </th>

            {categoryGroups.map((group) => (
              <th
                key={group.category}
                colSpan={judges.length}
                className="px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider border-r border-b"
                style={{
                  color: group.color,
                  backgroundColor: withAlpha(group.color, 0.18),
                  borderColor: withAlpha(group.color, 0.3),
                }}
              >
                {group.category}
                <span className="text-gray-500 font-normal ml-1">/{group.totalMax}</span>
              </th>
            ))}

            {canSortByScore && (
              <th
                colSpan={judges.length + 1}
                className="px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider border-r border-b border-gray-700 min-w-[90px] bg-surface-dark"
              >
                {t('Total')}
                <div className="text-gray-500 font-normal">/{currentBaremeTotalPoints}</div>
              </th>
            )}
          </tr>
          <tr>
            {categoryGroups.map((group) =>
              judges.map((judge) => (
                <th
                  key={`${group.category}-${judge.key}`}
                  className="px-1 py-1 text-center text-[9px] border-r border-b border-gray-700"
                  style={{
                    backgroundColor: withAlpha(group.color, 0.14),
                    color: judge.isCurrentJudge ? '#93c5fd' : '#94a3b8',
                  }}
                >
                  <HoverTextTooltip text={judge.judgeName}>
                    <span className="inline-block max-w-[88px] truncate align-middle">{judge.judgeName}</span>
                  </HoverTextTooltip>
                </th>
              )),
            )}

            {canSortByScore && judges.map((judge) => (
              <th
                key={`total-${judge.key}`}
                className="px-1 py-1 text-center text-[9px] border-r border-b border-gray-700 bg-surface-dark"
              >
                <span className={judge.isCurrentJudge ? 'text-primary-300' : 'text-gray-400'}>
                  {judge.judgeName}
                </span>
              </th>
            ))}
            {canSortByScore && (
              <th className="px-1 py-1 text-center text-[9px] text-gray-500 border-r border-b border-gray-700 bg-surface-dark">
                {t('Moy.')}
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => {
            const isSelected = selectedClipId === row.clip.id
            return (
              <tr
                key={row.clip.id}
                onClick={() => onSelectClip(row.clip.id)}
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-white/[0.07]'
                    : index % 2 === 0
                      ? 'bg-white/[0.04]'
                      : 'bg-transparent'
                } hover:bg-white/[0.06]`}
              >
                <td className={` px-2 py-1 text-center text-[10px] text-gray-500 border-r border-gray-800 bg-surface-dark`}>
                  {index + 1}
                </td>
                <td
                  className={` px-2 py-1 border-r border-gray-800 bg-surface-dark ${RESULTATS_PARTICIPANT_COLUMN_WIDTH_CLASS}`}
                  onDoubleClick={(event) => {
                    event.stopPropagation()
                    onOpenClipInNotation(row.clip.id)
                  }}
                  onContextMenu={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onOpenClipContextMenu(row.clip.id, event.clientX, event.clientY)
                  }}
                >
                  <div className={`flex flex-col min-w-0 ${staticExport ? 'leading-snug' : 'leading-tight'}`}>
                    <span className={`${staticExport ? 'whitespace-normal break-words' : 'truncate'} text-primary-300 text-[11px] font-semibold`}>{getClipPrimaryLabel(row.clip)}</span>
                    {getClipSecondaryLabel(row.clip) && (
                      <span className={`${staticExport ? 'whitespace-normal break-words' : 'truncate'} text-[9px] text-gray-500`}>{getClipSecondaryLabel(row.clip)}</span>
                    )}
                  </div>
                </td>

                {categoryGroups.map((group) =>
                  judges.map((judge, judgeIdx) => {
                    const key = getCellKey(row.clip.id, group.category, judge.key)
                    const score = row.categoryJudgeScores[group.category][judgeIdx] ?? 0
                    const displayed = draftCells[key] ?? score.toFixed(1)
                    const step = getGroupStep(group.criteria)

                    return (
                      <td
                        key={`${row.clip.id}-${group.category}-${judge.key}`}
                        className={`amv-number-ui px-1 py-1 text-center border-r border-gray-800 ${
                          judge.isCurrentJudge ? 'text-primary-200' : 'text-gray-300'
                        }`}
                      >
                        <input
                          type="number"
                          min={0}
                          max={group.totalMax}
                          step={step}
                          value={displayed}
                          onContextMenu={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            onOpenClipContextMenu(row.clip.id, event.clientX, event.clientY)
                          }}
                          onChange={(event) => {
                            onSetDraftCell(key, event.target.value)
                          }}
                          onBlur={() => onCommitDraftCell(row.clip.id, group.category, judge.key)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              onCommitDraftCell(row.clip.id, group.category, judge.key)
                            } else if (event.key === 'Escape') {
                              onClearDraftCell(key)
                            }
                          }}
                          className="amv-soft-number w-full px-1 py-0.5 rounded bg-transparent border border-transparent hover:bg-surface-light/50 focus:bg-surface-dark focus:border-primary-500 focus-visible:outline-none outline-none text-center"
                        />
                      </td>
                    )
                  }),
                )}

                {canSortByScore && row.judgeTotals.map((score, judgeIdx) => (
                  <td
                    key={`${row.clip.id}-total-${judges[judgeIdx].key}`}
                    className={`amv-number-ui px-2 py-1 text-center border-r border-gray-800 ${
                      judges[judgeIdx].isCurrentJudge ? 'text-primary-300 font-semibold' : 'text-gray-300'
                    }`}
                  >
                    {score.toFixed(1)}
                  </td>
                ))}

                {canSortByScore && (
                  <td className="amv-number-ui px-2 py-1 text-center border-r border-gray-700 font-bold text-white">
                    {row.averageTotal.toFixed(1)}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}


