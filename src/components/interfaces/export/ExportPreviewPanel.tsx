import { Download } from 'lucide-react'
import { useMemo } from 'react'
import type { MutableRefObject } from 'react'
import {
  getAuthorCollabLabel,
  getClipPrimaryLabel,
  getClipSecondaryLabel,
  splitAuthorPseudos,
} from '@/utils/formatters'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { withAlpha } from '@/utils/colors'
import type { CategoryGroup } from '@/utils/results'
import type {
  ExportJudge,
  ExportMode,
  ExportRankBadgeStyle,
  ExportRow,
  ExportTableView,
  ExportTheme,
} from '@/components/interfaces/export/types'

interface ExportPreviewPanelProps {
  previewRef: MutableRefObject<HTMLDivElement | null>
  exportPageRefs: MutableRefObject<Array<HTMLDivElement | null>>
  theme: ExportTheme
  exportMode: ExportMode
  tableView: ExportTableView
  accent: string
  title: string
  showTopBanner: boolean
  clipColumnWidth: number
  scoreColumnWidth: number
  rowHeight: number
  numberFontSize: number
  primaryFontSize: number
  secondaryFontSize: number
  rankBadgeStyle: ExportRankBadgeStyle
  showRank: boolean
  showJudgeColumns: boolean
  useCollabMepLabels: boolean
  selectedJudgeIndex: number
  selectedJudgeName?: string
  judges: ExportJudge[]
  categoryGroups: CategoryGroup[]
  displayRows: ExportRow[]
  rankByClipId: Map<string, number>
  rowsPerImage: number
  formatScore: (value: number) => string
}

function getRankDisplay(rank: number | undefined): string | number {
  if (!rank) return '-'
  if (rank === 1) return '1'
  if (rank === 2) return '2'
  if (rank === 3) return '3'
  return rank
}

function chunkRows(rows: ExportRow[], chunkSize: number): ExportRow[][] {
  if (rows.length === 0) return []
  const pages: ExportRow[][] = []
  for (let index = 0; index < rows.length; index += chunkSize) {
    pages.push(rows.slice(index, index + chunkSize))
  }
  return pages
}

function clampRowsPerImage(value: number): number {
  if (!Number.isFinite(value)) return 20
  return Math.min(Math.max(Math.round(value), 5), 80)
}

interface ExportTableCardProps {
  rows: ExportRow[]
  rankByClipId: Map<string, number>
  isLight: boolean
  exportMode: ExportMode
  tableView: ExportTableView
  accent: string
  title: string
  showTopBanner: boolean
  clipColumnWidth: number
  scoreColumnWidth: number
  rowHeight: number
  numberFontSize: number
  primaryFontSize: number
  secondaryFontSize: number
  rankBadgeStyle: ExportRankBadgeStyle
  totalClipCount: number
  showRank: boolean
  showJudgeColumns: boolean
  useCollabMepLabels: boolean
  selectedJudgeIndex: number
  selectedJudgeName?: string
  judges: ExportJudge[]
  categoryGroups: CategoryGroup[]
  formatScore: (value: number) => string
  maxTableBodyHeight?: string
  stickyHeader?: boolean
  pageLabel?: string
}

