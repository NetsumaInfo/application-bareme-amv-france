export type XlsxCellValue = string | number | null | undefined

export type XlsxCellStyle =
  | 'default'
  | 'judgeTitle'
  | 'categoryHeader0'
  | 'categoryHeader1'
  | 'categoryHeader2'
  | 'categoryHeader3'
  | 'criterionHeader0'
  | 'criterionHeader1'
  | 'criterionHeader2'
  | 'criterionHeader3'
  | 'rankingHeader'
  | 'nameCell'
  | 'scoreOdd'
  | 'scoreEven'
  | 'missingScore'
  | 'spacer'
  | 'finalHeader'
  | 'finalLabel0'
  | 'finalLabel1'
  | 'finalLabel2'
  | 'finalLabel3'
  | 'totalLabel'
  | 'totalScore'
  | 'summaryHeader'

export interface XlsxCell {
  value?: XlsxCellValue
  style?: XlsxCellStyle
}

type XlsxCellInput = XlsxCellValue | XlsxCell

interface XlsxFreezePane {
  xSplit?: number
  ySplit?: number
  topLeftCell?: string
}

export interface XlsxSheet {
  name: string
  rows: XlsxCellInput[][]
  columnWidths?: Array<number | undefined>
  rowHeights?: Record<number, number>
  merges?: string[]
  freezePane?: XlsxFreezePane
}

interface ZipFileEntry {
  path: string
  data: Uint8Array
}

const textEncoder = new TextEncoder()
const crcTable = new Uint32Array(256)

const STYLE_INDEX: Record<XlsxCellStyle, number> = {
  default: 0,
  judgeTitle: 1,
  categoryHeader0: 2,
  categoryHeader1: 3,
  categoryHeader2: 4,
  categoryHeader3: 5,
  criterionHeader0: 6,
  criterionHeader1: 7,
  criterionHeader2: 8,
  criterionHeader3: 9,
  rankingHeader: 10,
  nameCell: 11,
  scoreOdd: 12,
  scoreEven: 13,
  missingScore: 14,
  spacer: 15,
  finalHeader: 16,
  finalLabel0: 17,
  finalLabel1: 18,
  finalLabel2: 19,
  finalLabel3: 20,
  totalLabel: 21,
  totalScore: 22,
  summaryHeader: 23,
}

for (let index = 0; index < 256; index += 1) {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }
  crcTable[index] = value >>> 0
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function sanitizeSheetName(value: string, fallback: string): string {
  const forbiddenCharacters = new Set(['[', ']', ':', '*', '?', '/', '\\'])
  const cleaned = Array.from(value, (char) => (forbiddenCharacters.has(char) ? ' ' : char))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
  return (cleaned || fallback).slice(0, 31)
}

function getColumnName(columnIndex: number): string {
  let value = columnIndex + 1
  let name = ''
  while (value > 0) {
    const remainder = (value - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    value = Math.floor((value - 1) / 26)
  }
  return name
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of data) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff]
  }
  return (crc ^ 0xffffffff) >>> 0
}

function writeUInt16(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 0xff
  target[offset + 1] = (value >>> 8) & 0xff
}

function writeUInt32(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 0xff
  target[offset + 1] = (value >>> 8) & 0xff
  target[offset + 2] = (value >>> 16) & 0xff
  target[offset + 3] = (value >>> 24) & 0xff
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0)
  const output = new Uint8Array(totalLength)
  let offset = 0
  for (const part of parts) {
    output.set(part, offset)
    offset += part.length
  }
  return output
}

