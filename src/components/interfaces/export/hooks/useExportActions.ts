import { useCallback, useState } from 'react'
import type { RefObject } from 'react'
import { save } from '@tauri-apps/api/dialog'
import { writeBinaryFile } from '@tauri-apps/api/fs'
import { join } from '@tauri-apps/api/path'
import * as tauri from '@/services/tauri'
import type {
  ExportNotesPdfMode,
  ExportPngMode,
  ExportTheme,
} from '@/components/interfaces/export/types'

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] ?? ''
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function sanitizeFileName(value: string): string {
  const withoutForbiddenChars = value
    .trim()
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
  const safe = withoutForbiddenChars
    .split('')
    .map((char) => (char.charCodeAt(0) < 32 ? '_' : char))
    .join('')
  return safe || 'export'
}

interface UseExportActionsOptions {
  previewRef: RefObject<HTMLDivElement | null>
  exportPageRefs?: RefObject<Array<HTMLDivElement | null>>
  theme: ExportTheme
  projectName: string
  jsonPayload: Record<string, unknown>
  notesPdfPayload: ExportNotesPdfPayload
}

interface ExportCaptureOptions {
  scale?: number
  backgroundColor?: string | null
  pngMode?: ExportPngMode
}

interface ExportNotesPdfJudgeEntry {
  judgeName: string
  generalNote: string
  categoryNotes: Array<{ category: string; text: string }>
  criterionNotes: Array<{ criterion: string; text: string }>
}

interface ExportNotesPdfClipEntry {
  primary: string
  secondary: string
  generalNote: string
  judges: ExportNotesPdfJudgeEntry[]
}

export interface ExportNotesPdfPayload {
  mode: ExportNotesPdfMode
  title: string
  entries: ExportNotesPdfClipEntry[]
}

