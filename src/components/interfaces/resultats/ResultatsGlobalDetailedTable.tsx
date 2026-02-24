import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { withAlpha } from '@/utils/colors'
import {
  getCriterionNumericScore,
  type CategoryGroup,
  type JudgeSource,
  type NoteLike,
} from '@/utils/results'
import type { ResultatsRow } from '@/components/interfaces/resultats/types'

interface ResultatsGlobalDetailedTableProps {
  canSortByScore: boolean
  currentBaremeTotalPoints: number
  categoryGroups: CategoryGroup[]
  judges: JudgeSource[]
  rows: ResultatsRow[]
  judgeColors: Record<string, string>
  selectedClipId: string | null
  criterionDraftCells: Record<string, string>
  onSelectClip: (clipId: string) => void
  onOpenClipInNotation: (clipId: string) => void
  onOpenClipContextMenu: (clipId: string, x: number, y: number) => void
  getCriterionCellKey: (clipId: string, criterionId: string, judgeKey: string) => string
  onSetCriterionDraftCell: (key: string, value: string) => void
  onCommitCriterionDraftCell: (clipId: string, criterionId: string, judgeKey: string) => void
  onClearCriterionDraftCell: (key: string) => void
}

function formatCriterionValue(value: number): string {
  if (!Number.isFinite(value)) return '0'
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(2).replace(/\.?0+$/, '')
}

