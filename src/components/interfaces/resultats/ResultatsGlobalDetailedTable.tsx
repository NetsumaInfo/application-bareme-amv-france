import { memo, useCallback, useMemo } from 'react'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { withAlpha } from '@/utils/colors'
import { buildScoreExtreme, colorForExtreme, type ScoreExtreme } from '@/utils/scoreColor'
import { useUIStore } from '@/store/useUIStore'
import {
  getCriterionNumericScore,
  hasAnyCriterionScore,
  type CategoryGroup,
  type JudgeSource,
  type NoteLike,
} from '@/utils/results'
import type { ResultatsRow } from '@/components/interfaces/resultats/types'
import { RESULTATS_PARTICIPANT_COLUMN_WIDTH_CLASS } from '@/components/interfaces/resultats/layout'
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
  readOnly?: boolean
  forceMiniatureLoad?: boolean
  staticExport?: boolean
  /** Criterion currently used for sorting (highlights its header). */
  sortCriterion?: string | null
  /** Category currently used for sorting (highlights its header band). */
  sortCategory?: string | null
  /** Direction of the active sort (drives the arrow icon). */
  sortDirection?: 'asc' | 'desc'
  /** When provided, criterion headers become clickable to sort by that criterion. */
  onSortByCriterion?: (criterionId: string) => void
  /** When provided, category header bands become clickable to sort by that category total. */
  onSortByCategory?: (category: string) => void
  /** When provided, renders a trailing "Commentaires" column (export only). */
  getRowComment?: (clipId: string) => string
  /** When provided, attaches the comment as a hover tooltip on the participant cell (HTML export). */
  getRowCommentTitle?: (clipId: string) => string
}

function formatCriterionValue(value: number): string {
  if (!Number.isFinite(value)) return '0'
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(2).replace(/\.?0+$/, '')
}

interface ResultatsGlobalDetailedRowProps {
  row: ResultatsRow
  index: number
  isSelected: boolean
  canSortByScore: boolean
  categoryGroups: CategoryGroup[]
  judges: JudgeSource[]
  judgeColors: Record<string, string>
  criterionDraftCells: Record<string, string>
  onSelectClip: (clipId: string) => void
  onOpenClipInNotation: (clipId: string) => void
  onOpenClipContextMenu: (clipId: string, x: number, y: number) => void
  getCriterionCellKey: (clipId: string, criterionId: string, judgeKey: string) => string
  onSetCriterionDraftCell: (key: string, value: string) => void
  onCommitCriterionDraftCell: (clipId: string, criterionId: string, judgeKey: string) => void
  onClearCriterionDraftCell: (key: string) => void
  getCriterionColor: (criterionId: string, judgeKey: string, value: number, hasScore: boolean) => string | undefined
  getJudgeTotalColor: (judgeKey: string, value: number) => string | undefined
  getAverageTotalColor: (value: number) => string | undefined
  showMiniatures: boolean
  thumbnailDefaultSeconds: number
  readOnly: boolean
  forceMiniatureLoad: boolean
  staticExport: boolean
  getRowComment?: (clipId: string) => string
  getRowCommentTitle?: (clipId: string) => string
}