function createZip(files: ZipFileEntry[]): Uint8Array {
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let offset = 0

  for (const file of files) {
    const nameBytes = textEncoder.encode(file.path)
    const checksum = crc32(file.data)

    const localHeader = new Uint8Array(30 + nameBytes.length)
    writeUInt32(localHeader, 0, 0x04034b50)
    writeUInt16(localHeader, 4, 20)
    writeUInt16(localHeader, 6, 0x0800)
    writeUInt16(localHeader, 8, 0)
    writeUInt16(localHeader, 10, 0)
    writeUInt16(localHeader, 12, 0)
    writeUInt32(localHeader, 14, checksum)
    writeUInt32(localHeader, 18, file.data.length)
    writeUInt32(localHeader, 22, file.data.length)
    writeUInt16(localHeader, 26, nameBytes.length)
    writeUInt16(localHeader, 28, 0)
    localHeader.set(nameBytes, 30)

    localParts.push(localHeader, file.data)

    const centralHeader = new Uint8Array(46 + nameBytes.length)
    writeUInt32(centralHeader, 0, 0x02014b50)
    writeUInt16(centralHeader, 4, 20)
    writeUInt16(centralHeader, 6, 20)
    writeUInt16(centralHeader, 8, 0x0800)
    writeUInt16(centralHeader, 10, 0)
    writeUInt16(centralHeader, 12, 0)
    writeUInt16(centralHeader, 14, 0)
    writeUInt32(centralHeader, 16, checksum)
    writeUInt32(centralHeader, 20, file.data.length)
    writeUInt32(centralHeader, 24, file.data.length)
    writeUInt16(centralHeader, 28, nameBytes.length)
    writeUInt16(centralHeader, 30, 0)
    writeUInt16(centralHeader, 32, 0)
    writeUInt16(centralHeader, 34, 0)
    writeUInt16(centralHeader, 36, 0)
    writeUInt32(centralHeader, 38, 0)
    writeUInt32(centralHeader, 42, offset)
    centralHeader.set(nameBytes, 46)
    centralParts.push(centralHeader)

    offset += localHeader.length + file.data.length
  }

  const localData = concatBytes(localParts)
  const centralData = concatBytes(centralParts)
  const endRecord = new Uint8Array(22)
  writeUInt32(endRecord, 0, 0x06054b50)
  writeUInt16(endRecord, 4, 0)
  writeUInt16(endRecord, 6, 0)
  writeUInt16(endRecord, 8, files.length)
  writeUInt16(endRecord, 10, files.length)
  writeUInt32(endRecord, 12, centralData.length)
  writeUInt32(endRecord, 16, localData.length)
  writeUInt16(endRecord, 20, 0)

  return concatBytes([localData, centralData, endRecord])
}

function isXlsxCell(value: XlsxCellInput): value is XlsxCell {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeCell(cell: XlsxCellInput): XlsxCell {
  return isXlsxCell(cell) ? cell : { value: cell }
}

function createColsXml(widths: Array<number | undefined> | undefined): string {
  if (!widths?.some((width) => typeof width === 'number' && Number.isFinite(width))) return ''
  const cols = widths.map((width, index) => {
    if (typeof width !== 'number' || !Number.isFinite(width)) return ''
    const safeWidth = Math.max(2, Math.min(80, width))
    return `<col customWidth="1" min="${index + 1}" max="${index + 1}" width="${safeWidth}"/>`
  }).join('')
  return `<cols>${cols}</cols>`
}

function createSheetViewsXml(freezePane?: XlsxFreezePane): string {
  const xSplit = Math.max(0, Math.round(freezePane?.xSplit ?? 0))
  const ySplit = Math.max(0, Math.round(freezePane?.ySplit ?? 0))
  if (xSplit === 0 && ySplit === 0) {
    return '<sheetViews><sheetView workbookViewId="0"/></sheetViews>'
  }

  const topLeftCell = freezePane?.topLeftCell ?? `${getColumnName(xSplit)}${ySplit + 1}`
  const activePane = xSplit > 0 && ySplit > 0
    ? 'bottomRight'
    : ySplit > 0
      ? 'bottomLeft'
      : 'topRight'
  const xSplitAttr = xSplit > 0 ? ` xSplit="${xSplit}"` : ''
  const ySplitAttr = ySplit > 0 ? ` ySplit="${ySplit}"` : ''

  return `<sheetViews><sheetView workbookViewId="0"><pane${xSplitAttr}${ySplitAttr} topLeftCell="${escapeXml(topLeftCell)}" activePane="${activePane}" state="frozen"/><selection pane="${activePane}"/></sheetView></sheetViews>`
}

function createMergeCellsXml(merges: string[] | undefined): string {
  const safeMerges = (merges ?? []).filter((range) => range.trim().length > 0)
  if (safeMerges.length === 0) return ''
  const cells = safeMerges.map((range) => `<mergeCell ref="${escapeXml(range)}"/>`).join('')
  return `<mergeCells count="${safeMerges.length}">${cells}</mergeCells>`
}

function getMaxColumnCount(rows: XlsxCellInput[][]): number {
  return rows.reduce((max, row) => Math.max(max, row.length), 1)
}

function getStyleIndex(style: XlsxCellStyle | undefined): number {
  return style ? STYLE_INDEX[style] : STYLE_INDEX.default
}

function createWorksheetXml(sheet: XlsxSheet): string {
  const maxColumnCount = getMaxColumnCount(sheet.rows)
  const maxRowCount = Math.max(sheet.rows.length, 1)
  const dimensionRef = `A1:${getColumnName(maxColumnCount - 1)}${maxRowCount}`
  const rows = sheet.rows.map((row, rowIndex) => {
    const rowNumber = rowIndex + 1
    const rowHeight = sheet.rowHeights?.[rowNumber]
    const rowHeightAttrs = typeof rowHeight === 'number' && Number.isFinite(rowHeight)
      ? ` ht="${Math.max(1, rowHeight)}" customHeight="1"`
      : ''

    const cells = row.map((cellInput, columnIndex) => {
      const cell = normalizeCell(cellInput)
      const hasStyle = Boolean(cell.style)
      const value = cell.value
      if (!hasStyle && (value === null || value === undefined || value === '')) return ''

      const ref = `${getColumnName(columnIndex)}${rowNumber}`
      const styleAttr = hasStyle ? ` s="${getStyleIndex(cell.style)}"` : ''

      if (value === null || value === undefined || value === '') {
        return `<c r="${ref}"${styleAttr}/>`
      }

      if (typeof value === 'number' && Number.isFinite(value)) {
        return `<c r="${ref}"${styleAttr}><v>${value}</v></c>`
      }

      const text = String(value)
      const preserveSpace = text.trim() !== text ? ' xml:space="preserve"' : ''
      return `<c r="${ref}"${styleAttr} t="inlineStr"><is><t${preserveSpace}>${escapeXml(text)}</t></is></c>`
    }).join('')

    return `<row r="${rowNumber}"${rowHeightAttrs}>${cells}</row>`
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="${dimensionRef}"/>
  ${createSheetViewsXml(sheet.freezePane)}
  <sheetFormatPr defaultColWidth="12.63" defaultRowHeight="15"/>
  ${createColsXml(sheet.columnWidths)}
  <sheetData>${rows}</sheetData>
  ${createMergeCellsXml(sheet.merges)}
  <pageMargins left="0.5" right="0.5" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>
</worksheet>`
}

function createWorkbookXml(sheetNames: string[]): string {
  const sheets = sheetNames.map((name, index) => (
    `<sheet name="${escapeXml(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
  )).join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <workbookViews><workbookView/></workbookViews>
  <sheets>${sheets}</sheets>
</workbook>`
}

function createWorkbookRelsXml(sheetCount: number): string {
  const sheetRels = Array.from({ length: sheetCount }, (_, index) => (
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
  )).join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheetRels}
  <Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
}

function createContentTypesXml(sheetCount: number): string {
  const worksheetOverrides = Array.from({ length: sheetCount }, (_, index) => (
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  )).join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${worksheetOverrides}
</Types>`
}

function createRootRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
}

