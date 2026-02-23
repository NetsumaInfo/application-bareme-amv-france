import { Table2 } from 'lucide-react'

interface SpreadsheetToolbarProps {
  onAddManualRow: () => void
  showAddManualRowButton: boolean
}

export function SpreadsheetToolbar({
  onAddManualRow,
  showAddManualRowButton,
}: SpreadsheetToolbarProps) {
  if (!showAddManualRowButton) return null

  const buttonClassName = 'flex items-center gap-1.5 px-2 py-1 rounded border border-gray-700 text-gray-200 hover:text-white hover:border-primary-500 hover:bg-surface-light text-[11px] transition-colors'

  return (
    <div className="px-2 py-1.5 border-b border-gray-700 bg-surface-dark/70 flex items-center gap-2 shrink-0">
      <button
        onClick={onAddManualRow}
        className={buttonClassName}
        title="Ajouter une ligne sans vidéo"
      >
        <Table2 size={12} />
        Ajouter une ligne
      </button>
    </div>
  )
}
