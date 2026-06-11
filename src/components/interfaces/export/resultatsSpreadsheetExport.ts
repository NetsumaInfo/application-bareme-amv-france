import type { Criterion } from '@/types/bareme'
import type {
  ExportExcelLayout,
  ExportExcelOrientation,
  ExportExcelSort,
} from '@/components/interfaces/export/types'
import type {
  ResultatsGlobalVariant,
  ResultatsMainView,
  ResultatsRow,
} from '@/components/interfaces/resultats/types'
import type { XlsxCell, XlsxCellStyle, XlsxCellValue, XlsxSheet } from '@/components/interfaces/export/xlsxWorkbook'
import {
  getCriterionNumericScore,
  hasAnyCriterionScore,
  type CategoryGroup,
  type JudgeSource,
  type NoteLike,
} from '@/utils/results'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { buildClipComment } from '@/components/interfaces/export/exportComments'

interface ResultatsSpreadsheetExportOptions {
  mainView: ResultatsMainView
  globalVariant: ResultatsGlobalVariant
  currentBaremeTotalPoints: number
  categoryGroups: CategoryGroup[]
  judges: JudgeSource[]
  rows: ResultatsRow[]
  selectedJudgeIndex: number
  /** Which sheets to emit. Defaults to 'full' (summary + one sheet per judge). */
  excelLayout?: ExportExcelLayout
  /** Summary orientation: participants as rows (default) or transposed to columns. */
  excelOrientation?: ExportExcelOrientation
  /** Row ordering for summary / ranking sheets. */
  excelSort?: ExportExcelSort
  excelShowJudges?: boolean
  excelShowCategories?: boolean
  excelShowRank?: boolean
  /** Append a free-text "Commentaires" column built from judge text notes. */
  includeComments?: boolean
  translate: (key: string, params?: Record<string, string | number | null | undefined>) => string
}

function makeRowComparator(
  options: ResultatsSpreadsheetExportOptions,
): (a: ResultatsRow, b: ResultatsRow) => number {
  const sort = options.excelSort ?? 'score'
  if (sort === 'alpha') {
    return (a, b) => clipLabel(a).localeCompare(clipLabel(b)) || a.clip.order - b.clip.order
  }
  if (sort === 'original') {
    return (a, b) => a.clip.order - b.clip.order
  }
  return (a, b) => {
    const scoreA = numericScoreForSort(getGlobalTotalAverage(a, options.judges, options.categoryGroups))
    const scoreB = numericScoreForSort(getGlobalTotalAverage(b, options.judges, options.categoryGroups))
    if (scoreB !== scoreA) return scoreB - scoreA
    return a.clip.order - b.clip.order
  }
}

const CATEGORY_HEADER_STYLES = [
  'categoryHeader0',
  'categoryHeader1',
  'categoryHeader2',
  'categoryHeader3',
] as const satisfies readonly XlsxCellStyle[]

const CRITERION_HEADER_STYLES = [
  'criterionHeader0',
  'criterionHeader1',
  'criterionHeader2',
  'criterionHeader3',
] as const satisfies readonly XlsxCellStyle[]

const FINAL_LABEL_STYLES = [
  'finalLabel0',
  'finalLabel1',
  'finalLabel2',
  'finalLabel3',
] as const satisfies readonly XlsxCellStyle[]

function cell(value: XlsxCellValue = '', style: XlsxCellStyle = 'default'): XlsxCell {
  return { value, style }
}

/** Styles that render with wrapText — only these drive computed row heights. */
const WRAPPING_STYLES = new Set<XlsxCellStyle>([
  'categoryHeader0', 'categoryHeader1', 'categoryHeader2', 'categoryHeader3',
  'criterionHeader0', 'criterionHeader1', 'criterionHeader2', 'criterionHeader3',
  'rankingHeader', 'finalHeader',
  'finalLabel0', 'finalLabel1', 'finalLabel2', 'finalLabel3',
  'totalLabel', 'summaryHeader', 'comment',
])

const LINE_HEIGHT_PX = 13
const ROW_VERTICAL_PADDING_PX = 4
const MAX_ROW_HEIGHT_PX = 240