function ExportTableCard({
  rows,
  rankByClipId,
  isLight,
  exportMode,
  tableView,
  accent,
  title,
  showTopBanner,
  clipColumnWidth,
  scoreColumnWidth,
  rowHeight,
  numberFontSize,
  primaryFontSize,
  secondaryFontSize,
  rankBadgeStyle,
  showRank,
  showJudgeColumns,
  useCollabMepLabels,
  selectedJudgeIndex,
  selectedJudgeName,
  judges,
  categoryGroups,
  formatScore,
  maxTableBodyHeight,
  stickyHeader,
}: ExportTableCardProps) {
  const tableBorderColor = isLight ? '#d1d5db' : '#334155'
  const bodyBorderColor = isLight ? '#e5e7eb' : '#334155'
  const rowHeightPx = Math.max(44, Math.round(rowHeight))
  const clipWidthPx = Math.max(260, Math.round(clipColumnWidth))
  const scoreWidthPx = Math.max(88, Math.round(scoreColumnWidth))
  const numberFontSizePx = Math.max(11, Math.round(numberFontSize))
  const primaryFontSizePx = Math.max(12, Math.round(primaryFontSize))
  const secondaryFontSizePx = Math.max(10, Math.round(secondaryFontSize))
  const minimumSafeRowHeight = Math.ceil((primaryFontSizePx * 1.25) + (secondaryFontSizePx * 1.25) + 16)
  const effectiveRowHeightPx = Math.max(rowHeightPx, minimumSafeRowHeight)
  const clipContentHeight = (primaryFontSizePx * 1.2) + (secondaryFontSizePx * 1.2) + 2
  const clipVerticalPaddingPx = Math.max(5, Math.round((effectiveRowHeightPx - clipContentHeight) / 2))
  const totalColumns =
    (showRank ? 1 : 0)
    + 1
    + (tableView === 'detailed'
      ? categoryGroups.reduce((sum, group) => sum + group.criteria.length, 0)
      : categoryGroups.length)
    + 1
    + (exportMode === 'grouped' && showJudgeColumns ? judges.length : 0)
  const headerCellClass = 'px-0 py-0 h-[44px] border text-center align-middle text-[11px] font-semibold'
  const numberCellClass = 'px-3 py-0 border text-center align-middle'
  const numberValueClass = 'flex w-full items-center justify-center leading-none tabular-nums font-semibold'
  const headerContentClass = 'flex h-full w-full items-center justify-center px-3 leading-tight'

  return (
    <div
      className={`rounded-2xl border p-4 ${
        isLight
          ? 'bg-white border-gray-200 text-gray-900 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'
          : 'bg-slate-950 border-slate-700 text-slate-100 shadow-[0_10px_30px_rgba(2,6,23,0.6)]'
      }`}
    >
      {showTopBanner && (
        <div
          className="rounded-xl border px-4 py-3 mb-3"
          style={{
            borderColor: withAlpha(accent, 0.45),
            background: isLight
              ? `linear-gradient(115deg, ${withAlpha(accent, 0.18)}, rgba(255,255,255,0.96) 70%)`
              : `linear-gradient(115deg, ${withAlpha(accent, 0.34)}, rgba(15,23,42,0.96) 70%)`,
          }}
        >
          <div className="flex items-start gap-3">
            <h2 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
              {title || 'Resultats'}
            </h2>
          </div>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: tableBorderColor }}>
        <div className={maxTableBodyHeight ? 'overflow-auto' : undefined} style={maxTableBodyHeight ? { maxHeight: maxTableBodyHeight } : undefined}>
          <table className="w-full border-collapse table-fixed text-xs">
            <colgroup>
              {showRank && <col style={{ width: '78px' }} />}
              <col style={{ width: `${clipWidthPx}px` }} />
              {tableView === 'detailed'
                ? categoryGroups.flatMap((group) => group.criteria.map((criterion) => (
                  <col key={`col-criterion-${criterion.id}`} style={{ width: `${scoreWidthPx}px` }} />
                )))
                : categoryGroups.map((group) => (
                  <col key={`col-category-${group.category}`} style={{ width: `${scoreWidthPx}px` }} />
                ))}
              <col style={{ width: `${Math.max(scoreWidthPx + 12, 108)}px` }} />
              {exportMode === 'grouped' && showJudgeColumns && judges.map((judge) => (
                <col key={`col-judge-${judge.key}`} style={{ width: `${scoreWidthPx}px` }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {showRank && (
                  <th
                    className={`${headerCellClass} ${stickyHeader ? 'sticky top-0 z-30' : ''}`}
                    style={{
                      width: '78px',
                      borderColor: tableBorderColor,
                      backgroundColor: isLight ? '#f8fafc' : '#0b1220',
                    }}
                    rowSpan={tableView === 'detailed' ? 2 : undefined}
                  >
                    <span className={headerContentClass}>#</span>
                  </th>
                )}
                <th
                  className={`px-0 py-0 h-[44px] border text-left align-middle text-[11px] font-semibold ${stickyHeader ? 'sticky top-0 z-30' : ''}`}
                  style={{
                    minWidth: `${clipWidthPx}px`,
                    borderColor: tableBorderColor,
                    backgroundColor: isLight ? '#f8fafc' : '#0b1220',
                  }}
                  rowSpan={tableView === 'detailed' ? 2 : undefined}
                >
                  <span className="flex h-full w-full items-center px-3 leading-tight">Clip</span>
                </th>

                {tableView === 'detailed'
                  ? categoryGroups.map((group) => (
                    <th
                      key={`export-category-${group.category}`}
                      colSpan={Math.max(1, group.criteria.length)}
                      className={`${headerCellClass} ${stickyHeader ? 'sticky top-0 z-20' : ''}`}
                      style={{
                        borderColor: withAlpha(group.color, 0.45),
                        backgroundColor: withAlpha(group.color, isLight ? 0.16 : 0.22),
                        color: isLight ? '#0f172a' : group.color,
                      }}
                    >
                      <span className={headerContentClass}>{group.category}</span>
                    </th>
                  ))
                  : categoryGroups.map((group) => (
                    <th
                      key={`export-${group.category}`}
                      className={`${headerCellClass} ${stickyHeader ? 'sticky top-0 z-20' : ''}`}
                      style={{
                        minWidth: `${scoreWidthPx}px`,
                        borderColor: withAlpha(group.color, 0.45),
                        backgroundColor: withAlpha(group.color, isLight ? 0.16 : 0.22),
                        color: isLight ? '#0f172a' : group.color,
                      }}
                    >
                      <span className={headerContentClass}>{group.category}</span>
                    </th>
                  ))}

                <th
                  className={`${headerCellClass} ${stickyHeader ? 'sticky top-0 z-20' : ''}`}
                  style={{
                    minWidth: `${Math.max(scoreWidthPx + 12, 108)}px`,
                    borderColor: withAlpha(accent, 0.42),
                    backgroundColor: withAlpha(accent, isLight ? 0.14 : 0.2),
                    color: isLight ? '#0f172a' : '#f8fafc',
                  }}
                  rowSpan={tableView === 'detailed' ? 2 : undefined}
                >
                  <span className={headerContentClass}>
                    {exportMode === 'individual' ? `Total ${selectedJudgeName || ''}` : 'Total moyen'}
                  </span>
                </th>

                {exportMode === 'grouped' && showJudgeColumns && judges.map((judge) => (
                  <th
                    key={`export-judge-${judge.key}`}
                    className={`${headerCellClass} ${stickyHeader ? 'sticky top-0 z-20' : ''}`}
                    style={{
                      minWidth: `${scoreWidthPx}px`,
                      borderColor: tableBorderColor,
                      backgroundColor: isLight ? '#f8fafc' : '#0b1220',
                    }}
                    rowSpan={tableView === 'detailed' ? 2 : undefined}
                  >
                    <span className={headerContentClass}>{judge.judgeName}</span>
                  </th>
                ))}
              </tr>
              {tableView === 'detailed' && (
                <tr>
                  {categoryGroups.flatMap((group) => group.criteria.map((criterion) => (
                    <th
                      key={`export-criterion-${criterion.id}`}
                      className={`${headerCellClass} ${stickyHeader ? 'sticky top-[44px] z-20' : ''}`}
                      style={{
                        minWidth: `${scoreWidthPx}px`,
                        borderColor: withAlpha(group.color, 0.45),
                        backgroundColor: withAlpha(group.color, isLight ? 0.1 : 0.16),
                        color: isLight ? '#0f172a' : group.color,
                      }}
                    >
                      <span className={headerContentClass}>
                        {criterion.name}
                      </span>
                    </th>
                  )))}
                </tr>
              )}
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={totalColumns}
                    className="px-3 py-6 text-center text-sm"
                    style={{
                      borderColor: bodyBorderColor,
                      color: isLight ? '#6b7280' : '#94a3b8',
                    }}
                  >
                    Aucune donnée à exporter pour le moment.
                  </td>
                </tr>
              )}

              {rows.map((row, index) => {
                const rank = rankByClipId.get(row.clip.id)
                const rowBackgroundColor =
                  index % 2 === 0
                    ? (isLight ? '#f9fafb' : '#0b1323')
                    : (isLight ? '#ffffff' : '#060d1c')
                const clipPrimary = getClipPrimaryLabel(row.clip)
                const clipSecondary = getClipSecondaryLabel(row.clip)
                const pseudos = splitAuthorPseudos(row.clip.author)
                const collabLabel = getAuthorCollabLabel(row.clip.author)
                const showCollabLabel = Boolean(useCollabMepLabels && collabLabel)
                const clipLabel = showCollabLabel ? collabLabel : clipPrimary
                const collabTitle = showCollabLabel ? pseudos.join(', ') : undefined
                const clipSecondaryColor = isLight ? '#4b5563' : '#94a3b8'
                const baseRankTone = isLight ? '#111827' : '#e2e8f0'
                const medalColor =
                  rank === 1
                    ? '#f59e0b'
                    : rank === 2
                      ? '#94a3b8'
                      : rank === 3
                        ? '#b45309'
                        : withAlpha(accent, isLight ? 0.16 : 0.24)
                const rankBadgeStyleProps =
                  rankBadgeStyle === 'outline'
                    ? {
                      backgroundColor: 'transparent',
                      border: `1px solid ${withAlpha(accent, 0.65)}`,
                      color: baseRankTone,
                    }
                    : rankBadgeStyle === 'plain'
                      ? {
                        backgroundColor: 'transparent',
                        border: '1px solid transparent',
                        color: baseRankTone,
                      }
                      : {
                        backgroundColor: medalColor,
                        border: '1px solid transparent',
                        color: rank && rank <= 3 ? '#ffffff' : baseRankTone,
                      }

                return (
                  <tr
                    key={`export-row-${row.clip.id}`}
                    className={isLight ? 'hover:bg-blue-50/40' : 'hover:bg-slate-800/50'}
                    style={{ backgroundColor: rowBackgroundColor }}
                  >
                    {showRank && (
                      <td
                        className={`${numberCellClass} font-semibold`}
                        style={{
                          borderColor: bodyBorderColor,
                        }}
                      >
                        <span
                          className="inline-flex h-7 min-w-[2.1rem] items-center justify-center rounded-md px-1.5 leading-none"
                          style={rankBadgeStyleProps}
                        >
                          {getRankDisplay(rank)}
                        </span>
                      </td>
                    )}
                    <td
                      className="px-3 border align-middle"
                      style={{
                        borderColor: bodyBorderColor,
                        paddingTop: `${clipVerticalPaddingPx}px`,
                        paddingBottom: `${clipVerticalPaddingPx}px`,
                      }}
                    >
                      <div className="block">
                        <div
                          className="font-semibold truncate"
                          style={{ fontSize: `${primaryFontSizePx}px`, lineHeight: 1.2 }}
                        >
                          {showCollabLabel ? (
                            <HoverTextTooltip text={collabTitle ?? ''}>
                              <span
                                className="inline-flex items-center rounded px-1.5 py-0.5 border text-[11px] tracking-[0.02em]"
                                style={{
                                  borderColor: withAlpha(accent, 0.42),
                                  backgroundColor: withAlpha(accent, isLight ? 0.15 : 0.24),
                                  color: isLight ? '#0f172a' : '#e2e8f0',
                                }}
                              >
                                {clipLabel}
                              </span>
                            </HoverTextTooltip>
                          ) : (
                            clipLabel
                          )}
                        </div>
                        {clipSecondary && (
                          <div
                            className="truncate"
                            style={{ fontSize: `${secondaryFontSizePx}px`, lineHeight: 1.2, color: clipSecondaryColor }}
                          >
                            {clipSecondary}
                          </div>
                        )}
                      </div>
                    </td>

                    {(tableView === 'detailed'
                      ? categoryGroups.flatMap((group) => group.criteria.map((criterion) => ({
                        key: criterion.id,
                        value: exportMode === 'individual'
                          ? (row.criterionJudgeScores[criterion.id]?.[selectedJudgeIndex] ?? 0)
                          : (row.criterionAverages[criterion.id] ?? 0),
                      })))
                      : categoryGroups.map((group) => ({
                        key: group.category,
                        value: exportMode === 'individual'
                          ? (row.categoryJudgeScores[group.category][selectedJudgeIndex] ?? 0)
                          : (row.categoryAverages[group.category] ?? 0),
                      }))).map((column) => (
                      <td
                        key={`export-score-${row.clip.id}-${column.key}`}
                        className={numberCellClass}
                        style={{
                          borderColor: bodyBorderColor,
                          fontSize: `${numberFontSizePx}px`,
                        }}
                      >
                        <span className={numberValueClass}>
                          {formatScore(column.value)}
                        </span>
                      </td>
                    ))}

                    <td
                      className={`${numberCellClass} font-bold`}
                      style={{
                        borderColor: withAlpha(accent, 0.35),
                        backgroundColor: withAlpha(accent, isLight ? 0.1 : 0.14),
                        fontSize: `${numberFontSizePx}px`,
                      }}
                    >
                      <span className={numberValueClass}>
                        {formatScore(
                          exportMode === 'individual'
                            ? (row.judgeTotals[selectedJudgeIndex] ?? 0)
                            : row.averageTotal,
                        )}
                      </span>
                    </td>

                    {exportMode === 'grouped' && showJudgeColumns && judges.map((judge, judgeIdx) => (
                      <td
                        key={`export-judge-score-${row.clip.id}-${judge.key}`}
                        className={numberCellClass}
                        style={{
                          borderColor: bodyBorderColor,
                          fontSize: `${numberFontSizePx}px`,
                        }}
                      >
                        <span className={numberValueClass}>
                          {formatScore(row.judgeTotals[judgeIdx] ?? 0)}
                        </span>
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function ExportPreviewPanel({
  previewRef,
  exportPageRefs,
  theme,
  exportMode,
  tableView,
  accent,
  title,
  showTopBanner,
  clipColumnWidth,
  scoreColumnWidth,
  rowHeight,
  numberFontSize,
  primaryFontSize,
  secondaryFontSize,
  rankBadgeStyle,
  showRank,
  showJudgeColumns,
  useCollabMepLabels,
  selectedJudgeIndex,
  selectedJudgeName,
  judges,
  categoryGroups,
  displayRows,
  rankByClipId,
  rowsPerImage,
  formatScore,
}: ExportPreviewPanelProps) {
  const isLight = theme === 'light'
  const safeRowsPerImage = clampRowsPerImage(rowsPerImage)
  const safeClipColumnWidth = Math.max(260, Math.round(clipColumnWidth))
  const safeScoreColumnWidth = Math.max(88, Math.round(scoreColumnWidth))
  const safeTotalColumnWidth = Math.max(safeScoreColumnWidth + 12, 108)
  const pagedRows = useMemo(
    () => chunkRows(displayRows, safeRowsPerImage),
    [displayRows, safeRowsPerImage],
  )
  const tableRenderWidth = useMemo(() => {
    const metricColumnsCount = tableView === 'detailed'
      ? categoryGroups.reduce((sum, group) => sum + group.criteria.length, 0)
      : categoryGroups.length
    const categoryColumnsWidth = metricColumnsCount * safeScoreColumnWidth
    const judgeColumnsWidth = exportMode === 'grouped' && showJudgeColumns ? judges.length * safeScoreColumnWidth : 0
    const rankWidth = showRank ? 78 : 0
    return Math.max(980, rankWidth + safeClipColumnWidth + categoryColumnsWidth + safeTotalColumnWidth + judgeColumnsWidth)
  }, [
    exportMode,
    judges.length,
    safeClipColumnWidth,
    safeScoreColumnWidth,
    safeTotalColumnWidth,
    showJudgeColumns,
    showRank,
    tableView,
    categoryGroups,
  ])

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <div className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
        <Download size={12} />
        Aperçu exportable
      </div>

      <div className="mx-auto w-full">
        <div style={{ minWidth: `${tableRenderWidth}px` }}>
          <ExportTableCard
            rows={displayRows}
            rankByClipId={rankByClipId}
            isLight={isLight}
            exportMode={exportMode}
            tableView={tableView}
            accent={accent}
            title={title}
            showTopBanner={showTopBanner}
            clipColumnWidth={safeClipColumnWidth}
            scoreColumnWidth={safeScoreColumnWidth}
            rowHeight={rowHeight}
            numberFontSize={numberFontSize}
            primaryFontSize={primaryFontSize}
            secondaryFontSize={secondaryFontSize}
            rankBadgeStyle={rankBadgeStyle}
            totalClipCount={displayRows.length}
            showRank={showRank}
            showJudgeColumns={showJudgeColumns}
            useCollabMepLabels={useCollabMepLabels}
            selectedJudgeIndex={selectedJudgeIndex}
            selectedJudgeName={selectedJudgeName}
            judges={judges}
            categoryGroups={categoryGroups}
            formatScore={formatScore}
            maxTableBodyHeight="68vh"
            stickyHeader
          />
        </div>
      </div>

      <div className="fixed left-[-20000px] top-0 z-[-1] opacity-0 pointer-events-none">
        <div ref={previewRef} style={{ width: `${tableRenderWidth}px` }} data-export-preview="true">
          <ExportTableCard
            rows={displayRows}
            rankByClipId={rankByClipId}
            isLight={isLight}
            exportMode={exportMode}
            tableView={tableView}
            accent={accent}
            title={title}
            showTopBanner={showTopBanner}
            clipColumnWidth={safeClipColumnWidth}
            scoreColumnWidth={safeScoreColumnWidth}
            rowHeight={rowHeight}
            numberFontSize={numberFontSize}
            primaryFontSize={primaryFontSize}
            secondaryFontSize={secondaryFontSize}
            rankBadgeStyle={rankBadgeStyle}
            totalClipCount={displayRows.length}
            showRank={showRank}
            showJudgeColumns={showJudgeColumns}
            useCollabMepLabels={useCollabMepLabels}
            selectedJudgeIndex={selectedJudgeIndex}
            selectedJudgeName={selectedJudgeName}
            judges={judges}
            categoryGroups={categoryGroups}
            formatScore={formatScore}
          />
        </div>

        {pagedRows.map((rows, pageIndex) => (
          <div
            key={`export-page-${pageIndex}`}
            ref={(node) => {
              exportPageRefs.current[pageIndex] = node
            }}
            style={{ width: `${tableRenderWidth}px`, marginTop: pageIndex === 0 ? 0 : 32 }}
            data-export-page="true"
            data-export-page-index={String(pageIndex)}
          >
            <ExportTableCard
              rows={rows}
              rankByClipId={rankByClipId}
              isLight={isLight}
              exportMode={exportMode}
              tableView={tableView}
              accent={accent}
              title={title}
              showTopBanner={showTopBanner}
              clipColumnWidth={safeClipColumnWidth}
              scoreColumnWidth={safeScoreColumnWidth}
              rowHeight={rowHeight}
              numberFontSize={numberFontSize}
              primaryFontSize={primaryFontSize}
              secondaryFontSize={secondaryFontSize}
              rankBadgeStyle={rankBadgeStyle}
              totalClipCount={displayRows.length}
              showRank={showRank}
              showJudgeColumns={showJudgeColumns}
              useCollabMepLabels={useCollabMepLabels}
              selectedJudgeIndex={selectedJudgeIndex}
              selectedJudgeName={selectedJudgeName}
              judges={judges}
              categoryGroups={categoryGroups}
              formatScore={formatScore}
              pageLabel={`Page ${pageIndex + 1}/${pagedRows.length}`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
