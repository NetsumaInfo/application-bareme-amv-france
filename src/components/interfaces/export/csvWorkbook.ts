import type { XlsxSheet } from '@/components/interfaces/export/xlsxWorkbook'

const SEPARATOR = ';'
const LINE_BREAK = '\r\n'
// UTF-8 BOM so Excel opens accented French text with correct encoding.
const BOM = '﻿'

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

function escapeCell(raw: string): string {
  // Quote when the value contains the separator, quotes, or a line break.
  if (/[";\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`
  }
  return raw
}

function sheetToCsvRows(sheet: XlsxSheet): string[] {
  return sheet.rows.map((row) =>
    row
      .map((cellInput) => {
        const value =
          cellInput && typeof cellInput === 'object' && 'value' in cellInput
            ? cellInput.value
            : cellInput
        return escapeCell(formatCellValue(value))
      })
      .join(SEPARATOR),
  )
}

/**
 * Build a single CSV document from the same sheet model used for the XLSX export.
 * Multiple judge sheets are concatenated, each preceded by a title line and
 * separated by a blank line so the result stays readable in Excel/LibreOffice.
 */
export function createCsvDocument(sheets: XlsxSheet[]): string {
  const safeSheets = sheets.length > 0 ? sheets : [{ name: 'Export', rows: [[]] }]
  const blocks = safeSheets.map((sheet) => {
    const titleLine = sheet.name ? escapeCell(sheet.name) : ''
    const dataLines = sheetToCsvRows(sheet)
    return [titleLine, ...dataLines].join(LINE_BREAK)
  })
  return BOM + blocks.join(LINE_BREAK + LINE_BREAK) + LINE_BREAK
}
