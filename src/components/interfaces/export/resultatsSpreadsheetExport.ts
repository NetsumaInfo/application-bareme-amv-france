import type { Criterion } from '@/types/bareme'
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

interface ResultatsSpreadsheetExportOptions {
  mainView: ResultatsMainView
  globalVariant: ResultatsGlobalVariant
  currentBaremeTotalPoints: number
  categoryGroups: CategoryGroup[]
  judges: JudgeSource[]
  rows: ResultatsRow[]
  selectedJudgeIndex: number
  translate: (key: string, params?: Record<string, string | number | null | undefined>) => string
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
}: ResultatsSpreadsheetExportOptions & { judge: JudgeSource; judgeIndex: number }): XlsxSheet {
  const criteria = categoryGroups.flatMap((group) => group.criteria.map((criterion) => ({ group, criterion })))
  const rankingStartColumn = criteria.length + 2
  const rankingWidth = 3
  const finalStartRow = rows.length + 5
  const minimumColumns = rankingStartColumn + rankingWidth
  const finalColumns = rows.length + 1
  const columnCount = Math.max(minimumColumns, finalColumns)
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
    rowHeights,
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

function createFinalSummarySheet({
  currentBaremeTotalPoints,
  categoryGroups,
  judges,
  rows,
  translate,
}: ResultatsSpreadsheetExportOptions): XlsxSheet {
  const columnCount = 4 + judges.length + categoryGroups.length
  const merges = [`A1:${getColumnNameForExport(columnCount - 1)}1`]
  const columnWidths: Array<number | undefined> = Array.from({ length: columnCount }, () => 15)
  columnWidths[0] = 7
  columnWidths[1] = 28
  judges.forEach((judge, index) => {
    columnWidths[index + 2] = Math.max(12, Math.min(24, judge.judgeName.length + 4))
  })
  columnWidths[2 + judges.length] = 13
  columnWidths[3 + judges.length] = 12
  categoryGroups.forEach((group, index) => {
    columnWidths[4 + judges.length + index] = Math.max(14, Math.min(26, group.category.length + 4))
  })

  const sortedRows = sortRowsByScore(rows, (row) => getGlobalTotalAverage(row, judges, categoryGroups))
  const titleRow = createStyledRow(columnCount)
  titleRow[0] = cell(translate('Synthèse finale'), 'finalHeader')
  for (let columnIndex = 1; columnIndex < columnCount; columnIndex += 1) {
    titleRow[columnIndex] = cell('', 'finalHeader')
  }

  const headerRow = createStyledRow(columnCount)
  headerRow[0] = cell('#', 'summaryHeader')
  headerRow[1] = cell(translate('Participant'), 'summaryHeader')
  judges.forEach((judge, index) => {
    headerRow[index + 2] = cell(judge.judgeName, 'summaryHeader')
  })
  headerRow[2 + judges.length] = cell(`${translate('Moy.')} /${currentBaremeTotalPoints}`, 'summaryHeader')
  headerRow[3 + judges.length] = cell(translate('Rang'), 'summaryHeader')
  categoryGroups.forEach((group, index) => {
    headerRow[4 + judges.length + index] = cell(`${group.category} /${group.totalMax}`, categoryHeaderStyle(index))
  })

  const outputRows: XlsxCell[][] = [
    titleRow,
    headerRow,
    ...sortedRows.map((row, rowIndex) => {
      const outputRow = createStyledRow(columnCount, rowIndex % 2 === 0 ? 'scoreEven' : 'scoreOdd')
      outputRow[0] = scoreCell(rowIndex + 1, rowIndex)
      outputRow[1] = cell(clipLabel(row), 'nameCell')
      judges.forEach((judge, judgeIndex) => {
        const note = judge.notes[row.clip.id] as NoteLike | undefined
        outputRow[judgeIndex + 2] = scoreCell(getJudgeTotalValue(note, row, judgeIndex, categoryGroups), rowIndex)
      })
      outputRow[2 + judges.length] = scoreCell(getGlobalTotalAverage(row, judges, categoryGroups), rowIndex)
      outputRow[3 + judges.length] = scoreCell(rowIndex + 1, rowIndex)
      categoryGroups.forEach((group, groupIndex) => {
        outputRow[4 + judges.length + groupIndex] = scoreCell(getGlobalCategoryAverage(row, group, judges), rowIndex)
      })
      return outputRow
    }),
  ]

  return {
    name: translate('Synthèse finale'),
    rows: outputRows,
    columnWidths,
    rowHeights: { 1: 24, 2: 28 },
    merges,
    freezePane: { xSplit: 2, ySplit: 2, topLeftCell: 'C3' },
  }
}

export function buildResultatsSpreadsheetSheets(options: ResultatsSpreadsheetExportOptions): XlsxSheet[] {
  const selectedJudge = options.judges[options.selectedJudgeIndex] ?? options.judges[0]
  const orderedJudgeEntries = options.judges
    .map((judge, judgeIndex) => ({ judge, judgeIndex }))
    .sort((a, b) => {
      if (selectedJudge && a.judge.key === selectedJudge.key) return -1
      if (selectedJudge && b.judge.key === selectedJudge.key) return 1
      return a.judgeIndex - b.judgeIndex
    })

  return [
    createFinalSummarySheet(options),
    ...orderedJudgeEntries.map(({ judge, judgeIndex }) =>
      createJudgeSheet({
        ...options,
        judge,
        judgeIndex,
      }),
    ),
  ]
}
