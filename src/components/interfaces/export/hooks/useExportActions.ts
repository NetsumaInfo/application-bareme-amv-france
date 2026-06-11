import { useCallback, useState } from 'react'
import type { RefObject } from 'react'
import { save } from '@tauri-apps/plugin-dialog'
import { writeFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'
import * as tauri from '@/services/tauri'
import { useI18n } from '@/i18n'
import { createXlsxWorkbook, type XlsxSheet } from '@/components/interfaces/export/xlsxWorkbook'
import { createCsvDocument } from '@/components/interfaces/export/csvWorkbook'
import { addTimecodeHoverWidgets } from '@/components/interfaces/export/pdfTimecodeHover'
import {
  fetchTimecodePreviews,
  renderNotesPdfPages,
  type ExportNotesPdfPayload,
} from '@/components/interfaces/export/notesPdfDocument'
import type {
  ExportPngMode,
  ExportTheme,
} from '@/components/interfaces/export/types'

async function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  if (canvas.width <= 0 || canvas.height <= 0) {
    throw new Error('Capture PNG invalide (taille nulle).')
  }

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((createdBlob) => resolve(createdBlob), 'image/png')
  })
  if (!blob) {
    throw new Error('Impossible de générer le PNG.')
  }
  const buffer = await blob.arrayBuffer()
  return new Uint8Array(buffer)
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

function buildExportStem(projectName: string, suffix: string): string {
  const safeProjectName = sanitizeFileName(projectName)
  const safeSuffix = sanitizeFileName(suffix)
  return `${safeProjectName}_${safeSuffix}`
}

function buildExportFileName(projectName: string, suffix: string, extension: string): string {
  return `${buildExportStem(projectName, suffix)}.${extension}`
}

interface UseExportActionsOptions {
  previewRef: RefObject<HTMLDivElement | null>
  exportPageRefs?: RefObject<Array<HTMLDivElement | null>>
  theme: ExportTheme
  projectName: string
  /** Optional user-provided base name; falls back to projectName when blank. */
  fileNameBase?: string
  jsonPayload: Record<string, unknown>
  jsonDefaultFileName: string
  notesPdfPayload: ExportNotesPdfPayload
  spreadsheetSheets: XlsxSheet[]
}

interface ExportCaptureOptions {
  scale?: number
  backgroundColor?: string | null
  pngMode?: ExportPngMode
  fileNameStem?: string
  /** Append the comments as real-text Notes pages (with timecode overlay) after the table image. */
  appendNotesPages?: boolean
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function waitForMiniaturesReady(element: HTMLElement, timeoutMs = 2500) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const loadingMiniature = element.querySelector('[data-miniature-state="loading"]')
    if (!loadingMiniature) return
    await sleep(80)
  }
}

async function waitForImagesReady(element: HTMLElement, timeoutMs = 2500) {
  const images = Array.from(element.querySelectorAll('img'))
  if (images.length === 0) return

  await Promise.race([
    Promise.all(images.map((image) => {
      if (image.complete && image.naturalWidth > 0) return Promise.resolve()
      return new Promise<void>((resolve) => {
        image.addEventListener('load', () => resolve(), { once: true })
        image.addEventListener('error', () => resolve(), { once: true })
      })
    })),
    sleep(timeoutMs),
  ])
}