function fontXml(options: { bold?: boolean; size: number; color: string }): string {
  const bold = options.bold ? '<b/>' : ''
  return `<font>${bold}<sz val="${options.size}"/><color rgb="${options.color}"/><name val="Arial"/><family val="2"/></font>`
}

function fillXml(color: string | null): string {
  if (!color) return '<fill><patternFill patternType="none"/></fill>'
  if (color === 'gray125') return '<fill><patternFill patternType="gray125"/></fill>'
  return `<fill><patternFill patternType="solid"><fgColor rgb="${color}"/><bgColor rgb="${color}"/></patternFill></fill>`
}

function xfXml({
  fontId,
  fillId,
  borderId,
  horizontal = 'center',
  vertical = 'center',
  wrapText = false,
}: {
  fontId: number
  fillId: number
  borderId: number
  horizontal?: 'left' | 'center' | 'right'
  vertical?: 'bottom' | 'center'
  wrapText?: boolean
}): string {
  const wrap = wrapText ? ' wrapText="1"' : ''
  return `<xf borderId="${borderId}" fillId="${fillId}" fontId="${fontId}" numFmtId="0" xfId="0" applyAlignment="1" applyBorder="${borderId > 0 ? 1 : 0}" applyFill="${fillId > 1 ? 1 : 0}" applyFont="1"><alignment horizontal="${horizontal}" vertical="${vertical}"${wrap}/></xf>`
}

