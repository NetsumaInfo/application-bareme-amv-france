import { useMemo } from 'react'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { withAlpha } from '@/utils/colors'
import { buildScoreExtreme, colorForExtreme, type ScoreExtreme } from '@/utils/scoreColor'
import { useUIStore } from '@/store/useUIStore'
import { hasAnyCriterionScore, type CategoryGroup, type JudgeSource, type NoteLike } from '@/utils/results'
import type { ResultatsRow } from '@/components/interfaces/resultats/types'
import { RESULTATS_PARTICIPANT_COLUMN_WIDTH_CLASS } from '@/components/interfaces/resultats/layout'
import { ClipMiniaturePreview } from '@/components/interfaces/spreadsheet/miniaturePreview'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
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
  /** Category currently used for sorting (highlights its header). */
  sortCategory?: string | null
  /** Direction of the active sort (drives the arrow icon). */
  sortDirection?: 'asc' | 'desc'
  /** Whether the global score sort is currently active (highlights the Total header). */
  sortByScoreActive?: boolean
  /** When provided, category headers become clickable to sort by that category. */
  onSortByCategory?: (category: string) => void
  /** When provided, the Total final header becomes clickable to sort by the global score. */
  onSortByTotal?: () => void
  /** When provided, renders a trailing "Commentaires" column (export only). */
  getRowComment?: (clipId: string) => string
  /** When provided, attaches the comment as a hover tooltip on the participant cell (HTML export). */
  getRowCommentTitle?: (clipId: string) => string
}

