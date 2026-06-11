import type { jsPDF } from 'jspdf'
import * as tauri from '@/services/tauri'
import { extractTimecodesFromText } from '@/utils/timecodes'
import { formatPreciseTimecode } from '@/utils/formatters'
import type { ExportNotesPdfMode } from '@/components/interfaces/export/types'

export interface ExportNotesPdfJudgeEntry {
  judgeName: string
  generalNote: string
  categoryNotes: Array<{ category: string; text: string }>
  criterionNotes: Array<{ criterion: string; text: string }>
}

export interface ExportNotesPdfClipEntry {
  primary: string
  secondary: string
  generalNote: string
  judges: ExportNotesPdfJudgeEntry[]
  filePath: string | null
  duration: number | null
}

export interface ExportNotesPdfPayload {
  mode: ExportNotesPdfMode
  title: string
  entries: ExportNotesPdfClipEntry[]
  includeTimecodeThumbnails: boolean
}

export interface NotesTimecodeMarker {
  pageNum: number
  x: number
  y: number
  w: number
  h: number
  frameKey: string
  label: string
  source: string
}

interface TimecodeRef {
  seconds: number
  label: string
  source: string
}

const TIMECODE_THUMB_WIDTH_PX = 240
const TIMECODE_THUMB_FETCH_CONCURRENCY = 4

type Translate = (key: string, params?: Record<string, string | number>) => string

export function previewCacheKey(filePath: string, seconds: number): string {
  return `${filePath}|${seconds.toFixed(2)}`
}