function ResultatsGlobalDetailedRowComponent({
  row,
  index,
  isSelected,
  canSortByScore,
  categoryGroups,
  judges,
  judgeColors,
  criterionDraftCells,
  onSelectClip,
  onOpenClipInNotation,
  onOpenClipContextMenu,
  getCriterionCellKey,
  onSetCriterionDraftCell,
  onCommitCriterionDraftCell,
  onClearCriterionDraftCell,
  getCriterionColor,
  getJudgeTotalColor,
  getAverageTotalColor,
  showMiniatures,
  thumbnailDefaultSeconds,
  readOnly,
  forceMiniatureLoad,
  staticExport,
  getRowComment,
  getRowCommentTitle,
}: ResultatsGlobalDetailedRowProps) {
  const commentTitle = getRowCommentTitle?.(row.clip.id)?.trim() || undefined
  return (
    <tr
      onClick={() => onSelectClip(row.clip.id)}
      className={`amv-row-hover cursor-pointer transition-colors ${
        index % 2 === 0 ? 'bg-white/4' : 'bg-transparent'
      }${isSelected ? ' amv-row-selected' : ''} hover:bg-white/6`}
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
            <span className={`${staticExport ? 'whitespace-normal wrap-break-word' : 'truncate'} text-[9px] text-gray-500`}>{getClipSecondaryLabel(row.clip)}</span>
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

      {categoryGroups.map((group) =>
        group.criteria.map((criterion) =>
          judges.map((judge) => {
            const key = getCriterionCellKey(row.clip.id, criterion.id, judge.key)
            const note = judge.notes[row.clip.id] as NoteLike | undefined
            const score = getCriterionNumericScore(note, criterion)
            const displayed = criterionDraftCells[key] ?? formatCriterionValue(score)
            const judgeColor = judgeColors[judge.key] ?? '#60a5fa'
            const highlight = getCriterionColor(
              criterion.id,
              judge.key,
              score,
              hasAnyCriterionScore(note, [criterion]),
            )

            return (
              <td
                key={`${row.clip.id}-${criterion.id}-${judge.key}`}
                className="amv-number-ui border-r border-gray-800/60 px-1 py-1 text-center"
                style={{
                  color: highlight ?? judgeColor,
                  backgroundColor: withAlpha(judgeColor, 0.05),
                  fontWeight: highlight ? 600 : undefined,
                }}
              >
                {readOnly ? (
                  <span className="block w-full rounded-xs border border-transparent bg-transparent px-1 py-0.5 text-center">
                    {displayed}
                  </span>
                ) : (
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
                    aria-label={`${criterion.name} - ${judge.key}`}
                    className="amv-soft-number w-full rounded-xs border border-transparent bg-transparent px-1 py-0.5 text-center hover:bg-white/5 focus:bg-surface-dark focus:border-gray-600 focus-visible:outline-hidden outline-hidden"
                  />
                )}
              </td>
            )
          }),
        ),
      )}

      {canSortByScore &&
        row.judgeTotals.map((score, judgeIdx) => {
          const judge = judges[judgeIdx]
          const color = judgeColors[judge.key] ?? '#60a5fa'
          const totalColor = getJudgeTotalColor(judge.key, score)
          return (
            <td
              key={`${row.clip.id}-total-${judge.key}`}
              className="amv-number-ui border-r border-gray-800/60 px-2 py-1 text-center"
              style={{
                color: totalColor ?? color,
                backgroundColor: withAlpha(color, 0.06),
                fontWeight: totalColor ? 600 : undefined,
              }}
            >
              {score.toFixed(1)}
            </td>
          )
        })}

      {canSortByScore && (() => {
        const avgColor = getAverageTotalColor(row.averageTotal)
        return (
          <td
            className="amv-number-ui border-r border-gray-700/60 px-2 py-1 text-center font-bold text-white"
            style={avgColor ? { color: avgColor } : undefined}
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
}

const ResultatsGlobalDetailedRow = memo(ResultatsGlobalDetailedRowComponent)

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
  readOnly = false,
  forceMiniatureLoad = false,
  staticExport = false,
  sortCriterion = null,
  sortCategory = null,
  sortDirection = 'desc',
  onSortByCriterion,
  onSortByCategory,
  getRowComment,
  getRowCommentTitle,
}: ResultatsGlobalDetailedTableProps) {
  const { t } = useI18n()

  const enableScoreColorCoding = useUIStore((s) => s.enableScoreColorCoding)
  const scoreColorApplyBase = useUIStore((s) => s.scoreColorApplyBase)
  const scoreColorApplyTotals = useUIStore((s) => s.scoreColorApplyTotals)
  const scoreColorHighHex = useUIStore((s) => s.scoreColorHighHex)
  const scoreColorLowHex = useUIStore((s) => s.scoreColorLowHex)
  const colorBase = enableScoreColorCoding && scoreColorApplyBase
  const colorTotals = enableScoreColorCoding && scoreColorApplyTotals

  // Extreme per (criterion + judge) column across clips.
  const criterionJudgeExtremes = useMemo(() => {
    const map = new Map<string, ScoreExtreme>()
    if (!colorBase) return map
    for (const group of categoryGroups) {
      for (const criterion of group.criteria) {
        for (const judge of judges) {
          const values: number[] = []
          for (const row of rows) {
            const note = judge.notes[row.clip.id] as NoteLike | undefined
            if (!hasAnyCriterionScore(note, [criterion])) continue
            values.push(getCriterionNumericScore(note, criterion))
          }
          const extreme = buildScoreExtreme(values)
          if (extreme) map.set(`${criterion.id}::${judge.key}`, extreme)
        }
      }
    }
    return map
  }, [colorBase, categoryGroups, judges, rows])

  // Extreme per judge total column across clips.
  const judgeTotalExtremes = useMemo(() => {
    const map = new Map<string, ScoreExtreme>()
    if (!colorTotals) return map
    judges.forEach((judge, judgeIndex) => {
      const values: number[] = []
      for (const row of rows) {
        const value = row.judgeTotals[judgeIndex]
        if (Number.isFinite(value) && value > 0) values.push(value)
      }
      const extreme = buildScoreExtreme(values)
      if (extreme) map.set(judge.key, extreme)
    })
    return map
  }, [colorTotals, judges, rows])

  const averageTotalExtreme = useMemo(() => {
    if (!colorTotals) return null
    const values: number[] = []
    for (const row of rows) {
      if (Number.isFinite(row.averageTotal) && row.averageTotal > 0) values.push(row.averageTotal)
    }
    return buildScoreExtreme(values)
  }, [colorTotals, rows])

  const getCriterionColor = useCallback(
    (criterionId: string, judgeKey: string, value: number, hasScore: boolean) =>
      hasScore
        ? colorForExtreme(value, criterionJudgeExtremes.get(`${criterionId}::${judgeKey}`), scoreColorHighHex, scoreColorLowHex)
        : undefined,
    [criterionJudgeExtremes, scoreColorHighHex, scoreColorLowHex],
  )

  const getJudgeTotalColor = useCallback(
    (judgeKey: string, value: number) =>
      colorForExtreme(value, judgeTotalExtremes.get(judgeKey), scoreColorHighHex, scoreColorLowHex),
    [judgeTotalExtremes, scoreColorHighHex, scoreColorLowHex],
  )

  const getAverageTotalColor = useCallback(
    (value: number) => colorForExtreme(value, averageTotalExtreme, scoreColorHighHex, scoreColorLowHex),
    [averageTotalExtreme, scoreColorHighHex, scoreColorLowHex],
  )

  return (
    <div className={`relative isolate min-h-0 flex-1 ${staticExport ? 'overflow-visible' : 'amv-results-scroll'}`}>
      <table className="w-full border-separate border-spacing-0 text-[11px]">
        <thead className={staticExport ? undefined : 'sticky top-0 z-60 bg-surface-dark shadow-[0_1px_0_rgba(55,65,81,0.75)]'}>
          <tr>
            <th
              rowSpan={3}
              className={` w-8 border-b border-r border-gray-700/60 bg-surface px-2 py-1 text-center text-[10px] font-medium text-gray-500`}
            >
              #
            </th>
            <th
              rowSpan={3}
              className={` border-b border-r border-gray-700/60 bg-surface px-2 py-1 text-left text-[10px] font-medium text-gray-500 ${RESULTATS_PARTICIPANT_COLUMN_WIDTH_CLASS}`}
            >
              {t('Participant')}
            </th>
            {categoryGroups.map((group) => {
              const isCategorySortActive = sortCategory === group.category
              const categorySortable = Boolean(onSortByCategory)
              return (
                <th
                  key={group.category}
                  colSpan={group.criteria.length * judges.length}
                  onClick={categorySortable ? () => onSortByCategory?.(group.category) : undefined}
                  title={categorySortable ? t('Trier par {category}', { category: group.category }) : undefined}
                  className={`border-b border-r px-2 py-1 text-center text-[10px] font-semibold ${
                    categorySortable ? 'cursor-pointer select-none transition-[filter] hover:brightness-125' : ''
                  }`}
                  style={{
                    color: group.color,
                    backgroundColor: withAlpha(group.color, isCategorySortActive ? 0.3 : 0.18),
                    borderColor: withAlpha(group.color, 0.3),
                  }}
                >
                  {group.category}
                  <span className="ml-1 text-gray-500 font-normal">/{group.totalMax}</span>
                  {isCategorySortActive ? (
                    <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  ) : null}
                </th>
              )
            })}
            {canSortByScore && (
              <th
                colSpan={judges.length + 1}
                className="min-w-[88px] border-b border-r border-gray-700/60 bg-surface px-2 py-1 text-center text-[10px] font-semibold"
              >
                {t('Total')}
                <div className="text-gray-500 font-normal">/{currentBaremeTotalPoints}</div>
              </th>
            )}
            {getRowComment && (
              <th
                rowSpan={3}
                className="border-b border-r border-gray-700/60 bg-surface px-2 py-1 text-left align-middle text-[10px] font-medium text-gray-500 min-w-[160px]"
              >
                {t('Commentaires')}
              </th>
            )}
          </tr>

          <tr>
            {categoryGroups.map((group) =>
              group.criteria.map((criterion) => {
                const isSortActive = sortCriterion === criterion.id
                const sortable = Boolean(onSortByCriterion)
                return (
                  <th
                    key={`${group.category}-${criterion.id}-criterion`}
                    colSpan={judges.length}
                    onClick={sortable ? () => onSortByCriterion?.(criterion.id) : undefined}
                    className={`border-b border-r border-gray-700/60 px-1.5 py-1 text-center text-[9px] font-medium ${
                      sortable ? 'cursor-pointer select-none transition-colors hover:brightness-125' : ''
                    }`}
                    style={{
                      color: withAlpha(group.color, 0.92),
                      backgroundColor: withAlpha(group.color, isSortActive ? 0.22 : 0.08),
                    }}
                  >
                    <HoverTextTooltip text={sortable ? t('Trier par ce critère') : ''}>
                      <div>
                        <span className="inline-flex items-center justify-center gap-1">
                          {criterion.name}
                          <span aria-hidden="true" className="inline-block w-2.5 text-center">
                            {isSortActive ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                          </span>
                        </span>
                        <span className="ml-1 text-gray-500 font-normal">/{criterion.max}</span>
                      </div>
                    </HoverTextTooltip>
                  </th>
                )
              }),
            )}

            {canSortByScore &&
              judges.map((judge) => (
                <th
                  key={`total-head-${judge.key}`}
                  rowSpan={2}
                  className="border-b border-r border-gray-700/60 px-1 py-1 text-center text-[9px]"
                  style={{
                    color: judgeColors[judge.key] ?? '#60a5fa',
                    backgroundColor: withAlpha(judgeColors[judge.key] ?? '#60a5fa', 0.07),
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
                        backgroundColor: withAlpha(color, 0.05),
                      }}
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
          {rows.map((row, index) => (
            <ResultatsGlobalDetailedRow
              key={row.clip.id}
              row={row}
              index={index}
              isSelected={selectedClipId === row.clip.id}
              canSortByScore={canSortByScore}
              categoryGroups={categoryGroups}
              judges={judges}
              judgeColors={judgeColors}
              criterionDraftCells={criterionDraftCells}
              onSelectClip={onSelectClip}
              onOpenClipInNotation={onOpenClipInNotation}
              onOpenClipContextMenu={onOpenClipContextMenu}
              getCriterionCellKey={getCriterionCellKey}
              onSetCriterionDraftCell={onSetCriterionDraftCell}
              onCommitCriterionDraftCell={onCommitCriterionDraftCell}
              onClearCriterionDraftCell={onClearCriterionDraftCell}
              getCriterionColor={getCriterionColor}
              getJudgeTotalColor={getJudgeTotalColor}
              getAverageTotalColor={getAverageTotalColor}
              showMiniatures={showMiniatures}
              thumbnailDefaultSeconds={thumbnailDefaultSeconds}
              readOnly={readOnly}
              forceMiniatureLoad={forceMiniatureLoad}
              staticExport={staticExport}
              getRowComment={getRowComment}
              getRowCommentTitle={getRowCommentTitle}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}


