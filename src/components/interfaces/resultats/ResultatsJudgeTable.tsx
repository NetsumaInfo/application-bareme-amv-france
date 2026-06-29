import { memo, useCallback, useMemo } from 'react'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { withAlpha } from '@/utils/colors'
import { buildScoreExtreme, colorForExtreme, type ScoreExtreme } from '@/utils/scoreColor'
import { useUIStore } from '@/store/useUIStore'
import { getCriterionNumericScore, hasAnyCriterionScore, type CategoryGroup, type JudgeSource, type NoteLike } from '@/utils/results'
import type { ResultatsRow } from '@/components/interfaces/resultats/types'
import { RESULTATS_PARTICIPANT_COLUMN_WIDTH_CLASS } from '@/components/interfaces/resultats/layout'
import { ClipMiniaturePreview } from '@/components/interfaces/spreadsheet/miniaturePreview'
import { useI18n } from '@/i18n'

interface ResultatsJudgeTableProps {
  currentBaremeTotalPoints: number
  categoryGroups: CategoryGroup[]
  judge: JudgeSource
  judgeIndex: number
  rows: ResultatsRow[]
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
  /** When provided, renders a trailing "Commentaires" column (export only). */
  getRowComment?: (clipId: string) => string
  /** When provided, attaches the comment as a hover tooltip on the participant cell (HTML export). */
  getRowCommentTitle?: (clipId: string) => string
}