/** Approximate how many lines `text` wraps to within a column of `colWidthChars`. */
function estimateWrappedLines(text: string, colWidthChars: number): number {
  // Subtract one char for cell padding so the estimate matches Excel's wrapping.
  const width = Math.max(3, Math.floor(colWidthChars) - 1)
  const words = String(text ?? '').split(/\s+/).filter(Boolean)
  if (words.length === 0) return 1

  let lines = 1
  let current = 0
  for (const word of words) {
    let remaining = word.length
    if (current === 0) {
      current = Math.min(remaining, width)
      remaining -= current
    } else if (current + 1 + remaining <= width) {
      current += 1 + remaining
      remaining = 0
    } else {
      lines += 1
      current = Math.min(remaining, width)
      remaining -= current
    }
    // Break a single word longer than the column.
    while (remaining > 0) {
      lines += 1
      const take = Math.min(remaining, width)
      current = take
      remaining -= take
    }
  }
  return lines
}

/**
 * Derives per-row heights so wrapped headers and multi-line comments are never
 * clipped. Only wrapping-styled cells contribute; `minimums` keeps the existing
 * aesthetic heights for title/header rows.
 */
function computeRowHeights(
  rows: XlsxCell[][],
  columnWidths: Array<number | undefined>,
  minimums: Record<number, number> = {},
): Record<number, number> {
  const heights: Record<number, number> = { ...minimums }
  rows.forEach((row, rowIndex) => {
    let maxLines = 1
    row.forEach((cellValue, columnIndex) => {
      if (!cellValue || !cellValue.style || !WRAPPING_STYLES.has(cellValue.style)) return
      const text = cellValue.value
      if (text === undefined || text === null || text === '') return
      const width = columnWidths[columnIndex] ?? 12
      maxLines = Math.max(maxLines, estimateWrappedLines(String(text), width))
    })
    if (maxLines <= 1) return
    const rowNumber = rowIndex + 1
    const computed = Math.min(MAX_ROW_HEIGHT_PX, maxLines * LINE_HEIGHT_PX + ROW_VERTICAL_PADDING_PX)
    heights[rowNumber] = Math.max(heights[rowNumber] ?? 0, computed)
  })
  return heights
}

function categoryHeaderStyle(index: number): XlsxCellStyle {
  return CATEGORY_HEADER_STYLES[index % CATEGORY_HEADER_STYLES.length]
}

function criterionHeaderStyle(index: number): XlsxCellStyle {
  return CRITERION_HEADER_STYLES[index % CRITERION_HEADER_STYLES.length]
}

function finalLabelStyle(index: number): XlsxCellStyle {
  return FINAL_LABEL_STYLES[index % FINAL_LABEL_STYLES.length]
}

function clipLabel(row: ResultatsRow): string {
  const secondary = getClipSecondaryLabel(row.clip)
  return secondary ? `${getClipPrimaryLabel(row.clip)} - ${secondary}` : getClipPrimaryLabel(row.clip)
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100
}

