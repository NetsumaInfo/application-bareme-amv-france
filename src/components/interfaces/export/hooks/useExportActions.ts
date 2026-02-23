import { useCallback, useState } from 'react'
import type { RefObject } from 'react'
import { save } from '@tauri-apps/api/dialog'
import { writeBinaryFile } from '@tauri-apps/api/fs'
import * as tauri from '@/services/tauri'
import type { ExportTheme } from '@/components/interfaces/export/types'

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] ?? ''
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

interface UseExportActionsOptions {
  previewRef: RefObject<HTMLDivElement | null>
  theme: ExportTheme
  projectName: string
  jsonPayload: Record<string, unknown>
}

export function useExportActions({
  previewRef,
  theme,
  projectName,
  jsonPayload,
}: UseExportActionsOptions) {
  const [exporting, setExporting] = useState(false)

  const exportContainer = useCallback(async (type: 'png' | 'pdf') => {
    if (!previewRef.current || exporting) return
    setExporting(true)

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a',
        scale: 2,
        useCORS: true,
      })

      const dataUrl = canvas.toDataURL('image/png')
      if (type === 'png') {
        const pngPath = await save({
          filters: [{ name: 'PNG', extensions: ['png'] }],
          defaultPath: `${projectName}_export.png`,
        })
        if (!pngPath) return
        await writeBinaryFile(pngPath, dataUrlToBytes(dataUrl))
        return
      }

      const pdfPath = await save({
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
        defaultPath: `${projectName}_export.pdf`,
      })
      if (!pdfPath) return

      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'pt',
        format: 'a4',
      })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const maxWidth = pageWidth - 40
      const maxHeight = pageHeight - 40
      const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height)
      const renderWidth = canvas.width * ratio
      const renderHeight = canvas.height * ratio
      const x = (pageWidth - renderWidth) / 2
      const y = (pageHeight - renderHeight) / 2

      pdf.addImage(dataUrl, 'PNG', x, y, renderWidth, renderHeight)
      await writeBinaryFile(pdfPath, new Uint8Array(pdf.output('arraybuffer')))
    } catch (error) {
      console.error(`Export ${type.toUpperCase()} failed:`, error)
      alert(`Erreur export ${type.toUpperCase()}: ${error}`)
    } finally {
      setExporting(false)
    }
  }, [exporting, previewRef, projectName, theme])

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

  return {
    exporting,
    exportContainer,
    exportJson,
  }
}