export function ResultatsGlobalDetailedTable({
  canSortByScore,
  currentBaremeTotalPoints,
  categoryGroups,
  judges,
  rows,
  judgeColors,
  selectedClipId,
  criterionDraftCells,
  onSelectClip,
  onOpenClipInNotation,
  onOpenClipContextMenu,
  getCriterionCellKey,
  onSetCriterionDraftCell,
  onCommitCriterionDraftCell,
  onClearCriterionDraftCell,
}: ResultatsGlobalDetailedTableProps) {
  return (
    <div className="flex-1 overflow-auto rounded-lg border border-gray-700">
      <table className="w-full border-collapse text-xs">
        <thead className="sticky top-0 z-10">
          <tr>
            <th
              rowSpan={3}
              className="px-2 py-1.5 text-center text-[10px] font-medium text-gray-500 border-r border-b border-gray-700 w-8 bg-surface-dark sticky left-0 z-20"
            >
              #
            </th>
            <th
              rowSpan={3}
              className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 border-r border-b border-gray-700 min-w-[120px] max-w-[180px] bg-surface-dark sticky left-8 z-20"
            >
              Clip
            </th>
            {categoryGroups.map((group) => (
              <th
                key={group.category}
                colSpan={group.criteria.length * judges.length}
                className="px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider border-r border-b"
                style={{
                  color: group.color,
                  backgroundColor: withAlpha(group.color, 0.16),
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
                Total
                <div className="text-gray-500 font-normal">/{currentBaremeTotalPoints}</div>
              </th>
            )}
          </tr>

          <tr>
            {categoryGroups.map((group) =>
              group.criteria.map((criterion) => (
                <th
                  key={`${group.category}-${criterion.id}-criterion`}
                  colSpan={judges.length}
                  className="px-2 py-1 text-center text-[9px] font-semibold border-r border-b border-gray-700"
                  style={{
                    color: group.color,
                    backgroundColor: withAlpha(group.color, 0.08),
                  }}
                >
                  {criterion.name}
                  <span className="text-gray-500 font-normal ml-1">/{criterion.max}</span>
                </th>
              )),
            )}

            {canSortByScore &&
              judges.map((judge) => (
                <th
                  key={`total-head-${judge.key}`}
                  rowSpan={2}
                  className="px-1 py-1 text-center text-[9px] border-r border-b border-gray-700"
                  style={{
                    color: judgeColors[judge.key] ?? '#60a5fa',
                    backgroundColor: withAlpha(judgeColors[judge.key] ?? '#60a5fa', 0.08),
                  }}
                >
                  {judge.judgeName}
                </th>
              ))}
            {canSortByScore && (
              <th
                rowSpan={2}
                className="px-1 py-1 text-center text-[9px] text-gray-500 border-r border-b border-gray-700 bg-surface-dark"
              >
                Moy.
              </th>
            )}
          </tr>

          <tr>
            {categoryGroups.map((group) =>
              group.criteria.map((criterion) =>
                judges.map((judge) => {
                  const color = judgeColors[judge.key] ?? '#60a5fa'
                  return (
                    <th
                      key={`${group.category}-${criterion.id}-${judge.key}`}
                      className="px-1 py-1 text-center text-[9px] border-r border-b border-gray-700"
                      style={{
                        color,
                        backgroundColor: withAlpha(color, 0.07),
                        boxShadow: `inset 0 2px 0 0 ${withAlpha(color, 0.9)}`,
                      }}
                      title={judge.judgeName}
                    >
                      <span className="truncate inline-block max-w-[82px] align-middle">
                        {judge.judgeName}
                      </span>
                    </th>
                  )
                }),
              ),
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
                    ? 'bg-primary-600/12'
                    : index % 2 === 0
                      ? 'bg-surface-dark/20'
                      : 'bg-transparent'
                } hover:bg-primary-600/8`}
              >
                <td className="px-2 py-1 text-center text-[10px] text-gray-500 border-r border-gray-800 sticky left-0 z-10 bg-surface-dark">
                  {index + 1}
                </td>
                <td
                  className="px-2 py-1 border-r border-gray-800 sticky left-8 z-10 bg-surface-dark max-w-[180px]"
                  onDoubleClick={(event) => {
                    event.stopPropagation()
                    onOpenClipInNotation(row.clip.id)
                  }}
                  onContextMenu={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    const width = 210
                    const height = 152
                    const x = Math.max(8, Math.min(event.clientX, window.innerWidth - width - 8))
                    const y = Math.max(8, Math.min(event.clientY, window.innerHeight - height - 8))
                    onOpenClipContextMenu(row.clip.id, x, y)
                  }}
                >
                  <div className="flex flex-col min-w-0 leading-tight">
                    <span className="truncate text-primary-300 text-[11px] font-semibold">{getClipPrimaryLabel(row.clip)}</span>
                    {getClipSecondaryLabel(row.clip) && (
                      <span className="truncate text-[9px] text-gray-500">{getClipSecondaryLabel(row.clip)}</span>
                    )}
                  </div>
                </td>

                {categoryGroups.map((group) =>
                  group.criteria.map((criterion) =>
                    judges.map((judge) => {
                      const key = getCriterionCellKey(row.clip.id, criterion.id, judge.key)
                      const note = judge.notes[row.clip.id] as NoteLike | undefined
                      const score = getCriterionNumericScore(note, criterion)
                      const displayed = criterionDraftCells[key] ?? formatCriterionValue(score)
                      const judgeColor = judgeColors[judge.key] ?? '#60a5fa'

                      return (
                        <td
                          key={`${row.clip.id}-${criterion.id}-${judge.key}`}
                          className="px-1 py-1 text-center border-r border-gray-800 font-mono"
                          style={{ color: judgeColor, backgroundColor: withAlpha(judgeColor, 0.05) }}
                        >
                          <input
                            type="number"
                            min={Number.isFinite(criterion.min) ? Number(criterion.min) : 0}
                            max={Number.isFinite(criterion.max) ? Number(criterion.max) : undefined}
                            step={Number.isFinite(criterion.step) ? Number(criterion.step) : 0.5}
                            value={displayed}
                            onChange={(event) => {
                              onSetCriterionDraftCell(key, event.target.value)
                            }}
                            onBlur={() => onCommitCriterionDraftCell(row.clip.id, criterion.id, judge.key)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault()
                                onCommitCriterionDraftCell(row.clip.id, criterion.id, judge.key)
                              } else if (event.key === 'Escape') {
                                onClearCriterionDraftCell(key)
                              }
                            }}
                            className="amv-soft-number w-full px-1 py-0.5 rounded bg-transparent border border-transparent hover:bg-surface-light/40 focus:bg-surface-dark focus:border-primary-500 focus-visible:outline-none outline-none text-center"
                            title={`${judge.judgeName} - ${group.category} - ${criterion.name}`}
                          />
                        </td>
                      )
                    }),
                  ),
                )}

                {canSortByScore &&
                  row.judgeTotals.map((score, judgeIdx) => {
                    const judge = judges[judgeIdx]
                    const color = judgeColors[judge.key] ?? '#60a5fa'
                    return (
                      <td
                        key={`${row.clip.id}-total-${judge.key}`}
                        className="px-2 py-1 text-center border-r border-gray-800 font-mono"
                        style={{ color, backgroundColor: withAlpha(color, 0.08) }}
                      >
                        {score.toFixed(1)}
                      </td>
                    )
                  })}

                {canSortByScore && (
                  <td className="px-2 py-1 text-center border-r border-gray-700 font-mono font-bold text-white">
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