function collectEntryTimecodes(
  entry: ExportNotesPdfClipEntry,
  mode: ExportNotesPdfMode,
): TimecodeRef[] {
  const map = new Map<string, TimecodeRef>()
  const maxSeconds = entry.duration && entry.duration > 0 ? entry.duration : undefined
  const add = (text: string | undefined | null, source: string) => {
    if (!text) return
    const parsed = extractTimecodesFromText(text, maxSeconds)
    for (const tc of parsed) {
      if (!Number.isFinite(tc.seconds) || tc.seconds < 0) continue
      const key = tc.seconds.toFixed(2)
      const existing = map.get(key)
      if (existing) {
        if (!existing.source.includes(source)) {
          existing.source = `${existing.source}, ${source}`
        }
        continue
      }
      map.set(key, {
        seconds: tc.seconds,
        label: formatPreciseTimecode(tc.seconds),
        source,
      })
    }
  }
  if (mode === 'general' || mode === 'both') {
    add(entry.generalNote, 'general')
  }
  if (mode === 'judges' || mode === 'both') {
    for (const judge of entry.judges) {
      add(judge.generalNote, judge.judgeName)
      for (const cat of judge.categoryNotes) {
        add(cat.text, `${judge.judgeName} - ${cat.category}`)
      }
      for (const cr of judge.criterionNotes) {
        add(cr.text, `${judge.judgeName} - ${cr.criterion}`)
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.seconds - b.seconds)
}

/**
 * Pre-extracts frame thumbnails for every timecode referenced in the notes so the
 * PDF hover overlay can embed them. Returns an empty map when thumbnails are off.
 */
export async function fetchTimecodePreviews(
  payload: ExportNotesPdfPayload,
): Promise<Map<string, string>> {
  const previews = new Map<string, string>()
  if (!payload.includeTimecodeThumbnails) return previews

  const requests: Array<{ filePath: string; seconds: number; key: string }> = []
  const seen = new Set<string>()
  for (const entry of payload.entries) {
    if (!entry.filePath) continue
    const tcs = collectEntryTimecodes(entry, payload.mode)
    for (const tc of tcs) {
      const key = previewCacheKey(entry.filePath, tc.seconds)
      if (seen.has(key)) continue
      seen.add(key)
      requests.push({ filePath: entry.filePath, seconds: tc.seconds, key })
    }
  }

  let cursor = 0
  const worker = async () => {
    while (cursor < requests.length) {
      const index = cursor
      cursor += 1
      const req = requests[index]
      try {
        const dataUrl = await tauri.playerGetFramePreview(req.filePath, req.seconds, TIMECODE_THUMB_WIDTH_PX)
        if (dataUrl) previews.set(req.key, dataUrl)
      } catch {
        // skip — frame extraction can fail for missing files / unsupported codecs
      }
    }
  }
  const workerCount = Math.min(TIMECODE_THUMB_FETCH_CONCURRENCY, Math.max(1, requests.length))
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  return previews
}

interface RenderNotesOptions {
  /** Add a fresh page before rendering (use when appending after other content). */
  startNewPage?: boolean
}

/**
 * Writes the notes/comments content into an existing jsPDF document as real text
 * (selectable, with underlined timecodes) and returns the hover-overlay markers.
 * Shared by the standalone "Notes" export and the table PDF "include comments" path.
 */
export function renderNotesPdfPages(
  pdf: jsPDF,
  payload: ExportNotesPdfPayload,
  previews: Map<string, string>,
  t: Translate,
  options: RenderNotesOptions = {},
): NotesTimecodeMarker[] {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 30
  const contentWidth = pageWidth - margin * 2
  const lineHeight = 14

  if (options.startNewPage) pdf.addPage()
  let y = margin

  const markers: NotesTimecodeMarker[] = []
  let currentEntryFilePath: string | null = null
  let currentEntryDuration: number | null = null
  let currentEntrySource = ''

  const ensureSpace = (height: number) => {
    if (y + height <= pageHeight - margin) return
    pdf.addPage()
    y = margin
  }

  const writeLines = (text: string, fontSize: number, fontStyle: 'normal' | 'bold', indent = 0) => {
    const safe = text.trim().length > 0 ? text : t('Aucune note.')
    pdf.setFont('helvetica', fontStyle)
    pdf.setFontSize(fontSize)
    const startX = margin + indent
    const maxWidth = Math.max(80, contentWidth - indent)
    const lines = pdf.splitTextToSize(safe, maxWidth)
    const shouldRecord =
      payload.includeTimecodeThumbnails
      && Boolean(currentEntryFilePath)
      && previews.size > 0
    for (const line of lines) {
      ensureSpace(lineHeight)
      pdf.text(line, startX, y)
      if (shouldRecord && currentEntryFilePath) {
        const tcs = extractTimecodesFromText(line, currentEntryDuration ?? undefined)
        for (const tc of tcs) {
          const frameKey = previewCacheKey(currentEntryFilePath, tc.seconds)
          if (!previews.has(frameKey)) continue
          const prefix = line.slice(0, tc.index)
          const prefixWidth = pdf.getTextWidth(prefix)
          const tcWidth = pdf.getTextWidth(tc.raw)
          markers.push({
            pageNum: pdf.getCurrentPageInfo().pageNumber,
            x: startX + prefixWidth,
            y: y - fontSize * 0.85,
            w: tcWidth,
            h: fontSize * 1.1,
            frameKey,
            label: formatPreciseTimecode(tc.seconds),
            source: currentEntrySource,
          })
          pdf.setDrawColor(59, 130, 246)
          pdf.setLineWidth(0.6)
          pdf.line(startX + prefixWidth, y + 1.5, startX + prefixWidth + tcWidth, y + 1.5)
        }
      }
      y += lineHeight
    }
  }

  const getLineCount = (
    text: string,
    fontSize: number,
    indent = 0,
    fontStyle: 'normal' | 'bold' = 'normal',
  ): number => {
    const safe = text.trim().length > 0 ? text : t('Aucune note.')
    pdf.setFont('helvetica', fontStyle)
    pdf.setFontSize(fontSize)
    const lines = pdf.splitTextToSize(safe, Math.max(80, contentWidth - indent))
    return Array.isArray(lines) ? Math.max(1, lines.length) : 1
  }

  const writeGap = (height = 8) => {
    ensureSpace(height)
    y += height
  }

  pdf.setTextColor(15, 23, 42)
  writeLines(`${t('Notes export')} - ${payload.title}`, 16, 'bold')
  writeGap(6)
  writeLines(
    `${t('Mode')}: ${
      payload.mode === 'general'
        ? t('Commentaires généraux')
        : payload.mode === 'judges'
          ? t('Commentaires des juges')
          : t('Commentaires généraux + commentaires des juges')
    }`,
    10,
    'normal',
  )
  writeGap(8)

  payload.entries.forEach((entry, index) => {
    currentEntryFilePath = entry.filePath
    currentEntryDuration = entry.duration
    currentEntrySource = entry.primary

    const titleText = `${index + 1}. ${entry.primary}${entry.secondary ? ` - ${entry.secondary}` : ''}`
    const hasGeneralSection = payload.mode === 'general' || payload.mode === 'both'
    const hasJudgesSection = payload.mode === 'judges' || payload.mode === 'both'

    let minimumEntryHeight = getLineCount(titleText, 12, 0, 'bold') * lineHeight

    if (hasGeneralSection) {
      const generalPreview = entry.generalNote.trim().length > 0 ? entry.generalNote : t('Aucune note.')
      minimumEntryHeight += 2 + lineHeight
      minimumEntryHeight += Math.min(2, getLineCount(generalPreview, 10, 12, 'normal')) * lineHeight
    }

    if (hasJudgesSection) {
      minimumEntryHeight += 4 + lineHeight
      if (entry.judges.length === 0) {
        minimumEntryHeight += lineHeight
      } else {
        const firstJudge = entry.judges[0]
        const firstJudgePreview = firstJudge.generalNote.trim().length > 0
          ? firstJudge.generalNote
          : t('Aucun commentaire général.')
        minimumEntryHeight += 2 + lineHeight
        minimumEntryHeight += Math.min(2, getLineCount(firstJudgePreview, 10, 18, 'normal')) * lineHeight
      }
    }

    ensureSpace(minimumEntryHeight + 6)
    writeLines(titleText, 12, 'bold')

    if (hasGeneralSection) {
      writeGap(2)
      currentEntrySource = `${entry.primary} - ${t('Commentaire général')}`
      writeLines(t('Commentaire général'), 10, 'bold', 6)
      writeLines(entry.generalNote, 10, 'normal', 12)
    }

    if (hasJudgesSection) {
      writeGap(4)
      const judgesHeaderReserve = entry.judges.length === 0
        ? lineHeight * 2
        : lineHeight * 3
      ensureSpace(judgesHeaderReserve)
      writeLines(t('Commentaires des juges'), 10, 'bold', 6)

      if (entry.judges.length === 0) {
        writeLines(t('Aucune note juge.'), 10, 'normal', 12)
      } else {
        entry.judges.forEach((judge) => {
          const judgePreview = judge.generalNote.trim().length > 0 ? judge.generalNote : t('Aucun commentaire général.')
          const judgeIntroHeight =
            2
            + lineHeight
            + (Math.min(2, getLineCount(judgePreview, 10, 18, 'normal')) * lineHeight)
          ensureSpace(judgeIntroHeight)
          writeGap(2)
          currentEntrySource = `${entry.primary} - ${judge.judgeName}`
          writeLines(judge.judgeName, 10, 'bold', 12)

          if (judge.generalNote.trim().length > 0) {
            writeLines(judge.generalNote, 10, 'normal', 18)
          } else {
            writeLines(t('Aucun commentaire général.'), 10, 'normal', 18)
          }

          if (judge.categoryNotes.length > 0) {
            const firstCategoryLine = `- ${judge.categoryNotes[0].category}: ${judge.categoryNotes[0].text}`
            const categoryHeaderHeight = lineHeight + (Math.min(2, getLineCount(firstCategoryLine, 9, 24, 'normal')) * lineHeight)
            ensureSpace(categoryHeaderHeight)
            writeLines(`${t('Commentaires catégorie')}:`, 9, 'bold', 18)
            judge.categoryNotes.forEach((item) => {
              currentEntrySource = `${entry.primary} - ${judge.judgeName} - ${item.category}`
              writeLines(`- ${item.category}: ${item.text}`, 9, 'normal', 24)
            })
          }

          if (judge.criterionNotes.length > 0) {
            const firstCriterionLine = `- ${judge.criterionNotes[0].criterion}: ${judge.criterionNotes[0].text}`
            const criterionHeaderHeight = lineHeight + (Math.min(2, getLineCount(firstCriterionLine, 9, 24, 'normal')) * lineHeight)
            ensureSpace(criterionHeaderHeight)
            writeLines(`${t('Commentaires sous-catégorie')}:`, 9, 'bold', 18)
            judge.criterionNotes.forEach((item) => {
              currentEntrySource = `${entry.primary} - ${judge.judgeName} - ${item.criterion}`
              writeLines(`- ${item.criterion}: ${item.text}`, 9, 'normal', 24)
            })
          }
        })
      }
    }

    writeGap(10)
  })

  return markers
}
