import { FileImage, FileJson, FileText } from 'lucide-react'

interface ExportActionsProps {
  exporting: boolean
  onExportPng: () => void
  onExportPdf: () => void
  onExportJson: () => void
}

export function ExportActions({
  exporting,
  onExportPng,
  onExportPdf,
  onExportJson,
}: ExportActionsProps) {
  return (
    <div className="mt-4 flex flex-col gap-2">
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
