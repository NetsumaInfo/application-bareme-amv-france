import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { withAlpha } from '@/utils/colors'
import {
  getCriterionNumericScore,
  type CategoryGroup,
  type JudgeSource,
  type NoteLike,
} from '@/utils/results'
import type { ResultatsRow } from '@/components/interfaces/resultats/types'
import { ClipMiniaturePreview } from '@/components/interfaces/spreadsheet/miniaturePreview'
import { useI18n } from '@/i18n'

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
  showMiniatures: boolean
  thumbnailDefaultSeconds: number
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
  showMiniatures,
  thumbnailDefaultSeconds,
}: ResultatsGlobalDetailedTableProps) {
  const { t } = useI18n()
  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full border-collapse text-[11px]">
        <thead className="sticky top-0 z-10">
          <tr>
            <th
              rowSpan={3}
              className="sticky left-0 z-20 w-8 border-b border-r border-gray-700/60 bg-surface px-2 py-1 text-center text-[10px] font-medium text-gray-500"
            >
              #
            </th>
            <th
              rowSpan={3}
              className="sticky left-8 z-20 min-w-[112px] max-w-[160px] border-b border-r border-gray-700/60 bg-surface px-2 py-1 text-left text-[10px] font-medium text-gray-500"
            >
              {t('Clip')}
            </th>
            {categoryGroups.map((group) => (
              <th
                key={group.category}
                colSpan={group.criteria.length * judges.length}
                className="border-b border-r px-2 py-1 text-center text-[10px] font-semibold"
                style={{
                  color: group.color,
                  backgroundColor: withAlpha(group.color, 0.12),
                  borderColor: withAlpha(group.color, 0.24),
                }}
              >
                {group.category}
                <span className="ml-1 text-gray-500 font-normal">/{group.totalMax}</span>
              </th>
            ))}
            {canSortByScore && (
              <th
                colSpan={judges.length + 1}
                className="min-w-[88px] border-b border-r border-gray-700/60 bg-surface px-2 py-1 text-center text-[10px] font-semibold"
              >
                {t('Total')}
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
                  className="border-b border-r border-gray-700/60 px-1.5 py-1 text-center text-[9px] font-medium"
                  style={{
                    color: withAlpha(group.color, 0.92),
                    backgroundColor: withAlpha(group.color, 0.05),
                  }}
                >
                  {criterion.name}
                  <span className="ml-1 text-gray-500 font-normal">/{criterion.max}</span>
                </th>
              )),
            )}

            {canSortByScore &&
              judges.map((judge) => (
                <th
                  key={`total-head-${judge.key}`}
                  rowSpan={2}
                  className="border-b border-r border-gray-700/60 px-1 py-1 text-center text-[9px]"
                  style={{
                    color: judgeColors[judge.key] ?? '#60a5fa',
                    backgroundColor: withAlpha(judgeColors[judge.key] ?? '#60a5fa', 0.04),
                  }}
                >
                  {judge.judgeName}
                </th>
              ))}
            {canSortByScore && (
              <th
                rowSpan={2}
                className="border-b border-r border-gray-700/60 bg-surface px-1 py-1 text-center text-[9px] text-gray-500"
              >
                {t('Moy.')}
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
                      className="border-b border-r border-gray-700/60 px-1 py-1 text-center text-[9px]"
                      style={{
                        color,
                        backgroundColor: withAlpha(color, 0.03),
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
                    ? 'bg-white/[0.04]'
                    : index % 2 === 0
                      ? 'bg-surface-dark/10'
                      : 'bg-transparent'
                } hover:bg-white/[0.03]`}
              >
                <td className="sticky left-0 z-10 border-r border-gray-800/60 bg-surface px-2 py-1 text-center text-[10px] text-gray-500">
                  {index + 1}
                </td>
                <td
                  className="sticky left-8 z-10 max-w-[160px] border-r border-gray-800/60 bg-surface px-2 py-1"
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
                  <div className="flex flex-col min-w-0 leading-tight">
                    <span className="truncate text-[11px] font-semibold text-primary-300">{getClipPrimaryLabel(row.clip)}</span>
                    {getClipSecondaryLabel(row.clip) && (
                      <span className="truncate text-[9px] text-gray-500">{getClipSecondaryLabel(row.clip)}</span>
                    )}
                    {showMiniatures && row.clip.filePath ? (
                      <ClipMiniaturePreview
                        clip={row.clip}
                        enabled={showMiniatures}
                        defaultSeconds={thumbnailDefaultSeconds}
                      />
                    ) : null}
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
                          className="border-r border-gray-800/60 px-1 py-1 text-center font-mono"
                          style={{ color: judgeColor, backgroundColor: withAlpha(judgeColor, 0.03) }}
                        >
                          <input
                            type="number"
                            min={Number.isFinite(criterion.min) ? Number(criterion.min) : 0}
                            max={Number.isFinite(criterion.max) ? Number(criterion.max) : undefined}
                            step={Number.isFinite(criterion.step) ? Number(criterion.step) : 0.5}
                            value={displayed}
                            onContextMenu={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              onOpenClipContextMenu(row.clip.id, event.clientX, event.clientY)
                            }}
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
                            className="amv-soft-number w-full rounded-sm border border-transparent bg-transparent px-1 py-0.5 text-center hover:bg-white/[0.03] focus:bg-surface-dark focus:border-gray-600 focus-visible:outline-none outline-none"
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
                        className="border-r border-gray-800/60 px-2 py-1 text-center font-mono"
                        style={{ color, backgroundColor: withAlpha(color, 0.04) }}
                      >
                        {score.toFixed(1)}
                      </td>
                    )
                  })}

                {canSortByScore && (
                  <td className="border-r border-gray-700/60 px-2 py-1 text-center font-mono font-bold text-white">
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
