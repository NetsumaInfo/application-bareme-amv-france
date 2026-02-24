import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { withAlpha } from '@/utils/colors'
import { hasAnyCriterionScore, type CategoryGroup, type JudgeSource, type NoteLike } from '@/utils/results'
import type { ResultatsRow } from '@/components/interfaces/resultats/types'
import { ClipMiniaturePreview } from '@/components/interfaces/spreadsheet/miniaturePreview'

interface ResultatsGlobalCategoryTableProps {
  currentBaremeTotalPoints: number
  categoryGroups: CategoryGroup[]
  judges: JudgeSource[]
  judgeColors: Record<string, string>
  rows: ResultatsRow[]
  selectedClipId: string | null
  onSelectClip: (clipId: string) => void
  onOpenClipInNotation: (clipId: string) => void
  onOpenClipContextMenu: (clipId: string, x: number, y: number) => void
  showMiniatures: boolean
  thumbnailDefaultSeconds: number
}

function formatAverage(values: number[]): string {
  if (values.length === 0) return '-'
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length
  return avg.toFixed(1)
}

export function ResultatsGlobalCategoryTable({
  currentBaremeTotalPoints,
  categoryGroups,
  judges,
  judgeColors,
  rows,
  selectedClipId,
  onSelectClip,
  onOpenClipInNotation,
  onOpenClipContextMenu,
  showMiniatures,
  thumbnailDefaultSeconds,
}: ResultatsGlobalCategoryTableProps) {
  const judgeBandMinWidth = Math.max(220, (judges.length + 1) * 76)

  return (
    <div className="flex-1 overflow-auto rounded-lg border border-gray-700">
      <table className="w-full min-w-max border-collapse text-xs">
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
              className="px-1.5 py-1.5 text-left text-[10px] font-medium text-gray-500 border-r border-b border-gray-700 min-w-[104px] max-w-[152px] bg-surface-dark sticky left-8 z-20"
            >
              Clip
            </th>
            {categoryGroups.map((group) => (
              <th
                key={group.category}
                colSpan={1}
                className="px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider border-r border-b min-w-[240px]"
                style={{
                  color: group.color,
                  backgroundColor: withAlpha(group.color, 0.16),
                  borderColor: withAlpha(group.color, 0.3),
                  minWidth: `${judgeBandMinWidth}px`,
                }}
              >
                {group.category}
                <div className="text-gray-500 font-normal">/{group.totalMax}</div>
              </th>
            ))}
            <th className="px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider border-r border-b border-gray-700 min-w-[100px] bg-surface-dark">
              Total final
              <div className="text-gray-500 font-normal">/{currentBaremeTotalPoints}</div>
            </th>
          </tr>
          <tr>
            {categoryGroups.map((group) => (
              <th
                key={`${group.category}-heads`}
                colSpan={1}
                className="px-0 py-0 border-r border-b border-gray-700"
                style={{ minWidth: `${judgeBandMinWidth}px` }}
              >
                <div
                  className="grid"
                  style={{ gridTemplateColumns: `repeat(${judges.length + 1}, minmax(72px, 1fr))` }}
                >
                  {judges.map((judge) => (
                    <div
                      key={`${group.category}-${judge.key}-head`}
                      className="px-2 py-1 text-center text-[9px] border-r border-gray-700/70 truncate"
                      style={{
                        color: judgeColors[judge.key] ?? '#60a5fa',
                        backgroundColor: withAlpha(judgeColors[judge.key] ?? '#60a5fa', 0.08),
                      }}
                      title={judge.judgeName}
                    >
                      {judge.judgeName}
                    </div>
                  ))}
                  <div className="px-2 py-1 text-center text-[9px] text-gray-500 bg-surface-dark">Moy.</div>
                </div>
              </th>
            ))}
            <th className="px-2 py-1 text-center text-[9px] text-gray-500 border-r border-b border-gray-700 bg-surface-dark">
              Moy.
            </th>
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
                  className="px-1.5 py-1 border-r border-gray-800 sticky left-8 z-10 bg-surface-dark min-w-[104px] max-w-[152px]"
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
                      <span className="truncate text-[8px] text-gray-500">{getClipSecondaryLabel(row.clip)}</span>
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

                {categoryGroups.map((group) => {
                  return (
                    <td
                      key={`${row.clip.id}-${group.category}-judge-values`}
                      className="px-0 py-0 border-r border-gray-800 font-mono text-white/90"
                      style={{ minWidth: `${judgeBandMinWidth}px` }}
                    >
                      <div
                        className="grid"
                        style={{ gridTemplateColumns: `repeat(${judges.length + 1}, minmax(72px, 1fr))` }}
                      >
                        {judges.map((judge, judgeIndex) => {
                          const note = judge.notes[row.clip.id] as NoteLike | undefined
                          const hasScore = hasAnyCriterionScore(note, group.criteria)
                          const value = row.categoryJudgeScores[group.category]?.[judgeIndex] ?? 0
                          return (
                            <div
                              key={`${row.clip.id}-${group.category}-${judge.key}`}
                              className="px-2 py-1 text-center border-r border-gray-800/70"
                              style={{ color: judgeColors[judge.key] ?? '#60a5fa' }}
                            >
                              {hasScore ? value.toFixed(1) : '-'}
                            </div>
                          )
                        })}
                        <div className="px-2 py-1 text-center text-white/90">
                          {formatAverage(
                            judges
                              .map((judge, judgeIndex) => {
                                const note = judge.notes[row.clip.id] as NoteLike | undefined
                                if (!hasAnyCriterionScore(note, group.criteria)) return null
                                return row.categoryJudgeScores[group.category]?.[judgeIndex] ?? 0
                              })
                              .filter((value): value is number => value !== null),
                          )}
                        </div>
                      </div>
                    </td>
                  )
                })}

                <td className="px-2 py-1 text-center border-r border-gray-700 font-mono font-bold text-white">
                  {row.averageTotal.toFixed(1)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