// Mean of judges' category scores for one clip, or null when nobody scored it.
function categoryAverageForRow(
  row: ResultatsRow,
  group: CategoryGroup,
  judges: JudgeSource[],
): number | null {
  const values = judges
    .map((judge, judgeIndex) => {
      const note = judge.notes[row.clip.id] as NoteLike | undefined
      if (!hasAnyCriterionScore(note, group.criteria)) return null
      return row.categoryJudgeScores[group.category]?.[judgeIndex] ?? 0
    })
    .filter((value): value is number => value !== null)
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
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
  sortCategory = null,
  sortDirection = 'desc',
  sortByScoreActive = false,
  onSortByCategory,
  onSortByTotal,
  getRowComment,
  getRowCommentTitle,
}: ResultatsGlobalCategoryTableProps) {
  const { t } = useI18n()
  const judgeBandMinWidth = Math.max(184, (judges.length + 1) * 68)

  const enableScoreColorCoding = useUIStore((s) => s.enableScoreColorCoding)
  const scoreColorApplyBase = useUIStore((s) => s.scoreColorApplyBase)
  const scoreColorApplyTotals = useUIStore((s) => s.scoreColorApplyTotals)
  const scoreColorHighHex = useUIStore((s) => s.scoreColorHighHex)
  const scoreColorLowHex = useUIStore((s) => s.scoreColorLowHex)
  const colorBase = enableScoreColorCoding && scoreColorApplyBase
  const colorTotals = enableScoreColorCoding && scoreColorApplyTotals

  // Per-category extreme (highest/lowest clip average) for cross-clip coloring.
  const categoryExtremes = useMemo(() => {
    const map = new Map<string, ScoreExtreme>()
    if (!colorBase) return map
    for (const group of categoryGroups) {
      const values: number[] = []
      for (const row of rows) {
        const avg = categoryAverageForRow(row, group, judges)
        if (avg !== null) values.push(avg)
      }
      const extreme = buildScoreExtreme(values)
      if (extreme) map.set(group.category, extreme)
    }
    return map
  }, [colorBase, categoryGroups, rows, judges])

  const totalExtreme = useMemo(() => {
    if (!colorTotals) return null
    const values: number[] = []
    for (const row of rows) {
      if (Number.isFinite(row.averageTotal) && row.averageTotal > 0) values.push(row.averageTotal)
    }
    return buildScoreExtreme(values)
  }, [colorTotals, rows])

  return (
    <div className={`relative isolate min-h-0 flex-1 ${staticExport ? 'overflow-visible' : 'amv-results-scroll'}`}>
      <table className="w-full min-w-max border-separate border-spacing-0 text-[11px]">
        <thead className={staticExport ? undefined : 'sticky top-0 z-60 bg-surface-dark shadow-[0_1px_0_rgba(55,65,81,0.75)]'}>
          <tr>
            <th
              rowSpan={2}
              className={` w-8 border-b border-r border-gray-700/60 bg-surface px-2 py-1 text-center text-[10px] font-medium text-gray-500`}
            >
              #
            </th>
            <th
              rowSpan={2}
              className={` border-b border-r border-gray-700/60 bg-surface px-2 py-1 text-left text-[10px] font-medium text-gray-500 ${RESULTATS_PARTICIPANT_COLUMN_WIDTH_CLASS}`}
            >
              {t('Participant')}
            </th>
            {categoryGroups.map((group) => {
              const isSortActive = sortCategory === group.category
              const sortable = Boolean(onSortByCategory)
              return (
                <th
                  key={group.category}
                  colSpan={1}
                  onClick={sortable ? () => onSortByCategory?.(group.category) : undefined}
                  className={`min-w-[220px] border-b border-r px-2 py-1 text-center text-[10px] font-semibold ${
                    sortable ? 'cursor-pointer select-none transition-colors hover:brightness-125' : ''
                  }`}
                  style={{
                    color: group.color,
                    backgroundColor: withAlpha(group.color, isSortActive ? 0.34 : 0.18),
                    borderColor: withAlpha(group.color, isSortActive ? 0.6 : 0.3),
                    minWidth: `${judgeBandMinWidth}px`,
                  }}
                >
                  <HoverTextTooltip text={sortable ? t('Trier par cette catégorie') : ''}>
                    <div>
                      <span className="inline-flex items-center justify-center gap-1">
                        {group.category}
                        <span aria-hidden="true" className="inline-block w-2.5 text-center">
                          {isSortActive ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                        </span>
                      </span>
                      <div className="text-gray-500 font-normal">/{group.totalMax}</div>
                    </div>
                  </HoverTextTooltip>
                </th>
              )
            })}
            <th
              onClick={onSortByTotal}
              title={onSortByTotal ? t('Trier par total') : undefined}
              className={`min-w-[88px] border-b border-r border-gray-700/60 px-2 py-1 text-center text-[10px] font-semibold ${
                sortByScoreActive ? 'bg-primary-600/15 text-white' : 'bg-surface'
              } ${onSortByTotal ? 'cursor-pointer select-none transition-colors hover:bg-surface-light/70' : ''}`}
            >
              {t('Total final')}
              {sortByScoreActive ? <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span> : null}
              <div className="text-gray-500 font-normal">/{currentBaremeTotalPoints}</div>
            </th>
            {getRowComment && (
              <th
                rowSpan={2}
                className="border-b border-r border-gray-700/60 bg-surface px-2 py-1 text-left align-middle text-[10px] font-semibold text-gray-500 min-w-[160px]"
              >
                {t('Commentaires')}
              </th>
            )}
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
                    >
                      <HoverTextTooltip text={judge.judgeName}>
                        <span className="block truncate">{judge.judgeName}</span>
                      </HoverTextTooltip>
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
            const commentTitle = getRowCommentTitle?.(row.clip.id)?.trim() || undefined
            return (
              <tr
                key={row.clip.id}
                onClick={() => onSelectClip(row.clip.id)}
                className={`amv-row-hover cursor-pointer transition-colors ${
                  index % 2 === 0 ? 'bg-surface-dark/16' : 'bg-transparent'
                }${isSelected ? ' amv-row-selected' : ''} hover:bg-white/5`}
              >
                <td className={` border-r border-gray-800/60 bg-surface px-2 py-1 text-center text-[10px] text-gray-500`}>
                  {index + 1}
                </td>
                <td
                  className={` border-r border-gray-800/60 bg-surface px-2 py-1 ${commentTitle ? 'cursor-help' : ''} ${RESULTATS_PARTICIPANT_COLUMN_WIDTH_CLASS}`}
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
                  <HoverTextTooltip text={commentTitle ?? ''}>
                  <div className={`flex flex-col min-w-0 ${staticExport ? 'leading-snug' : 'leading-tight'}`}>
                    <span className={`flex items-center gap-1 ${staticExport ? 'whitespace-normal wrap-break-word' : 'truncate'} text-[11px] font-semibold text-primary-300`}>
                      {getClipPrimaryLabel(row.clip)}
                      {commentTitle ? <span className="shrink-0 text-[9px] text-primary-400/80" aria-hidden="true">💬</span> : null}
                    </span>
                    {getClipSecondaryLabel(row.clip) && (
                      <span className={`${staticExport ? 'whitespace-normal wrap-break-word' : 'truncate'} text-[8px] text-gray-500`}>{getClipSecondaryLabel(row.clip)}</span>
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
                  </HoverTextTooltip>
                </td>

                {categoryGroups.map((group) => {
                  const categoryAvg = categoryAverageForRow(row, group, judges)
                  const categoryAvgColor =
                    categoryAvg !== null
                      ? colorForExtreme(
                          categoryAvg,
                          categoryExtremes.get(group.category),
                          scoreColorHighHex,
                          scoreColorLowHex,
                        )
                      : undefined
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
                        <div
                          className="px-2 py-1 text-center text-white/90"
                          style={categoryAvgColor ? { color: categoryAvgColor, fontWeight: 600 } : undefined}
                        >
                          {categoryAvg !== null ? categoryAvg.toFixed(1) : '-'}
                        </div>
                      </div>
                    </td>
                  )
                })}

                {(() => {
                  const totalColor = colorForExtreme(
                    row.averageTotal,
                    totalExtreme,
                    scoreColorHighHex,
                    scoreColorLowHex,
                  )
                  return (
                    <td
                      className="amv-number-ui border-r border-gray-700/60 px-2 py-1 text-center font-bold text-white"
                      style={totalColor ? { color: totalColor } : undefined}
                    >
                      {row.averageTotal.toFixed(1)}
                    </td>
                  )
                })()}

                {getRowComment && (
                  <td className="border-r border-gray-800/60 px-2 py-1 align-top text-[10px] leading-snug text-gray-300 whitespace-pre-line wrap-break-word min-w-[160px] max-w-[340px]">
                    {getRowComment(row.clip.id)}
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