function formatAverage(values: number[]): XlsxCellValue {
  if (values.length === 0) return '-'
  return roundScore(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function scoreCell(value: XlsxCellValue, rowIndex: number): XlsxCell {
  const style: XlsxCellStyle = value === '-' ? 'missingScore' : rowIndex % 2 === 0 ? 'scoreEven' : 'scoreOdd'
  return cell(value, style)
}

function getCriterionScoreValue(note: NoteLike | undefined, criterion: Criterion): XlsxCellValue {
  if (!hasAnyCriterionScore(note, [criterion])) return '-'
  return roundScore(getCriterionNumericScore(note, criterion))
}

function getCategoryScoreValue(
  note: NoteLike | undefined,
  group: CategoryGroup,
  row: ResultatsRow,
  judgeIndex: number,
): XlsxCellValue {
  if (!hasAnyCriterionScore(note, group.criteria)) return '-'
  return roundScore(row.categoryJudgeScores[group.category]?.[judgeIndex] ?? 0)
}

function getJudgeTotalValue(
  note: NoteLike | undefined,
  row: ResultatsRow,
  judgeIndex: number,
  categoryGroups: CategoryGroup[],
): XlsxCellValue {
  const hasAnyScore = categoryGroups.some((group) => hasAnyCriterionScore(note, group.criteria))
  if (!hasAnyScore) return '-'
  return roundScore(row.judgeTotals[judgeIndex] ?? 0)
}

function numericScoreForSort(value: XlsxCellValue): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY
}

function sortRowsByScore(rows: ResultatsRow[], scoreAccessor: (row: ResultatsRow) => XlsxCellValue): ResultatsRow[] {
  return [...rows].sort((a, b) => {
    const scoreA = numericScoreForSort(scoreAccessor(a))
    const scoreB = numericScoreForSort(scoreAccessor(b))
    if (scoreB !== scoreA) return scoreB - scoreA
    return a.clip.order - b.clip.order
  })
}

function createStyledRow(length: number, style: XlsxCellStyle = 'spacer'): XlsxCell[] {
  return Array.from({ length }, () => cell('', style))
}

function createJudgeSheet({
  judge,
  judgeIndex,
  currentBaremeTotalPoints,
  categoryGroups,
  rows,
  translate,
  includeComments,
}: ResultatsSpreadsheetExportOptions & { judge: JudgeSource; judgeIndex: number }): XlsxSheet {
  const criteria = categoryGroups.flatMap((group) => group.criteria.map((criterion) => ({ group, criterion })))
  const rankingStartColumn = criteria.length + 2
  const rankingWidth = 3
  const finalStartRow = rows.length + 5
  const minimumColumns = rankingStartColumn + rankingWidth
  const finalColumns = rows.length + 1
  const baseColumnCount = Math.max(minimumColumns, finalColumns)
  // Comments live in a trailing column beyond the ranking block.
  const commentColumn = includeComments ? baseColumnCount : -1
  const columnCount = includeComments ? baseColumnCount + 1 : baseColumnCount
  const outputRows: XlsxCell[][] = []
  const merges: string[] = ['A1:A2']
  const rowHeights: Record<number, number> = {
    1: 24,
    2: 34,
    [finalStartRow]: 24,
  }
  const columnWidths: Array<number | undefined> = Array.from({ length: columnCount }, () => 18)

  columnWidths[0] = 24
  criteria.forEach(({ criterion }, index) => {
    columnWidths[index + 1] = Math.max(13, Math.min(28, criterion.name.length + 3))
  })
  columnWidths[rankingStartColumn - 1] = 3
  columnWidths[rankingStartColumn] = 7
  columnWidths[rankingStartColumn + 1] = 24
  columnWidths[rankingStartColumn + 2] = 12
  if (commentColumn >= 0) {
    columnWidths[commentColumn] = 50
  }

  const headerRow = createStyledRow(columnCount)
  headerRow[0] = cell(`${translate('Juge')}: ${judge.judgeName}`, 'judgeTitle')

  let currentColumn = 1
  categoryGroups.forEach((group, groupIndex) => {
    const style = categoryHeaderStyle(groupIndex)
    const startColumn = currentColumn
    const endColumn = currentColumn + group.criteria.length - 1
    for (let columnIndex = startColumn; columnIndex <= endColumn; columnIndex += 1) {
      headerRow[columnIndex] = cell(columnIndex === startColumn ? `${group.category} /${group.totalMax}` : '', style)
    }
    if (endColumn > startColumn) {
      merges.push(`${getColumnNameForExport(startColumn)}1:${getColumnNameForExport(endColumn)}1`)
    }
    currentColumn = endColumn + 1
  })

  headerRow[rankingStartColumn] = cell(translate('Classement global'), 'rankingHeader')
  headerRow[rankingStartColumn + 1] = cell('', 'rankingHeader')
  headerRow[rankingStartColumn + 2] = cell('', 'rankingHeader')
  merges.push(`${getColumnNameForExport(rankingStartColumn)}1:${getColumnNameForExport(rankingStartColumn + 2)}1`)
  if (commentColumn >= 0) {
    headerRow[commentColumn] = cell(translate('Commentaires'), 'rankingHeader')
    merges.push(`${getColumnNameForExport(commentColumn)}1:${getColumnNameForExport(commentColumn)}2`)
  }
  outputRows.push(headerRow)

  const criteriaRow = createStyledRow(columnCount)
  criteriaRow[0] = cell('', 'judgeTitle')
  criteria.forEach(({ criterion }, index) => {
    const groupIndex = categoryGroups.findIndex((group) => group.category === criteria[index].group.category)
    criteriaRow[index + 1] = cell(`${criterion.name} /${criterion.max ?? 0}`, criterionHeaderStyle(groupIndex))
  })
  criteriaRow[rankingStartColumn] = cell('#', 'rankingHeader')
  criteriaRow[rankingStartColumn + 1] = cell(translate('Participant'), 'rankingHeader')
  criteriaRow[rankingStartColumn + 2] = cell(`${translate('Total')} /${currentBaremeTotalPoints}`, 'rankingHeader')
  outputRows.push(criteriaRow)

  const rankedRows = sortRowsByScore(rows, (row) => {
    const note = judge.notes[row.clip.id] as NoteLike | undefined
    return getJudgeTotalValue(note, row, judgeIndex, categoryGroups)
  })

  rows.forEach((row, rowIndex) => {
    const outputRow = createStyledRow(columnCount, rowIndex % 2 === 0 ? 'scoreEven' : 'scoreOdd')
    const note = judge.notes[row.clip.id] as NoteLike | undefined
    outputRow[0] = cell(clipLabel(row), 'nameCell')

    criteria.forEach(({ criterion }, criterionIndex) => {
      outputRow[criterionIndex + 1] = scoreCell(getCriterionScoreValue(note, criterion), rowIndex)
    })

    outputRow[rankingStartColumn - 1] = cell('', 'spacer')
    const rankedRow = rankedRows[rowIndex]
    if (rankedRow) {
      const rankedNote = judge.notes[rankedRow.clip.id] as NoteLike | undefined
      outputRow[rankingStartColumn] = scoreCell(rowIndex + 1, rowIndex)
      outputRow[rankingStartColumn + 1] = cell(clipLabel(rankedRow), rowIndex % 2 === 0 ? 'scoreEven' : 'scoreOdd')
      outputRow[rankingStartColumn + 2] = scoreCell(
        getJudgeTotalValue(rankedNote, rankedRow, judgeIndex, categoryGroups),
        rowIndex,
      )
    }

    if (commentColumn >= 0) {
      outputRow[commentColumn] = cell(
        buildClipComment(row.clip.id, { judges: [judge], singleJudgeIndex: 0 }),
        'comment',
      )
    }

    outputRows.push(outputRow)
  })

  while (outputRows.length < finalStartRow - 1) {
    outputRows.push(createStyledRow(columnCount, 'spacer'))
  }

  const finalHeaderRow = createStyledRow(columnCount)
  finalHeaderRow[0] = cell(translate('Scores finaux'), 'finalHeader')
  rows.forEach((row, index) => {
    finalHeaderRow[index + 1] = cell(clipLabel(row), 'finalHeader')
  })
  outputRows.push(finalHeaderRow)

  categoryGroups.forEach((group, groupIndex) => {
    const outputRow = createStyledRow(columnCount)
    outputRow[0] = cell(`${group.category} /${group.totalMax}`, finalLabelStyle(groupIndex))
    rows.forEach((row, rowIndex) => {
      const note = judge.notes[row.clip.id] as NoteLike | undefined
      outputRow[rowIndex + 1] = scoreCell(getCategoryScoreValue(note, group, row, judgeIndex), groupIndex)
    })
    outputRows.push(outputRow)
  })

  const totalRow = createStyledRow(columnCount)
  totalRow[0] = cell(`${translate('Total')} /${currentBaremeTotalPoints}`, 'totalLabel')
  rows.forEach((row, rowIndex) => {
    const note = judge.notes[row.clip.id] as NoteLike | undefined
    totalRow[rowIndex + 1] = cell(getJudgeTotalValue(note, row, judgeIndex, categoryGroups), 'totalScore')
  })
  outputRows.push(totalRow)

  return {
    name: judge.judgeName,
    rows: outputRows,
    columnWidths,
    rowHeights: computeRowHeights(outputRows, columnWidths, rowHeights),
    merges,
    freezePane: { xSplit: 1, ySplit: 2, topLeftCell: 'B3' },
  }
}

function getColumnNameForExport(columnIndex: number): string {
  let value = columnIndex + 1
  let name = ''
  while (value > 0) {
    const remainder = (value - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    value = Math.floor((value - 1) / 26)
  }
  return name
}

function getGlobalCategoryAverage(
  row: ResultatsRow,
  group: CategoryGroup,
  judges: JudgeSource[],
): XlsxCellValue {
  const values = judges
    .map((judge, judgeIndex) => {
      const note = judge.notes[row.clip.id] as NoteLike | undefined
      if (!hasAnyCriterionScore(note, group.criteria)) return null
      return row.categoryJudgeScores[group.category]?.[judgeIndex] ?? 0
    })
    .filter((value): value is number => value !== null)
  return formatAverage(values)
}

function getGlobalTotalAverage(
  row: ResultatsRow,
  judges: JudgeSource[],
  categoryGroups: CategoryGroup[],
): XlsxCellValue {
  const values = judges
    .map((judge, judgeIndex) => {
      const note = judge.notes[row.clip.id] as NoteLike | undefined
      const total = getJudgeTotalValue(note, row, judgeIndex, categoryGroups)
      return typeof total === 'number' ? total : null
    })
    .filter((value): value is number => value !== null)
  return formatAverage(values)
}

interface SummaryFieldDef {
  label: string
  headerStyle: XlsxCellStyle
  value: (row: ResultatsRow, index: number) => XlsxCellValue
  /** Render data cells with the wrapping comment style instead of score styling. */
  wrap?: boolean
}

function buildSummaryFields(options: ResultatsSpreadsheetExportOptions): SummaryFieldDef[] {
  const { currentBaremeTotalPoints, categoryGroups, judges, translate } = options
  const showJudges = options.excelShowJudges ?? true
  const showCategories = options.excelShowCategories ?? true
  const showRank = options.excelShowRank ?? true

  const fields: SummaryFieldDef[] = []
  if (showRank) {
    fields.push({ label: translate('Rang'), headerStyle: 'summaryHeader', value: (_row, index) => index + 1 })
  }
  if (showJudges) {
    judges.forEach((judge, judgeIndex) => {
      fields.push({
        label: judge.judgeName,
        headerStyle: 'summaryHeader',
        value: (row) =>
          getJudgeTotalValue(judge.notes[row.clip.id] as NoteLike | undefined, row, judgeIndex, categoryGroups),
      })
    })
  }
  fields.push({
    label: `${translate('Moy.')} /${currentBaremeTotalPoints}`,
    headerStyle: 'summaryHeader',
    value: (row) => getGlobalTotalAverage(row, judges, categoryGroups),
  })
  if (showCategories) {
    categoryGroups.forEach((group, groupIndex) => {
      fields.push({
        label: `${group.category} /${group.totalMax}`,
        headerStyle: categoryHeaderStyle(groupIndex),
        value: (row) => getGlobalCategoryAverage(row, group, judges),
      })
    })
  }
  if (options.includeComments) {
    fields.push({
      label: translate('Commentaires'),
      headerStyle: 'summaryHeader',
      value: (row) => buildClipComment(row.clip.id, { judges }),
      wrap: true,
    })
  }
  return fields
}

function createConfigurableSummarySheet(options: ResultatsSpreadsheetExportOptions): XlsxSheet {
  const { rows, translate } = options
  const orientation = options.excelOrientation ?? 'rows'
  const sortedRows = [...rows].sort(makeRowComparator(options))
  const fields = buildSummaryFields(options)
  const participantLabel = translate('Participant')
  const sheetTitle = translate('Synthèse finale')
  const outputRows: XlsxCell[][] = []

  if (orientation === 'columns') {
    // Transposed: each participant becomes a column, each metric a row.
    const columnCount = 1 + sortedRows.length
    const titleRow = createStyledRow(columnCount, 'finalHeader')
    titleRow[0] = cell(sheetTitle, 'finalHeader')
    outputRows.push(titleRow)

    const headerRow = createStyledRow(columnCount)
    headerRow[0] = cell(participantLabel, 'summaryHeader')
    sortedRows.forEach((row, index) => {
      headerRow[index + 1] = cell(clipLabel(row), 'summaryHeader')
    })
    outputRows.push(headerRow)

    fields.forEach((field) => {
      const outputRow = createStyledRow(columnCount)
      outputRow[0] = cell(field.label, field.headerStyle)
      sortedRows.forEach((row, index) => {
        const value = field.value(row, index)
        outputRow[index + 1] = field.wrap ? cell(value, 'comment') : scoreCell(value, index)
      })
      outputRows.push(outputRow)
    })

    const columnWidths: Array<number | undefined> = Array.from({ length: columnCount }, () => 13)
    columnWidths[0] = 20
    sortedRows.forEach((row, index) => {
      columnWidths[index + 1] = Math.max(12, Math.min(24, clipLabel(row).length + 2))
    })

    return {
      name: sheetTitle,
      rows: outputRows,
      columnWidths,
      rowHeights: computeRowHeights(outputRows, columnWidths, { 1: 24, 2: 24 }),
      merges: [`A1:${getColumnNameForExport(columnCount - 1)}1`],
      freezePane: { xSplit: 1, ySplit: 2, topLeftCell: 'B3' },
    }
  }

  // Default: participants as rows.
  const columnCount = 1 + fields.length
  const titleRow = createStyledRow(columnCount, 'finalHeader')
  titleRow[0] = cell(sheetTitle, 'finalHeader')
  outputRows.push(titleRow)

  const headerRow = createStyledRow(columnCount)
  headerRow[0] = cell(participantLabel, 'summaryHeader')
  fields.forEach((field, fieldIndex) => {
    headerRow[fieldIndex + 1] = cell(field.label, field.headerStyle)
  })
  outputRows.push(headerRow)

  sortedRows.forEach((row, rowIndex) => {
    const outputRow = createStyledRow(columnCount, rowIndex % 2 === 0 ? 'scoreEven' : 'scoreOdd')
    outputRow[0] = cell(clipLabel(row), 'nameCell')
    fields.forEach((field, fieldIndex) => {
      const value = field.value(row, rowIndex)
      outputRow[fieldIndex + 1] = field.wrap ? cell(value, 'comment') : scoreCell(value, rowIndex)
    })
    outputRows.push(outputRow)
  })

  const columnWidths: Array<number | undefined> = Array.from({ length: columnCount }, () => 14)
  columnWidths[0] = 28
  if (options.includeComments) {
    // Comments are the trailing field; give the column room to breathe.
    columnWidths[fields.length] = 60
  }

  return {
    name: sheetTitle,
    rows: outputRows,
    columnWidths,
    rowHeights: computeRowHeights(outputRows, columnWidths, { 1: 24, 2: 28 }),
    merges: [`A1:${getColumnNameForExport(columnCount - 1)}1`],
    freezePane: { xSplit: 1, ySplit: 2, topLeftCell: 'B3' },
  }
}

function createSimpleRankingSheet(options: ResultatsSpreadsheetExportOptions): XlsxSheet {
  const { currentBaremeTotalPoints, categoryGroups, judges, rows, translate } = options
  const includeComments = Boolean(options.includeComments)
  const columnCount = includeComments ? 4 : 3
  const sortedRows = [...rows].sort(makeRowComparator(options))

  const titleRow = createStyledRow(columnCount, 'finalHeader')
  titleRow[0] = cell(translate('Classement'), 'finalHeader')

  const headerRow: XlsxCell[] = [
    cell('#', 'summaryHeader'),
    cell(translate('Participant'), 'summaryHeader'),
    cell(`${translate('Total')} /${currentBaremeTotalPoints}`, 'summaryHeader'),
  ]
  if (includeComments) {
    headerRow.push(cell(translate('Commentaires'), 'summaryHeader'))
  }

  const outputRows: XlsxCell[][] = [
    titleRow,
    headerRow,
    ...sortedRows.map((row, rowIndex) => {
      const dataRow: XlsxCell[] = [
        scoreCell(rowIndex + 1, rowIndex),
        cell(clipLabel(row), 'nameCell'),
        scoreCell(getGlobalTotalAverage(row, judges, categoryGroups), rowIndex),
      ]
      if (includeComments) {
        dataRow.push(cell(buildClipComment(row.clip.id, { judges }), 'comment'))
      }
      return dataRow
    }),
  ]

  const columnWidths = includeComments ? [7, 34, 14, 60] : [7, 34, 14]

  return {
    name: translate('Classement'),
    rows: outputRows,
    columnWidths,
    rowHeights: computeRowHeights(outputRows, columnWidths, { 1: 24, 2: 24 }),
    merges: [includeComments ? 'A1:D1' : 'A1:C1'],
    freezePane: { xSplit: 0, ySplit: 2, topLeftCell: 'A3' },
  }
}

export function buildResultatsSpreadsheetSheets(options: ResultatsSpreadsheetExportOptions): XlsxSheet[] {
  const layout = options.excelLayout ?? 'full'

  if (layout === 'ranking') {
    return [createSimpleRankingSheet(options)]
  }

  const summarySheet = createConfigurableSummarySheet(options)
  if (layout === 'summary') {
    return [summarySheet]
  }

  const selectedJudge = options.judges[options.selectedJudgeIndex] ?? options.judges[0]
  const orderedJudgeEntries = options.judges
    .map((judge, judgeIndex) => ({ judge, judgeIndex }))
    .sort((a, b) => {
      if (selectedJudge && a.judge.key === selectedJudge.key) return -1
      if (selectedJudge && b.judge.key === selectedJudge.key) return 1
      return a.judgeIndex - b.judgeIndex
    })

  const judgeSheets = orderedJudgeEntries.map(({ judge, judgeIndex }) =>
    createJudgeSheet({
      ...options,
      judge,
      judgeIndex,
    }),
  )

  if (layout === 'judges') {
    // Always keep at least one sheet so the workbook is valid.
    return judgeSheets.length > 0 ? judgeSheets : [summarySheet]
  }

  return [summarySheet, ...judgeSheets]
}