async function waitForCaptureReady(element?: HTMLElement | null) {
  if ('fonts' in document) {
    await (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts?.ready
  }
  if (element) {
    await waitForMiniaturesReady(element)
    await waitForImagesReady(element)
  }
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function collectInlineStyles(): string {
  const css: string[] = []
  for (const styleSheet of Array.from(document.styleSheets)) {
    try {
      const rules = Array.from(styleSheet.cssRules)
      css.push(rules.map((rule) => rule.cssText).join('\n'))
    } catch {
      const owner = styleSheet.ownerNode
      if (owner instanceof HTMLStyleElement && owner.textContent) {
        css.push(owner.textContent)
      }
    }
  }
  return css.join('\n')
}

function collectRootCssVariables(): string {
  const computed = window.getComputedStyle(document.documentElement)
  const declarations: string[] = []
  for (let index = 0; index < computed.length; index += 1) {
    const name = computed[index]
    if (!name.startsWith('--')) continue
    declarations.push(`${name}:${computed.getPropertyValue(name)};`)
  }
  return declarations.join('')
}

function createStaticExportCss(backgroundColor: string, foregroundColor: string): string {
  return `
    html, body { margin: 0; min-height: 100%; background: ${backgroundColor}; color: ${foregroundColor}; }
    body { padding: 16px; box-sizing: border-box; overflow: auto; }
    [data-export-preview="true"] {
      width: max-content !important;
      max-width: none !important;
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      zoom: 1 !important;
    }
    .amv-export-static-target {
      max-width: none !important;
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      zoom: 1 !important;
    }
    .amv-export-static-target .amv-export-surface {
      width: max-content !important;
      max-width: none !important;
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
    }
    [data-export-preview="true"] *, .amv-export-static-target * {
      animation: none !important;
      transition: none !important;
      caret-color: transparent !important;
    }
    .amv-export-static-target .h-full,
    .amv-export-static-target .min-h-0,
    .amv-export-static-target .flex-1,
    [data-export-preview="true"] .h-full,
    [data-export-preview="true"] .min-h-0,
    [data-export-preview="true"] .flex-1 {
      height: auto !important;
      min-height: 0 !important;
    }
    .amv-export-static-target .overflow-hidden,
    .amv-export-static-target .overflow-auto,
    .amv-export-static-target .overflow-x-auto,
    .amv-export-static-target .overflow-y-hidden,
    [data-export-preview="true"] .overflow-hidden,
    [data-export-preview="true"] .overflow-auto,
    [data-export-preview="true"] .overflow-x-auto,
    [data-export-preview="true"] .overflow-y-hidden {
      overflow: visible !important;
    }
    .amv-export-static-target .sticky,
    [data-export-preview="true"] .sticky {
      position: static !important;
    }
    .amv-export-static-target table,
    [data-export-preview="true"] table {
      width: max-content !important;
      min-width: max-content !important;
      border-collapse: collapse;
      table-layout: auto !important;
    }
    .amv-export-static-target table thead,
    .amv-export-static-target table tbody,
    .amv-export-static-target table tr,
    [data-export-preview="true"] table thead,
    [data-export-preview="true"] table tbody,
    [data-export-preview="true"] table tr {
      min-height: 0 !important;
      overflow: visible !important;
    }
    .amv-export-static-target table th,
    .amv-export-static-target table td,
    [data-export-preview="true"] table th,
    [data-export-preview="true"] table td {
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
    }
    .amv-export-static-target table th,
    [data-export-preview="true"] table th {
      vertical-align: middle !important;
    }
    .amv-export-static-target table td,
    [data-export-preview="true"] table td {
      vertical-align: middle !important;
    }
    .amv-export-static-target table .truncate,
    [data-export-preview="true"] table .truncate {
      max-width: none !important;
      overflow: visible !important;
      text-overflow: clip !important;
      white-space: nowrap !important;
    }
    .amv-export-static-target table td > .flex.flex-col,
    [data-export-preview="true"] table td > .flex.flex-col {
      overflow: visible !important;
    }
    .amv-export-static-target img,
    [data-export-preview="true"] img {
      max-width: 100%;
    }
  `
}

function normalizeExportHtml(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement
  clone.querySelectorAll('input').forEach((input) => {
    input.setAttribute('value', input.value)
  })
  clone.querySelectorAll('textarea').forEach((textarea) => {
    textarea.textContent = textarea.value
  })
  return clone.outerHTML
}

function buildStandaloneHtml(element: HTMLElement, title: string, theme: ExportTheme): string {
  const rootVariables = collectRootCssVariables()
  const styles = collectInlineStyles()
  const backgroundColor = theme === 'light' ? '#f8fafc' : '#060b16'
  const foregroundColor = theme === 'light' ? '#0f172a' : '#f8fafc'
  const exportHtml = normalizeExportHtml(element)
  const staticCss = createStaticExportCss(backgroundColor, foregroundColor)

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>:root{${rootVariables}}</style>
  <style>${styles}</style>
  <style>${staticCss}</style>
</head>
<body>
${exportHtml}
</body>
</html>`
}

export function useExportActions({
  previewRef,
  exportPageRefs,
  theme,
  projectName,
  fileNameBase,
  jsonPayload,
  jsonDefaultFileName,
  notesPdfPayload,
  spreadsheetSheets,
}: UseExportActionsOptions) {
  const { t } = useI18n()
  const [exporting, setExporting] = useState(false)
  const nameBase = fileNameBase?.trim() || projectName

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
        await waitForCaptureReady(element)
        // `null` means the caller explicitly asked for a transparent capture;
        // only `undefined` falls back to the theme background.
        const captureBackgroundColor = captureOptions?.backgroundColor === undefined
          ? (theme === 'light' ? '#ffffff' : '#0f172a')
          : captureOptions.backgroundColor
        const clonedForegroundColor = theme === 'light' ? '#0f172a' : '#f8fafc'

        // Inject the static-export CSS into the main document before cloning so that
        // overflow, height: auto and other corrections are applied when the browser
        // computes scrollHeight / offsetHeight.  We remove the sheet after capture.
        const preInjectStyle = document.createElement('style')
        preInjectStyle.setAttribute('data-amv-export-pre-inject', 'true')
        preInjectStyle.textContent = createStaticExportCss(captureBackgroundColor ?? 'transparent', clonedForegroundColor)
        document.head.appendChild(preInjectStyle)

        // Force a synchronous layout after style injection.
        void element.offsetHeight

        await waitForCaptureReady(element)
        // Use scrollWidth / offsetWidth — these are CSS pixel values and are NOT
        // affected by the app-level CSS zoom (applied on appRootRef).
        // getBoundingClientRect() returns viewport-pixel values which are scaled by
        // the CSS zoom, so if the user is zoomed in/out the measurements would be
        // wrong and the capture canvas would be over- or under-sized, making the
        // table appear shifted in the PNG.
        const captureWidth = Math.max(1, Math.ceil(Math.max(element.scrollWidth, element.offsetWidth)))
        const captureHeight = Math.max(1, Math.ceil(Math.max(element.scrollHeight, element.offsetHeight)))
        const captureTarget = element.cloneNode(true) as HTMLDivElement
        const captureHost = document.createElement('div')
        captureHost.style.position = 'fixed'
        captureHost.style.left = '0'
        captureHost.style.top = '0'
        captureHost.style.width = 'max-content'
        captureHost.style.height = 'auto'
        captureHost.style.overflow = 'visible'
        captureHost.style.pointerEvents = 'none'
        captureHost.style.zIndex = '-1'
        captureHost.style.zoom = '1'
        captureHost.setAttribute('aria-hidden', 'true')
        captureTarget.style.width = 'max-content'
        captureTarget.style.minWidth = `${captureWidth}px`
        captureTarget.style.height = 'auto'
        captureHost.appendChild(captureTarget)
        document.body.appendChild(captureHost)

        await waitForCaptureReady(captureTarget)

        // Re-measure actual rendered dimensions now that captureTarget is in the DOM
        // with the export CSS applied.  Let width: max-content lay out naturally, then
        // read the true rendered size from the element.  Using max-content on the host
        // also avoids overflow: visible scroll-width measurement issues (scrollWidth does
        // not include overflow-visible content beyond the box boundary).
        const effectiveCaptureWidth = Math.max(
          captureWidth,
          captureTarget.scrollWidth,
          captureTarget.offsetWidth,
          // Also measure the widest inner table to handle deep overflow cases.
          ...(Array.from(captureTarget.querySelectorAll('table')).map((t) => (t as HTMLElement).offsetWidth)),
        )
        const effectiveCaptureHeight = Math.max(
          captureHeight,
          captureTarget.scrollHeight,
          captureTarget.offsetHeight,
        )

        // Lock the host and target to exact pixel sizes so html2canvas has a
        // stable viewport with no room for layout shifts or reflow during capture.
        captureHost.style.width = `${effectiveCaptureWidth}px`
        captureHost.style.height = `${effectiveCaptureHeight}px`
        captureTarget.style.width = `${effectiveCaptureWidth}px`
        captureTarget.style.minWidth = `${effectiveCaptureWidth}px`

        // CRITICAL: force the browser to synchronously reflow the element at the
        // newly locked dimensions before reading cell heights.  Without this the
        // browser may still be using the max-content layout and the snapshots
        // below would be stale, causing text misalignment in the exported PNG.
        void captureTarget.offsetHeight
        await waitForCaptureReady(captureTarget)

        // Snapshot the rendered height of each <tr> row before html2canvas clones
        // the element.  html2canvas recalculates heights which can collapse multi-row
        // headers (cells with rowspan).  We restore these heights on the <tr> rows
        // (not on individual th/td cells) because forcing height on cells breaks the
        // native vertical-align: middle behaviour in html2canvas's renderer.
        const rowHeightSnapshots: number[] = []
        captureTarget.querySelectorAll('tr').forEach((row) => {
          rowHeightSnapshots.push((row as HTMLElement).offsetHeight)
        })

        const baseOptions = {
          backgroundColor: captureBackgroundColor,
          scale: effectiveScale,
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          x: 0,
          y: 0,
          width: effectiveCaptureWidth,
          height: effectiveCaptureHeight,
          windowWidth: effectiveCaptureWidth,
          windowHeight: effectiveCaptureHeight,
          onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
            const style = clonedDoc.createElement('style')
            style.textContent = createStaticExportCss(captureBackgroundColor ?? 'transparent', clonedForegroundColor)
            clonedDoc.head.appendChild(style)

            // Pin the cloned root to our measured dimensions so html2canvas
            // does not re-shrink the element to its intrinsic size during its
            // internal reflow pass.
            clonedElement.style.setProperty('width', `${effectiveCaptureWidth}px`, 'important')
            clonedElement.style.setProperty('min-width', `${effectiveCaptureWidth}px`, 'important')

            // Restore <tr> row heights so multi-row headers (rowspan cells) keep
            // their correct vertical size.  We pin rows, not individual cells, to
            // preserve each cell's vertical-align: middle behaviour.
            const clonedRows = Array.from(clonedElement.querySelectorAll('tr'))
            clonedRows.forEach((row, i) => {
              const snapH = rowHeightSnapshots[i]
              if (snapH && snapH > 0) {
                ;(row as HTMLElement).style.setProperty('height', `${snapH}px`, 'important')
                ;(row as HTMLElement).style.setProperty('min-height', `${snapH}px`, 'important')
              }
            })

            // Synchronize live input/textarea values into the clone so html2canvas
            // renders the actual displayed scores rather than the initial attribute values.
            const sourceInputs = Array.from(captureTarget.querySelectorAll('input'))
            const clonedInputs = Array.from(clonedElement.querySelectorAll('input'))
            sourceInputs.forEach((sourceInput, index) => {
              const clonedInput = clonedInputs[index]
              if (clonedInput) clonedInput.setAttribute('value', sourceInput.value)
            })

            const sourceTextareas = Array.from(captureTarget.querySelectorAll('textarea'))
            const clonedTextareas = Array.from(clonedElement.querySelectorAll('textarea'))
            sourceTextareas.forEach((sourceTextarea, index) => {
              const clonedTextarea = clonedTextareas[index]
              if (clonedTextarea) clonedTextarea.textContent = sourceTextarea.value
            })
          },
        } as const

        try {
          return await html2canvas(captureTarget, baseOptions)
        } catch {
          return await html2canvas(captureTarget, {
            ...baseOptions,
            foreignObjectRendering: true,
          })
        } finally {
          captureHost.remove()
          preInjectStyle.remove()
        }
      }

      const getSortedPageTargets = () => (exportPageRefs?.current ?? [])
        .filter((target): target is HTMLDivElement =>
          Boolean(target && target.isConnected) && target?.dataset.exportPage === 'true',
        )
        .sort((a, b) => {
          const indexA = Number(a.dataset.exportPageIndex ?? '0')
          const indexB = Number(b.dataset.exportPageIndex ?? '0')
          return indexA - indexB
        })

      const exportStem = captureOptions?.fileNameStem ?? buildExportStem(nameBase, 'export')

      if (type === 'png') {
        const pngMode = captureOptions?.pngMode ?? 'single'
        let hasWrittenOutput = false

        if (pngMode === 'single' || pngMode === 'both') {
          const pngPath = await save({
            filters: [{ name: 'PNG', extensions: ['png'] }],
            defaultPath: `${exportStem}.png`,
          })
          if (pngPath) {
            const singleCanvas = await captureElement(previewRef.current)
            await writeFile(pngPath, await canvasToPngBytes(singleCanvas))
            hasWrittenOutput = true
          }
        }

        if (pngMode === 'paged' || pngMode === 'both') {
          const pageTargets = getSortedPageTargets()
          if (pageTargets.length === 0) {
            if (pngMode === 'paged' && !hasWrittenOutput) {
              alert(t('Aucune page disponible pour un export PNG paginé.'))
            }
          } else {
            const folderPath = await tauri.openFolderDialog()
            if (folderPath) {
              const digits = Math.max(2, String(pageTargets.length).length)
              for (let index = 0; index < pageTargets.length; index += 1) {
                const pageCanvas = await captureElement(pageTargets[index])
                const pageName = `${exportStem}_page_${String(index + 1).padStart(digits, '0')}.png`
                const targetPath = await join(folderPath, pageName)
                await writeFile(targetPath, await canvasToPngBytes(pageCanvas))
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
        defaultPath: `${exportStem}.pdf`,
      })
      if (!pdfPath) return

      const pageTargets = getSortedPageTargets()
      const pdfCanvases = pageTargets.length > 0
        ? await Promise.all(pageTargets.map((pageTarget) => captureElement(pageTarget)))
        : [await captureElement(previewRef.current)]
      const canvas = pdfCanvases[0]
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
      const addCanvasToPdf = (sourceCanvas: HTMLCanvasElement, sourceIndex: number) => {
        const ratio = maxWidth / sourceCanvas.width
        const scaledFullHeight = sourceCanvas.height * ratio
        if (sourceIndex > 0) pdf.addPage()

        if (scaledFullHeight <= maxHeight) {
          pdf.addImage(sourceCanvas.toDataURL('image/png'), 'PNG', margin, margin, maxWidth, scaledFullHeight)
          return
        }

        const sliceHeightPx = Math.max(1, Math.floor(maxHeight / ratio))
        let offsetY = 0
        let pageIndex = 0

        while (offsetY < sourceCanvas.height) {
          const currentSliceHeight = Math.min(sliceHeightPx, sourceCanvas.height - offsetY)
          const pageCanvas = document.createElement('canvas')
          pageCanvas.width = sourceCanvas.width
          pageCanvas.height = currentSliceHeight
          const context = pageCanvas.getContext('2d')
          if (!context) throw new Error('Impossible de préparer une page PDF')

          context.drawImage(
            sourceCanvas,
            0,
            offsetY,
            sourceCanvas.width,
            currentSliceHeight,
            0,
            0,
            sourceCanvas.width,
            currentSliceHeight,
          )

          if (pageIndex > 0) pdf.addPage()

          const renderedHeight = currentSliceHeight * ratio
          pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', margin, margin, maxWidth, renderedHeight)

          offsetY += currentSliceHeight
          pageIndex += 1
        }
      }

      pdfCanvases.forEach((pdfCanvas, index) => addCanvasToPdf(pdfCanvas, index))

      // Optionally append the comments as real-text Notes pages so timecodes stay
      // selectable and keep their hover-thumbnail overlay (same as the Notes export).
      let notesMarkers: Awaited<ReturnType<typeof renderNotesPdfPages>> = []
      let notesPreviews = new Map<string, string>()
      const hasComments = notesPdfPayload.entries.some(
        (entry) => entry.generalNote.trim().length > 0 || entry.judges.length > 0,
      )
      if (captureOptions?.appendNotesPages && hasComments) {
        notesPreviews = await fetchTimecodePreviews(notesPdfPayload)
        notesMarkers = renderNotesPdfPages(pdf, notesPdfPayload, notesPreviews, t, { startNewPage: true })
      }

      const tableBytes = new Uint8Array(pdf.output('arraybuffer'))
      const finalTableBytes = notesMarkers.length > 0
        ? await addTimecodeHoverWidgets(tableBytes, notesMarkers, notesPreviews)
        : tableBytes
      await writeFile(pdfPath, finalTableBytes)
    } catch (error) {
      console.error(`Export ${type.toUpperCase()} failed:`, error)
      alert(`${t('Erreur export')} ${type.toUpperCase()}: ${error}`)
    } finally {
      setExporting(false)
    }
  }, [exportPageRefs, exporting, previewRef, nameBase, notesPdfPayload, t, theme])

  const exportJson = useCallback(async () => {
    try {
      const jsonPath = await tauri.saveJsonDialog(jsonDefaultFileName)
      if (!jsonPath) return
      await tauri.exportJsonFile(jsonPayload, jsonPath)
    } catch (error) {
      console.error('Export JSON failed:', error)
      alert(`${t('Erreur export JSON')}: ${error}`)
    }
  }, [jsonDefaultFileName, jsonPayload, t])

  const exportSpreadsheet = useCallback(async () => {
    if (exporting) return
    setExporting(true)

    try {
      const spreadsheetPath = await save({
        filters: [{ name: 'Excel', extensions: ['xlsx'] }],
        defaultPath: buildExportFileName(nameBase, 'resultats', 'xlsx'),
      })
      if (!spreadsheetPath) return

      await writeFile(spreadsheetPath, createXlsxWorkbook(spreadsheetSheets))
    } catch (error) {
      console.error('Export Excel failed:', error)
      alert(`${t('Erreur export Excel')}: ${error}`)
    } finally {
      setExporting(false)
    }
  }, [exporting, nameBase, spreadsheetSheets, t])

  const exportCsv = useCallback(async () => {
    if (exporting) return
    setExporting(true)

    try {
      const csvPath = await save({
        filters: [{ name: 'CSV', extensions: ['csv'] }],
        defaultPath: buildExportFileName(nameBase, 'resultats', 'csv'),
      })
      if (!csvPath) return

      await writeTextFile(csvPath, createCsvDocument(spreadsheetSheets))
    } catch (error) {
      console.error('Export CSV failed:', error)
      alert(`${t('Erreur export CSV')}: ${error}`)
    } finally {
      setExporting(false)
    }
  }, [exporting, nameBase, spreadsheetSheets, t])

  const exportHtml = useCallback(async () => {
    if (!previewRef.current || exporting) return
    setExporting(true)

    try {
      await waitForCaptureReady(previewRef.current)
      const htmlPath = await save({
        filters: [{ name: 'HTML', extensions: ['html'] }],
        defaultPath: buildExportFileName(nameBase, 'resultats', 'html'),
      })
      if (!htmlPath) return

      const html = buildStandaloneHtml(previewRef.current, `${projectName} - ${t('Résultats')}`, theme)
      await writeTextFile(htmlPath, html)
    } catch (error) {
      console.error('Export HTML failed:', error)
      alert(`${t('Erreur export HTML/CSS')}: ${error}`)
    } finally {
      setExporting(false)
    }
  }, [exporting, previewRef, nameBase, projectName, t, theme])

  const exportNotesPdf = useCallback(async () => {
    if (exporting) return
    setExporting(true)

    try {
      const [{ jsPDF }] = await Promise.all([
        import('jspdf'),
      ])

      const pdfPath = await save({
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
        defaultPath: buildExportFileName(nameBase, 'notes', 'pdf'),
      })
      if (!pdfPath) return

      const previews = await fetchTimecodePreviews(notesPdfPayload)

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      })

      const markers = renderNotesPdfPages(pdf, notesPdfPayload, previews, t)

      const baseBytes = new Uint8Array(pdf.output('arraybuffer'))
      const finalBytes = notesPdfPayload.includeTimecodeThumbnails && markers.length > 0
        ? await addTimecodeHoverWidgets(baseBytes, markers, previews)
        : baseBytes
      await writeFile(pdfPath, finalBytes)
    } catch (error) {
      console.error('Export PDF notes failed:', error)
      alert(`${t('Erreur export PDF notes')}: ${error}`)
    } finally {
      setExporting(false)
    }
  }, [exporting, notesPdfPayload, nameBase, t])

  return {
    exporting,
    exportContainer,
    exportJson,
    exportSpreadsheet,
    exportCsv,
    exportHtml,
    exportNotesPdf,
  }
}
