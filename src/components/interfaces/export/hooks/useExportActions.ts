import { useCallback, useState } from 'react'
import type { RefObject } from 'react'
import { save } from '@tauri-apps/api/dialog'
import { writeBinaryFile, writeTextFile } from '@tauri-apps/api/fs'
import { join } from '@tauri-apps/api/path'
import * as tauri from '@/services/tauri'
import { useI18n } from '@/i18n'
import { createXlsxWorkbook, type XlsxSheet } from '@/components/interfaces/export/xlsxWorkbook'
import type {
  ExportNotesPdfMode,
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

interface ExportNotesPdfPayload {
  mode: ExportNotesPdfMode
  title: string
  entries: ExportNotesPdfClipEntry[]
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
  jsonPayload,
  jsonDefaultFileName,
  notesPdfPayload,
  spreadsheetSheets,
}: UseExportActionsOptions) {
  const { t } = useI18n()
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
        await waitForCaptureReady(element)
        const captureBackgroundColor = captureOptions?.backgroundColor ?? (theme === 'light' ? '#ffffff' : '#0f172a')
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
        .filter((target): target is HTMLDivElement => Boolean(target && target.isConnected))
        .filter((target) => target.dataset.exportPage === 'true')
        .sort((a, b) => {
          const indexA = Number(a.dataset.exportPageIndex ?? '0')
          const indexB = Number(b.dataset.exportPageIndex ?? '0')
          return indexA - indexB
        })

      const exportStem = captureOptions?.fileNameStem ?? buildExportStem(projectName, 'export')

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
            await writeBinaryFile(pngPath, await canvasToPngBytes(singleCanvas))
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
                await writeBinaryFile(targetPath, await canvasToPngBytes(pageCanvas))
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

      await writeBinaryFile(pdfPath, new Uint8Array(pdf.output('arraybuffer')))
    } catch (error) {
      console.error(`Export ${type.toUpperCase()} failed:`, error)
      alert(`${t('Erreur export')} ${type.toUpperCase()}: ${error}`)
    } finally {
      setExporting(false)
    }
  }, [exportPageRefs, exporting, previewRef, projectName, t, theme])

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
        defaultPath: buildExportFileName(projectName, 'resultats', 'xlsx'),
      })
      if (!spreadsheetPath) return

      await writeBinaryFile(spreadsheetPath, createXlsxWorkbook(spreadsheetSheets))
    } catch (error) {
      console.error('Export Excel failed:', error)
      alert(`${t('Erreur export Excel')}: ${error}`)
    } finally {
      setExporting(false)
    }
  }, [exporting, projectName, spreadsheetSheets, t])

  const exportHtml = useCallback(async () => {
    if (!previewRef.current || exporting) return
    setExporting(true)

    try {
      await waitForCaptureReady(previewRef.current)
      const htmlPath = await save({
        filters: [{ name: 'HTML', extensions: ['html'] }],
        defaultPath: buildExportFileName(projectName, 'resultats', 'html'),
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
  }, [exporting, previewRef, projectName, t, theme])

  const exportNotesPdf = useCallback(async () => {
    if (exporting) return
    setExporting(true)

    try {
      const [{ jsPDF }] = await Promise.all([
        import('jspdf'),
      ])

      const pdfPath = await save({
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
        defaultPath: buildExportFileName(projectName, 'notes', 'pdf'),
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
        const safe = text.trim().length > 0 ? text : t('Aucune note.')
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
      writeLines(`${t('Notes export')} - ${notesPdfPayload.title}`, 16, 'bold')
      writeGap(6)
      writeLines(
        `${t('Mode')}: ${
          notesPdfPayload.mode === 'general'
            ? t('Notes générales')
            : notesPdfPayload.mode === 'judges'
              ? t('Notes des juges')
              : t('Notes générales + notes des juges')
        }`,
        10,
        'normal',
      )
      writeGap(8)

      notesPdfPayload.entries.forEach((entry, index) => {
        const titleText = `${index + 1}. ${entry.primary}${entry.secondary ? ` - ${entry.secondary}` : ''}`
        const hasGeneralSection = notesPdfPayload.mode === 'general' || notesPdfPayload.mode === 'both'
        const hasJudgesSection = notesPdfPayload.mode === 'judges' || notesPdfPayload.mode === 'both'

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
              : t('Aucune note générale.')
            minimumEntryHeight += 2 + lineHeight
            minimumEntryHeight += Math.min(2, getLineCount(firstJudgePreview, 10, 18, 'normal')) * lineHeight
          }
        }

        ensureSpace(minimumEntryHeight + 6)
        writeLines(titleText, 12, 'bold')

        if (hasGeneralSection) {
          writeGap(2)
          writeLines(t('Note générale'), 10, 'bold', 6)
          writeLines(entry.generalNote, 10, 'normal', 12)
        }

        if (hasJudgesSection) {
          writeGap(4)
          const judgesHeaderReserve = entry.judges.length === 0
            ? lineHeight * 2
            : lineHeight * 3
          ensureSpace(judgesHeaderReserve)
          writeLines(t('Notes des juges'), 10, 'bold', 6)

          if (entry.judges.length === 0) {
            writeLines(t('Aucune note juge.'), 10, 'normal', 12)
          } else {
            entry.judges.forEach((judge) => {
              const judgePreview = judge.generalNote.trim().length > 0 ? judge.generalNote : t('Aucune note générale.')
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
                writeLines(t('Aucune note générale.'), 10, 'normal', 18)
              }

              if (judge.categoryNotes.length > 0) {
                const firstCategoryLine = `- ${judge.categoryNotes[0].category}: ${judge.categoryNotes[0].text}`
                const categoryHeaderHeight = lineHeight + (Math.min(2, getLineCount(firstCategoryLine, 9, 24, 'normal')) * lineHeight)
                ensureSpace(categoryHeaderHeight)
                writeLines(`${t('Notes catégorie')}:`, 9, 'bold', 18)
                judge.categoryNotes.forEach((item) => {
                  writeLines(`- ${item.category}: ${item.text}`, 9, 'normal', 24)
                })
              }

              if (judge.criterionNotes.length > 0) {
                const firstCriterionLine = `- ${judge.criterionNotes[0].criterion}: ${judge.criterionNotes[0].text}`
                const criterionHeaderHeight = lineHeight + (Math.min(2, getLineCount(firstCriterionLine, 9, 24, 'normal')) * lineHeight)
                ensureSpace(criterionHeaderHeight)
                writeLines(`${t('Notes sous-catégorie')}:`, 9, 'bold', 18)
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
      alert(`${t('Erreur export PDF notes')}: ${error}`)
    } finally {
      setExporting(false)
    }
  }, [exporting, notesPdfPayload, projectName, t])

  return {
    exporting,
    exportContainer,
    exportJson,
    exportSpreadsheet,
    exportHtml,
    exportNotesPdf,
  }
}
