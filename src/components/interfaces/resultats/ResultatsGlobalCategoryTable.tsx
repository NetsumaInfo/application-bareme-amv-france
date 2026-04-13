import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { withAlpha } from '@/utils/colors'
import { hasAnyCriterionScore, type CategoryGroup, type JudgeSource, type NoteLike } from '@/utils/results'
import type { ResultatsRow } from '@/components/interfaces/resultats/types'
import { RESULTATS_PARTICIPANT_COLUMN_WIDTH_CLASS } from '@/components/interfaces/resultats/layout'
import { ClipMiniaturePreview } from '@/components/interfaces/spreadsheet/miniaturePreview'
import { useI18n } from '@/i18n'

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
  forceMiniatureLoad?: boolean
  staticExport?: boolean
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
  forceMiniatureLoad = false,
  staticExport = false,
}: ResultatsGlobalCategoryTableProps) {
  const { t } = useI18n()
  const judgeBandMinWidth = Math.max(184, (judges.length + 1) * 68)

  return (
    <div className={`min-h-0 flex-1 ${staticExport ? 'overflow-visible' : 'overflow-auto'}`}>
      <table className="w-full min-w-max border-collapse text-[11px]">
        <thead className={staticExport ? undefined : 'sticky top-0 z-10'}>
          <tr>
            <th
              rowSpan={2}
              className={`${staticExport ? '' : 'sticky left-0 z-20'} w-8 border-b border-r border-gray-700/60 bg-surface px-2 py-1 text-center text-[10px] font-medium text-gray-500`}
            >
              #
            </th>
            <th
              rowSpan={2}
              className={`${staticExport ? '' : 'sticky left-8 z-20'} border-b border-r border-gray-700/60 bg-surface px-2 py-1 text-left text-[10px] font-medium text-gray-500 ${RESULTATS_PARTICIPANT_COLUMN_WIDTH_CLASS}`}
            >
              {t('Participant')}
            </th>
            {categoryGroups.map((group) => (
              <th
                key={group.category}
                colSpan={1}
                className="min-w-[220px] border-b border-r px-2 py-1 text-center text-[10px] font-semibold"
                style={{
                  color: group.color,
                  backgroundColor: withAlpha(group.color, 0.18),
                  borderColor: withAlpha(group.color, 0.3),
                  minWidth: `${judgeBandMinWidth}px`,
                }}
              >
                {group.category}
                <div className="text-gray-500 font-normal">/{group.totalMax}</div>
              </th>
            ))}
            <th className="min-w-[88px] border-b border-r border-gray-700/60 bg-surface px-2 py-1 text-center text-[10px] font-semibold">
              {t('Total final')}
              <div className="text-gray-500 font-normal">/{currentBaremeTotalPoints}</div>
            </th>
          </tr>
          <tr>
            {categoryGroups.map((group) => (
              <th
                key={`${group.category}-heads`}
                colSpan={1}
                className="border-b border-r border-gray-700/60 px-0 py-0"
                style={{ minWidth: `${judgeBandMinWidth}px` }}
              >
                <div
                  className="grid"
                  style={{ gridTemplateColumns: `repeat(${judges.length + 1}, minmax(64px, 1fr))` }}
                >
                  {judges.map((judge) => (
                    <div
                      key={`${group.category}-${judge.key}-head`}
                      className="truncate border-r border-gray-700/50 px-1.5 py-1 text-center text-[9px]"
                      style={{
                        color: judgeColors[judge.key] ?? '#60a5fa',
                        backgroundColor: withAlpha(judgeColors[judge.key] ?? '#60a5fa', 0.05),
                      }}
                      title={judge.judgeName}
                    >
                      {judge.judgeName}
                    </div>
                  ))}
                  <div className="bg-surface px-1.5 py-1 text-center text-[9px] text-gray-500">{t('Moy.')}</div>
                </div>
              </th>
            ))}
            <th className="border-b border-r border-gray-700/60 bg-surface px-2 py-1 text-center text-[9px] text-gray-500">
              {t('Moy.')}
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
                    ? 'bg-white/[0.06]'
                    : index % 2 === 0
                      ? 'bg-surface-dark/16'
                      : 'bg-transparent'
                } hover:bg-white/[0.05]`}
              >
                <td className={`${staticExport ? '' : 'sticky left-0 z-10'} border-r border-gray-800/60 bg-surface px-2 py-1 text-center text-[10px] text-gray-500`}>
                  {index + 1}
                </td>
                <td
                  className={`${staticExport ? '' : 'sticky left-8 z-10'} border-r border-gray-800/60 bg-surface px-2 py-1 ${RESULTATS_PARTICIPANT_COLUMN_WIDTH_CLASS}`}
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
                    <span className={`${staticExport ? 'whitespace-normal break-words' : 'truncate'} text-[11px] font-semibold text-primary-300`}>{getClipPrimaryLabel(row.clip)}</span>
                    {getClipSecondaryLabel(row.clip) && (
                      <span className={`${staticExport ? 'whitespace-normal break-words' : 'truncate'} text-[8px] text-gray-500`}>{getClipSecondaryLabel(row.clip)}</span>
                    )}
                    {showMiniatures && row.clip.filePath ? (
                      <ClipMiniaturePreview
                        clip={row.clip}
                        enabled={showMiniatures}
                        defaultSeconds={thumbnailDefaultSeconds}
                        forceLoad={forceMiniatureLoad}
                      />
                    ) : null}
                  </div>
                </td>

                {categoryGroups.map((group) => {
                  return (
                    <td
                      key={`${row.clip.id}-${group.category}-judge-values`}
                      className="amv-number-ui border-r border-gray-800/60 px-0 py-0 text-white/90"
                      style={{ minWidth: `${judgeBandMinWidth}px` }}
                    >
                      <div
                        className="grid"
                        style={{ gridTemplateColumns: `repeat(${judges.length + 1}, minmax(64px, 1fr))` }}
                      >
                        {judges.map((judge, judgeIndex) => {
                          const note = judge.notes[row.clip.id] as NoteLike | undefined
                          const hasScore = hasAnyCriterionScore(note, group.criteria)
                          const value = row.categoryJudgeScores[group.category]?.[judgeIndex] ?? 0
                          return (
                            <div
                              key={`${row.clip.id}-${group.category}-${judge.key}`}
                              className="border-r border-gray-800/50 px-1.5 py-1 text-center"
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

                <td className="amv-number-ui border-r border-gray-700/60 px-2 py-1 text-center font-bold text-white">
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
