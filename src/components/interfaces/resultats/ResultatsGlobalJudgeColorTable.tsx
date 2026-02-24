import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { withAlpha } from '@/utils/colors'
import { getGroupStep } from '@/components/interfaces/resultats/scoreDistribution'
import type { CategoryGroup, JudgeSource } from '@/utils/results'
import type { ResultatsRow } from '@/components/interfaces/resultats/types'

interface ResultatsGlobalJudgeColorTableProps {
  canSortByScore: boolean
  currentBaremeTotalPoints: number
  categoryGroups: CategoryGroup[]
  judges: JudgeSource[]
  rows: ResultatsRow[]
  judgeColors: Record<string, string>
  selectedClipId: string | null
  draftCells: Record<string, string>
  onSelectClip: (clipId: string) => void
  onOpenClipInNotation: (clipId: string) => void
  onOpenClipContextMenu: (clipId: string, x: number, y: number) => void
  getCellKey: (clipId: string, category: string, judgeKey: string) => string
  onSetDraftCell: (key: string, value: string) => void
  onCommitDraftCell: (clipId: string, category: string, judgeKey: string) => void
  onClearDraftCell: (key: string) => void
}

export function ResultatsGlobalJudgeColorTable({
  canSortByScore,
  currentBaremeTotalPoints,
  categoryGroups,
  judges,
  rows,
  judgeColors,
  selectedClipId,
  draftCells,
  onSelectClip,
  onOpenClipInNotation,
  onOpenClipContextMenu,
  getCellKey,
  onSetDraftCell,
  onCommitDraftCell,
  onClearDraftCell,
}: ResultatsGlobalJudgeColorTableProps) {
  return (
    <div className="flex-1 overflow-auto rounded-lg border border-gray-700">
      <div className="px-2 py-1.5 border-b border-gray-700 flex flex-wrap items-center gap-2 bg-surface-dark/80">
        {judges.map((judge) => {
          const color = judgeColors[judge.key] ?? '#60a5fa'
          return (
            <span
              key={`legend-${judge.key}`}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] border"
              style={{
                color,
                borderColor: withAlpha(color, 0.45),
                backgroundColor: withAlpha(color, 0.12),
              }}
            >
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {judge.judgeName}
            </span>
          )
        })}
      </div>

      <table className="w-full border-collapse text-xs">
        <thead className="sticky top-0 z-10">
          <tr>
            <th
              rowSpan={2}
              className="px-2 py-1.5 text-center text-[10px] font-medium text-gray-500 border-r border-b border-gray-700 w-8 bg-surface-dark sticky left-0 z-20"
            >
              #
            </th>
            <th
              rowSpan={2}
              className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 border-r border-b border-gray-700 min-w-[120px] max-w-[180px] bg-surface-dark sticky left-8 z-20"
            >
              Clip
            </th>
            {categoryGroups.map((group) => (
              <th
                key={group.category}
                colSpan={judges.length}
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
              judges.map((judge) => {
                const color = judgeColors[judge.key] ?? '#60a5fa'
                return (
                  <th
                    key={`${group.category}-${judge.key}`}
                    className="px-1 py-1 text-center text-[9px] border-r border-b border-gray-700"
                    style={{
                      backgroundColor: withAlpha(group.color, 0.06),
                      color,
                      boxShadow: `inset 0 2px 0 0 ${withAlpha(color, 0.95)}`,
                    }}
                    title={judge.judgeName}
                  >
                    <span className="inline-flex items-center justify-center w-3 h-3 rounded-full border" style={{ borderColor: withAlpha(color, 0.7), backgroundColor: withAlpha(color, 0.2) }} />
                  </th>
                )
              }),
            )}

            {canSortByScore && judges.map((judge) => {
              const color = judgeColors[judge.key] ?? '#60a5fa'
              return (
                <th
                  key={`total-${judge.key}`}
                  className="px-1 py-1 text-center text-[9px] border-r border-b border-gray-700"
                  style={{ backgroundColor: withAlpha(color, 0.1), color }}
                >
                  {judge.judgeName}
                </th>
              )
            })}

            {canSortByScore && (
              <th className="px-1 py-1 text-center text-[9px] text-gray-500 border-r border-b border-gray-700 bg-surface-dark">
                Moy.
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
                    const width = 220
                    const height = 210
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
                  judges.map((judge, judgeIdx) => {
                    const key = getCellKey(row.clip.id, group.category, judge.key)
                    const score = row.categoryJudgeScores[group.category][judgeIdx] ?? 0
                    const displayed = draftCells[key] ?? score.toFixed(1)
                    const step = getGroupStep(group.criteria)
                    const judgeColor = judgeColors[judge.key] ?? '#60a5fa'

                    return (
                      <td
                        key={`${row.clip.id}-${group.category}-${judge.key}`}
                        className="px-1 py-1 text-center border-r border-gray-800 font-mono"
                        style={{ color: judgeColor, backgroundColor: withAlpha(judgeColor, 0.05) }}
                      >
                        <input
                          type="number"
                          min={0}
                          max={group.totalMax}
                          step={step}
                          value={displayed}
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
                          className="amv-soft-number w-full px-1 py-0.5 rounded bg-transparent border border-transparent hover:bg-surface-light/40 focus:bg-surface-dark focus:border-primary-500 focus-visible:outline-none outline-none text-center"
                          title={`${judge.judgeName} - ${group.category}`}
                        />
                      </td>
                    )
                  }),
                )}

                {canSortByScore && row.judgeTotals.map((score, judgeIdx) => {
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