export function ResultatsJudgeTable({
  currentBaremeTotalPoints,
  categoryGroups,
  judge,
  judgeIndex,
  rows,
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
  getRowComment,
  getRowCommentTitle,
}: ResultatsJudgeTableProps) {
  const { t } = useI18n()

  const enableScoreColorCoding = useUIStore((s) => s.enableScoreColorCoding)
  const scoreColorApplyBase = useUIStore((s) => s.scoreColorApplyBase)
  const scoreColorApplyTotals = useUIStore((s) => s.scoreColorApplyTotals)
  const scoreColorHighHex = useUIStore((s) => s.scoreColorHighHex)
  const scoreColorLowHex = useUIStore((s) => s.scoreColorLowHex)
  const colorBase = enableScoreColorCoding && scoreColorApplyBase
  const colorTotals = enableScoreColorCoding && scoreColorApplyTotals

  // Extreme per criterion column across clips (single judge).
  const criterionExtremes = useMemo(() => {
    const map = new Map<string, ScoreExtreme>()
    if (!colorBase) return map
    for (const group of categoryGroups) {
      for (const criterion of group.criteria) {
        const values: number[] = []
        for (const row of rows) {
          const note = judge.notes[row.clip.id] as NoteLike | undefined
          if (!hasAnyCriterionScore(note, [criterion])) continue
          values.push(getCriterionNumericScore(note, criterion))
        }
        const extreme = buildScoreExtreme(values)
        if (extreme) map.set(criterion.id, extreme)
      }
    }
    return map
  }, [colorBase, categoryGroups, judge, rows])

  const totalExtreme = useMemo(() => {
    if (!colorTotals) return null
    const values: number[] = []
    for (const row of rows) {
      const value = row.judgeTotals[judgeIndex]
      if (Number.isFinite(value) && value > 0) values.push(value)
    }
    return buildScoreExtreme(values)
  }, [colorTotals, rows, judgeIndex])

  const getCriterionColor = useCallback(
    (criterionId: string, value: number, hasScore: boolean) =>
      hasScore
        ? colorForExtreme(value, criterionExtremes.get(criterionId), scoreColorHighHex, scoreColorLowHex)
        : undefined,
    [criterionExtremes, scoreColorHighHex, scoreColorLowHex],
  )

  const getTotalColor = useCallback(
    (value: number) => colorForExtreme(value, totalExtreme, scoreColorHighHex, scoreColorLowHex),
    [totalExtreme, scoreColorHighHex, scoreColorLowHex],
  )

  return (
    <div className={`relative isolate min-h-0 flex-1 ${staticExport ? 'overflow-visible' : 'amv-results-scroll'}`}>
      <table className="w-full border-separate border-spacing-0 text-[11px]">
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
            {categoryGroups.map((group) => (
              <th
                key={group.category}
                colSpan={group.criteria.length}
                className="border-b border-r px-2 py-1 text-center text-[10px] font-semibold"
                style={{
                  color: group.color,
                  backgroundColor: withAlpha(group.color, 0.18),
                  borderColor: withAlpha(group.color, 0.3),
                }}
              >
                {group.category}
                <span className="ml-1 text-gray-500 font-normal">/{group.totalMax}</span>
              </th>
            ))}
            <th
              rowSpan={2}
              className="min-w-[88px] border-b border-r border-gray-700/60 bg-surface px-2 py-1 text-center text-[10px] font-semibold"
            >
              {t('Total')}
              <div className="text-gray-500 font-normal">/{currentBaremeTotalPoints}</div>
            </th>
            {getRowComment && (
              <th
                rowSpan={2}
                className="border-b border-r border-gray-700/60 bg-surface px-2 py-1 text-left align-middle text-[10px] font-medium text-gray-500 min-w-[160px]"
              >
                {t('Commentaires')}
              </th>
            )}
          </tr>
          <tr>
            {categoryGroups.map((group) =>
              group.criteria.map((criterion) => (
                <th
                  key={`${group.category}-${criterion.id}`}
                  className="border-b border-r border-gray-700/60 px-1.5 py-1 text-center text-[9px] font-medium"
                  style={{
                    color: withAlpha(group.color, 0.92),
                    backgroundColor: withAlpha(group.color, 0.08),
                  }}
                >
                  {criterion.name}
                  <span className="ml-1 text-gray-500 font-normal">/{criterion.max}</span>
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <ResultatsJudgeTableRow
              key={row.clip.id}
              row={row}
              index={index}
              isSelected={selectedClipId === row.clip.id}
              categoryGroups={categoryGroups}
              judge={judge}
              judgeIndex={judgeIndex}
              criterionDraftCells={criterionDraftCells}
              onSelectClip={onSelectClip}
              onOpenClipInNotation={onOpenClipInNotation}
              onOpenClipContextMenu={onOpenClipContextMenu}
              getCriterionCellKey={getCriterionCellKey}
              onSetCriterionDraftCell={onSetCriterionDraftCell}
              onCommitCriterionDraftCell={onCommitCriterionDraftCell}
              onClearCriterionDraftCell={onClearCriterionDraftCell}
              getCriterionColor={getCriterionColor}
              getTotalColor={getTotalColor}
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

interface ResultatsJudgeTableRowProps {
  row: ResultatsRow
  index: number
  isSelected: boolean
  categoryGroups: CategoryGroup[]
  judge: JudgeSource
  judgeIndex: number
  criterionDraftCells: Record<string, string>
  onSelectClip: (clipId: string) => void
  onOpenClipInNotation: (clipId: string) => void
  onOpenClipContextMenu: (clipId: string, x: number, y: number) => void
  getCriterionCellKey: (clipId: string, criterionId: string, judgeKey: string) => string
  onSetCriterionDraftCell: (key: string, value: string) => void
  onCommitCriterionDraftCell: (clipId: string, criterionId: string, judgeKey: string) => void
  onClearCriterionDraftCell: (key: string) => void
  getCriterionColor: (criterionId: string, value: number, hasScore: boolean) => string | undefined
  getTotalColor: (value: number) => string | undefined
  showMiniatures: boolean
  thumbnailDefaultSeconds: number
  readOnly: boolean
  forceMiniatureLoad: boolean
  staticExport: boolean
  getRowComment?: (clipId: string) => string
  getRowCommentTitle?: (clipId: string) => string
}

const ResultatsJudgeTableRow = memo(function ResultatsJudgeTableRow({
  row,
  index,
  isSelected,
  categoryGroups,
  judge,
  judgeIndex,
  criterionDraftCells,
  onSelectClip,
  onOpenClipInNotation,
  onOpenClipContextMenu,
  getCriterionCellKey,
  onSetCriterionDraftCell,
  onCommitCriterionDraftCell,
  onClearCriterionDraftCell,
  getCriterionColor,
  getTotalColor,
  showMiniatures,
  thumbnailDefaultSeconds,
  readOnly,
  forceMiniatureLoad,
  staticExport,
  getRowComment,
  getRowCommentTitle,
}: ResultatsJudgeTableRowProps) {
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
        group.criteria.map((criterion) => {
          const key = getCriterionCellKey(row.clip.id, criterion.id, judge.key)
          const note = judge.notes[row.clip.id] as NoteLike | undefined
          const score = getCriterionNumericScore(note, criterion)
          const displayed = criterionDraftCells[key] ?? (
            Number.isInteger(score) ? String(score) : score.toFixed(2).replace(/\.?0+$/, '')
          )
          const highlight = getCriterionColor(criterion.id, score, hasAnyCriterionScore(note, [criterion]))

          return (
            <td
              key={`${row.clip.id}-${criterion.id}-${judge.key}`}
              className="amv-number-ui border-r border-gray-800/60 px-1 py-1 text-center text-gray-100"
              style={highlight ? { color: highlight, fontWeight: 600 } : undefined}
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
      )}

      {(() => {
        const totalValue = row.judgeTotals[judgeIndex] ?? 0
        const totalColor = getTotalColor(totalValue)
        return (
          <td
            className="amv-number-ui border-r border-gray-700/60 px-2 py-1 text-center font-semibold text-white"
            style={totalColor ? { color: totalColor } : undefined}
          >
            {totalValue.toFixed(1)}
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
})