async function waitForCaptureReady() {
  if ('fonts' in document) {
    await (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts?.ready
  }
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

export function useExportActions({
  previewRef,
  exportPageRefs,
  theme,
  projectName,
  jsonPayload,
  notesPdfPayload,
}: UseExportActionsOptions) {
  const [exporting, setExporting] = useState(false)

  const exportContainer = useCallback(async (type: 'png' | 'pdf', captureOptions?: ExportCaptureOptions) => {
    if (!previewRef.current || exporting) return
    setExporting(true)

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const effectiveScale = Math.max(1, captureOptions?.scale ?? 2)
      const captureElement = async (element: HTMLDivElement): Promise<HTMLCanvasElement> => {
        await waitForCaptureReady()
        const baseOptions = {
          backgroundColor: captureOptions?.backgroundColor ?? (theme === 'light' ? '#ffffff' : '#0f172a'),
          scale: effectiveScale,
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: Math.max(1, Math.ceil(element.scrollWidth)),
          windowHeight: Math.max(1, Math.ceil(element.scrollHeight)),
          onclone: (clonedDoc: Document) => {
            const style = clonedDoc.createElement('style')
            style.textContent = '*{animation:none !important;transition:none !important;caret-color:transparent !important;}'
            clonedDoc.head.appendChild(style)
          },
        } as const

        try {
          return await html2canvas(element, {
            ...baseOptions,
            foreignObjectRendering: true,
          })
        } catch {
          return await html2canvas(element, baseOptions)
        }
      }

      if (type === 'png') {
        const pngMode = captureOptions?.pngMode ?? 'single'
        let hasWrittenOutput = false

        if (pngMode === 'single' || pngMode === 'both') {
          const pngPath = await save({
            filters: [{ name: 'PNG', extensions: ['png'] }],
            defaultPath: `${projectName}_export.png`,
          })
          if (pngPath) {
            const singleCanvas = await captureElement(previewRef.current)
            await writeBinaryFile(pngPath, dataUrlToBytes(singleCanvas.toDataURL('image/png')))
            hasWrittenOutput = true
          }
        }

        if (pngMode === 'paged' || pngMode === 'both') {
          const pageTargets = (exportPageRefs?.current ?? [])
            .filter((target): target is HTMLDivElement => Boolean(target && target.isConnected))
            .filter((target) => target.dataset.exportPage === 'true')
            .sort((a, b) => {
              const indexA = Number(a.dataset.exportPageIndex ?? '0')
              const indexB = Number(b.dataset.exportPageIndex ?? '0')
              return indexA - indexB
            })
          if (pageTargets.length === 0) {
            if (pngMode === 'paged' && !hasWrittenOutput) {
              alert('Aucune page disponible pour un export PNG paginé.')
            }
          } else {
            const folderPath = await tauri.openFolderDialog()
            if (folderPath) {
              const safeBaseName = sanitizeFileName(projectName)
              const digits = Math.max(2, String(pageTargets.length).length)
              for (let index = 0; index < pageTargets.length; index += 1) {
                const pageCanvas = await captureElement(pageTargets[index])
                const pageName = `${safeBaseName}_export_page_${String(index + 1).padStart(digits, '0')}.png`
                const targetPath = await join(folderPath, pageName)
                await writeBinaryFile(targetPath, dataUrlToBytes(pageCanvas.toDataURL('image/png')))
              }
              hasWrittenOutput = true
            }
          }
        }

        if (!hasWrittenOutput) return
        return
      }

      const pdfPath = await save({
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
        defaultPath: `${projectName}_export.pdf`,
      })
      if (!pdfPath) return

      const canvas = await captureElement(previewRef.current)
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'pt',
        format: 'a4',
      })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      const maxWidth = pageWidth - margin * 2
      const maxHeight = pageHeight - margin * 2
      const ratio = maxWidth / canvas.width
      const scaledFullHeight = canvas.height * ratio

      if (scaledFullHeight <= maxHeight) {
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin, maxWidth, scaledFullHeight)
      } else {
        const sliceHeightPx = Math.max(1, Math.floor(maxHeight / ratio))
        let offsetY = 0
        let pageIndex = 0

        while (offsetY < canvas.height) {
          const currentSliceHeight = Math.min(sliceHeightPx, canvas.height - offsetY)
          const pageCanvas = document.createElement('canvas')
          pageCanvas.width = canvas.width
          pageCanvas.height = currentSliceHeight
          const context = pageCanvas.getContext('2d')
          if (!context) throw new Error('Impossible de préparer une page PDF')

          context.drawImage(
            canvas,
            0,
            offsetY,
            canvas.width,
            currentSliceHeight,
            0,
            0,
            canvas.width,
            currentSliceHeight,
          )

          if (pageIndex > 0) pdf.addPage()

          const renderedHeight = currentSliceHeight * ratio
          pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', margin, margin, maxWidth, renderedHeight)

          offsetY += currentSliceHeight
          pageIndex += 1
        }
      }

      await writeBinaryFile(pdfPath, new Uint8Array(pdf.output('arraybuffer')))
    } catch (error) {
      console.error(`Export ${type.toUpperCase()} failed:`, error)
      alert(`Erreur export ${type.toUpperCase()}: ${error}`)
    } finally {
      setExporting(false)
    }
  }, [exportPageRefs, exporting, previewRef, projectName, theme])

  const exportJson = useCallback(async () => {
    try {
      const jsonPath = await tauri.saveJsonDialog(`${projectName}_export.json`)
      if (!jsonPath) return
      await tauri.exportJsonFile(jsonPayload, jsonPath)
    } catch (error) {
      console.error('Export JSON failed:', error)
      alert(`Erreur export JSON: ${error}`)
    }
  }, [jsonPayload, projectName])

  const exportNotesPdf = useCallback(async () => {
    if (exporting) return
    setExporting(true)

    try {
      const [{ jsPDF }] = await Promise.all([
        import('jspdf'),
      ])

      const pdfPath = await save({
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
        defaultPath: `${projectName}_notes.pdf`,
      })
      if (!pdfPath) return

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 30
      const contentWidth = pageWidth - margin * 2
      const lineHeight = 14
      let y = margin

      const ensureSpace = (height: number) => {
        if (y + height <= pageHeight - margin) return
        pdf.addPage()
        y = margin
      }

      const writeLines = (text: string, fontSize: number, fontStyle: 'normal' | 'bold', indent = 0) => {
        const safe = text.trim().length > 0 ? text : 'Aucune note.'
        pdf.setFont('helvetica', fontStyle)
        pdf.setFontSize(fontSize)
        const lines = pdf.splitTextToSize(safe, Math.max(80, contentWidth - indent))
        for (const line of lines) {
          ensureSpace(lineHeight)
          pdf.text(line, margin + indent, y)
          y += lineHeight
        }
      }

      const getLineCount = (
        text: string,
        fontSize: number,
        indent = 0,
        fontStyle: 'normal' | 'bold' = 'normal',
      ): number => {
        const safe = text.trim().length > 0 ? text : 'Aucune note.'
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
      writeLines(`Notes export - ${notesPdfPayload.title}`, 16, 'bold')
      writeGap(6)
      writeLines(`Mode: ${notesPdfPayload.mode === 'general' ? 'Notes generales' : notesPdfPayload.mode === 'judges' ? 'Notes des juges' : 'Notes generales + notes des juges'}`, 10, 'normal')
      writeGap(8)

      notesPdfPayload.entries.forEach((entry, index) => {
        const titleText = `${index + 1}. ${entry.primary}${entry.secondary ? ` - ${entry.secondary}` : ''}`
        const hasGeneralSection = notesPdfPayload.mode === 'general' || notesPdfPayload.mode === 'both'
        const hasJudgesSection = notesPdfPayload.mode === 'judges' || notesPdfPayload.mode === 'both'

        let minimumEntryHeight = getLineCount(titleText, 12, 0, 'bold') * lineHeight

        if (hasGeneralSection) {
          const generalPreview = entry.generalNote.trim().length > 0 ? entry.generalNote : 'Aucune note.'
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
              : 'Aucune note generale.'
            minimumEntryHeight += 2 + lineHeight
            minimumEntryHeight += Math.min(2, getLineCount(firstJudgePreview, 10, 18, 'normal')) * lineHeight
          }
        }

        ensureSpace(minimumEntryHeight + 6)
        writeLines(titleText, 12, 'bold')

        if (hasGeneralSection) {
          writeGap(2)
          writeLines('Note generale', 10, 'bold', 6)
          writeLines(entry.generalNote, 10, 'normal', 12)
        }

        if (hasJudgesSection) {
          writeGap(4)
          const judgesHeaderReserve = entry.judges.length === 0
            ? lineHeight * 2
            : lineHeight * 3
          ensureSpace(judgesHeaderReserve)
          writeLines('Notes des juges', 10, 'bold', 6)

          if (entry.judges.length === 0) {
            writeLines('Aucune note juge.', 10, 'normal', 12)
          } else {
            entry.judges.forEach((judge) => {
              const judgePreview = judge.generalNote.trim().length > 0 ? judge.generalNote : 'Aucune note generale.'
              const judgeIntroHeight =
                2
                + lineHeight
                + (Math.min(2, getLineCount(judgePreview, 10, 18, 'normal')) * lineHeight)
              ensureSpace(judgeIntroHeight)
              writeGap(2)
              writeLines(judge.judgeName, 10, 'bold', 12)

              if (judge.generalNote.trim().length > 0) {
                writeLines(judge.generalNote, 10, 'normal', 18)
              } else {
                writeLines('Aucune note generale.', 10, 'normal', 18)
              }

              if (judge.categoryNotes.length > 0) {
                const firstCategoryLine = `- ${judge.categoryNotes[0].category}: ${judge.categoryNotes[0].text}`
                const categoryHeaderHeight = lineHeight + (Math.min(2, getLineCount(firstCategoryLine, 9, 24, 'normal')) * lineHeight)
                ensureSpace(categoryHeaderHeight)
                writeLines('Notes categorie:', 9, 'bold', 18)
                judge.categoryNotes.forEach((item) => {
                  writeLines(`- ${item.category}: ${item.text}`, 9, 'normal', 24)
                })
              }

              if (judge.criterionNotes.length > 0) {
                const firstCriterionLine = `- ${judge.criterionNotes[0].criterion}: ${judge.criterionNotes[0].text}`
                const criterionHeaderHeight = lineHeight + (Math.min(2, getLineCount(firstCriterionLine, 9, 24, 'normal')) * lineHeight)
                ensureSpace(criterionHeaderHeight)
                writeLines('Notes sous-categorie:', 9, 'bold', 18)
                judge.criterionNotes.forEach((item) => {
                  writeLines(`- ${item.criterion}: ${item.text}`, 9, 'normal', 24)
                })
              }
            })
          }
        }

        writeGap(10)
      })

      await writeBinaryFile(pdfPath, new Uint8Array(pdf.output('arraybuffer')))
    } catch (error) {
      console.error('Export PDF notes failed:', error)
      alert(`Erreur export PDF notes: ${error}`)
    } finally {
      setExporting(false)
    }
  }, [exporting, notesPdfPayload, projectName])

  return {
    exporting,
    exportContainer,
    exportJson,
    exportNotesPdf,
  }
}
