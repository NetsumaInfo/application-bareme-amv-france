import { FileImage, FileJson, FileText } from 'lucide-react'
import type { ExportNotesPdfMode, ExportPngMode } from '@/components/interfaces/export/types'

interface ExportActionsProps {
  exporting: boolean
  pngExportMode?: ExportPngMode
  rowsPerImage?: number
  notesPdfMode?: ExportNotesPdfMode
  onSetPngExportMode?: (mode: ExportPngMode) => void
  onSetRowsPerImage?: (value: number) => void
  onSetNotesPdfMode?: (mode: ExportNotesPdfMode) => void
  onExportPng: () => void
  onExportPdf: () => void
  onExportNotesPdf?: () => void
  onExportJson: () => void
}

export function ExportActions({
  exporting,
  pngExportMode,
  rowsPerImage,
  notesPdfMode,
  onSetPngExportMode,
  onSetRowsPerImage,
  onSetNotesPdfMode,
  onExportPng,
  onExportPdf,
  onExportNotesPdf,
  onExportJson,
}: ExportActionsProps) {
  return (
    <div className="mt-4 flex flex-col gap-2">
      {pngExportMode && onSetPngExportMode && typeof rowsPerImage === 'number' && onSetRowsPerImage && (
        <div className="rounded border border-gray-700/80 bg-surface-dark/40 p-2.5 space-y-2">
          <div className="text-[11px] font-semibold text-gray-200">Sortie PNG</div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Mode</label>
            <select
              value={pngExportMode}
              onChange={(event) => onSetPngExportMode(event.target.value as ExportPngMode)}
              className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
            >
              <option value="single">Image unique</option>
              <option value="paged">Plusieurs images</option>
              <option value="both">Les deux</option>
            </select>
          </div>
          {(pngExportMode === 'paged' || pngExportMode === 'both') && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Participants par image</label>
              <input
                type="number"
                min={5}
                max={80}
                value={rowsPerImage}
                onChange={(event) => onSetRowsPerImage(Number(event.target.value))}
                className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
              />
            </div>
          )}
        </div>
      )}

      <button
        onClick={onExportPng}
        disabled={exporting}
        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium disabled:opacity-60"
      >
        <FileImage size={14} />
        Export PNG
      </button>
      <button
        onClick={onExportPdf}
        disabled={exporting}
        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-surface-light border border-gray-700 text-gray-300 hover:text-white text-xs"
      >
        <FileText size={14} />
        Export PDF
      </button>
      {notesPdfMode && onSetNotesPdfMode && onExportNotesPdf && (
        <div className="rounded border border-gray-700/80 bg-surface-dark/40 p-2.5 space-y-2">
          <div className="text-[11px] font-semibold text-gray-200">Export notes (PDF)</div>
          <select
            value={notesPdfMode}
            onChange={(event) => onSetNotesPdfMode(event.target.value as ExportNotesPdfMode)}
            className="w-full px-2 py-1.5 rounded border border-gray-700 bg-surface-dark text-xs text-white focus:border-primary-500 focus:outline-none"
          >
            <option value="general">Notes générales</option>
            <option value="judges">Notes des juges</option>
            <option value="both">Générales + juges</option>
          </select>
          <button
            onClick={onExportNotesPdf}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-surface-light border border-gray-700 text-gray-300 hover:text-white text-xs disabled:opacity-60"
          >
            <FileText size={14} />
            Export PDF notes
          </button>
        </div>
      )}
      <button
        onClick={onExportJson}
        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-surface-light border border-gray-700 text-gray-300 hover:text-white text-xs"
      >
        <FileJson size={14} />
        Export JSON
      </button>
    </div>
  )
}