function createStylesXml(): string {
  const fonts = [
    fontXml({ size: 10, color: 'FF000000' }),
    fontXml({ bold: true, size: 11, color: 'FFEAD1DC' }),
    fontXml({ bold: true, size: 10, color: 'FF000000' }),
    fontXml({ bold: true, size: 9, color: 'FF000000' }),
    fontXml({ bold: true, size: 9, color: 'FFFFFFFF' }),
    fontXml({ bold: true, size: 12, color: 'FFFFFFFF' }),
    fontXml({ bold: true, size: 10, color: 'FF000000' }),
  ]

  const fills = [
    fillXml(null),
    fillXml('gray125'),
    fillXml('FF434343'),
    fillXml('FFE6B8AF'),
    fillXml('FFB4A7D6'),
    fillXml('FFC9DAF8'),
    fillXml('FFF3F3F3'),
    fillXml('FFEAD1DC'),
    fillXml('FFFFD966'),
    fillXml('FFFFFFFF'),
    fillXml('FFB6D7A8'),
    fillXml('FFD9EAD3'),
    fillXml('FFCFE2F3'),
    fillXml('FFEFEFEF'),
  ]

  const borders = [
    '<border><left/><right/><top/><bottom/><diagonal/></border>',
    '<border><left style="thin"><color rgb="FF000000"/></left><right style="thin"><color rgb="FF000000"/></right><top style="thin"><color rgb="FF000000"/></top><bottom style="thin"><color rgb="FF000000"/></bottom><diagonal/></border>',
  ]

  const cellXfs = [
    xfXml({ fontId: 0, fillId: 0, borderId: 0, horizontal: 'left', vertical: 'bottom' }),
    xfXml({ fontId: 1, fillId: 2, borderId: 1 }),
    xfXml({ fontId: 2, fillId: 3, borderId: 1, wrapText: true }),
    xfXml({ fontId: 2, fillId: 4, borderId: 1, wrapText: true }),
    xfXml({ fontId: 2, fillId: 5, borderId: 1, wrapText: true }),
    xfXml({ fontId: 2, fillId: 10, borderId: 1, wrapText: true }),
    xfXml({ fontId: 3, fillId: 3, borderId: 1, wrapText: true }),
    xfXml({ fontId: 3, fillId: 4, borderId: 1, wrapText: true }),
    xfXml({ fontId: 3, fillId: 5, borderId: 1, wrapText: true }),
    xfXml({ fontId: 3, fillId: 10, borderId: 1, wrapText: true }),
    xfXml({ fontId: 2, fillId: 8, borderId: 1, wrapText: true }),
    xfXml({ fontId: 4, fillId: 2, borderId: 1, horizontal: 'left' }),
    xfXml({ fontId: 0, fillId: 9, borderId: 1 }),
    xfXml({ fontId: 0, fillId: 13, borderId: 1 }),
    xfXml({ fontId: 0, fillId: 6, borderId: 1 }),
    xfXml({ fontId: 0, fillId: 6, borderId: 0 }),
    xfXml({ fontId: 5, fillId: 2, borderId: 1, wrapText: true }),
    xfXml({ fontId: 6, fillId: 3, borderId: 1, horizontal: 'left', wrapText: true }),
    xfXml({ fontId: 6, fillId: 4, borderId: 1, horizontal: 'left', wrapText: true }),
    xfXml({ fontId: 6, fillId: 5, borderId: 1, horizontal: 'left', wrapText: true }),
    xfXml({ fontId: 6, fillId: 10, borderId: 1, horizontal: 'left', wrapText: true }),
    xfXml({ fontId: 2, fillId: 11, borderId: 1, horizontal: 'left', wrapText: true }),
    xfXml({ fontId: 2, fillId: 11, borderId: 1 }),
    xfXml({ fontId: 2, fillId: 12, borderId: 1, wrapText: true }),
  ]

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="${fonts.length}">${fonts.join('')}</fonts>
  <fills count="${fills.length}">${fills.join('')}</fills>
  <borders count="${borders.length}">${borders.join('')}</borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="${cellXfs.length}">${cellXfs.join('')}</cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
  <dxfs count="0"/>
  <tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`
}

export function createXlsxWorkbook(sheets: XlsxSheet[]): Uint8Array {
  const safeSheets = sheets.length > 0 ? sheets : [{ name: 'Export', rows: [[]] }]
  const seenSheetNames = new Set<string>()
  const normalizedSheets = safeSheets.map((sheet, index) => {
    const baseName = sanitizeSheetName(sheet.name, `Feuille ${index + 1}`)
    let name = baseName
    let suffix = 2
    while (seenSheetNames.has(name.toLowerCase())) {
      const suffixText = ` ${suffix}`
      name = `${baseName.slice(0, Math.max(1, 31 - suffixText.length))}${suffixText}`
      suffix += 1
    }
    seenSheetNames.add(name.toLowerCase())
    return { ...sheet, name }
  })

  const files: ZipFileEntry[] = [
    { path: '[Content_Types].xml', data: textEncoder.encode(createContentTypesXml(normalizedSheets.length)) },
    { path: '_rels/.rels', data: textEncoder.encode(createRootRelsXml()) },
    { path: 'xl/workbook.xml', data: textEncoder.encode(createWorkbookXml(normalizedSheets.map((sheet) => sheet.name))) },
    { path: 'xl/_rels/workbook.xml.rels', data: textEncoder.encode(createWorkbookRelsXml(normalizedSheets.length)) },
    { path: 'xl/styles.xml', data: textEncoder.encode(createStylesXml()) },
    ...normalizedSheets.map((sheet, index) => ({
      path: `xl/worksheets/sheet${index + 1}.xml`,
      data: textEncoder.encode(createWorksheetXml(sheet)),
    })),
  ]

  return createZip(files)
}
