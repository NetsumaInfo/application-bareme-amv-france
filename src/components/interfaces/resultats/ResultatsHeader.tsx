import { Upload, Users } from 'lucide-react'
import type { ResultatsHeaderProps } from '@/components/interfaces/resultats/types'

export function ResultatsHeader({
  importing,
  judges,
  currentJudgeName,
  importedJudges,
  onImportJudgeJson,
  onOpenMemberContextMenu,
}: ResultatsHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onImportJudgeJson}
        disabled={importing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-60"
      >
        <Upload size={13} />
        {importing ? 'Import...' : 'Importer un JE.json'}
      </button>

      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Users size={13} />
        {judges.length} juge{judges.length > 1 ? 's' : ''}
      </div>

      {currentJudgeName && (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-primary-500/40 bg-primary-600/10 text-primary-300">
          {currentJudgeName} (projet)
        </span>
      )}

      {importedJudges.map((judge, index) => (
        <button
          key={`${judge.judgeName}-${index}`}
          onContextMenu={(event) => {
            event.preventDefault()
            onOpenMemberContextMenu(index, event.clientX, event.clientY)
          }}
          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-gray-700 bg-surface-dark text-gray-300 hover:border-gray-500 transition-colors"
          title="Clic droit pour options"
        >
          {judge.judgeName}
        </button>
      ))}
    </div>
  )
}
