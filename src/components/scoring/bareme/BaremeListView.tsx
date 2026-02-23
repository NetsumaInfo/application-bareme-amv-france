import { Copy, Download, Plus, Trash2, Upload } from 'lucide-react'
import { CATEGORY_COLOR_PRESETS, sanitizeColor, withAlpha } from '@/utils/colors'
import type { Bareme } from '@/types/bareme'

interface BaremeListViewProps {
  availableBaremes: Bareme[]
  onCreate: () => void
  onImportJson: () => void
  onEdit: (bareme: Bareme) => void
  onDuplicate: (bareme: Bareme) => void
  onExportJson: (bareme: Bareme) => void
  onDelete: (baremeId: string) => void
}

export function BaremeListView({
  availableBaremes,
  onCreate,
  onImportJson,
  onEdit,
  onDuplicate,
  onExportJson,
  onDelete,
}: BaremeListViewProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={onCreate}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-primary-500 transition-colors"
        >
          <Plus size={16} />
          <span className="text-sm">Créer un barème</span>
        </button>

        <button
          onClick={onImportJson}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-light text-gray-300 hover:text-white transition-colors"
        >
          <Upload size={14} />
          <span className="text-sm">Importer JSON</span>
        </button>
      </div>

      {availableBaremes.map((bareme) => {
        const categories = Array.from(new Set(bareme.criteria.map((criterion) => criterion.category || 'Général')))
        return (
          <div key={bareme.id} className="rounded-lg border border-gray-700 bg-surface-dark/60 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white truncate">{bareme.name}</span>
                  {bareme.isOfficial && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-600/30 text-primary-300 shrink-0">
                      Officiel
                    </span>
                  )}
                  {bareme.hideTotalsUntilAllScored && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 shrink-0">
                      Totaux cachés
                    </span>
                  )}
                </div>
                {bareme.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{bareme.description}</p>
                )}
                <div className="text-[11px] text-gray-400 mt-1">
                  {bareme.criteria.length} critères • {bareme.totalPoints} points
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {categories.map((category, index) => {
                    const color = sanitizeColor(
                      bareme.categoryColors?.[category],
                      CATEGORY_COLOR_PRESETS[index % CATEGORY_COLOR_PRESETS.length],
                    )
                    return (
                      <span
                        key={`${bareme.id}-${category}`}
                        className="text-[10px] px-2 py-0.5 rounded border"
                        style={{
                          borderColor: withAlpha(color, 0.45),
                          backgroundColor: withAlpha(color, 0.18),
                          color,
                        }}
                      >
                        {category}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(bareme)}
                  className="px-3 py-1 text-xs rounded bg-surface-light text-gray-300 hover:text-white transition-colors"
                >
                  {bareme.isOfficial ? 'Voir' : 'Modifier'}
                </button>
                <button
                  onClick={() => onDuplicate(bareme)}
                  className="p-1 rounded text-gray-400 hover:text-white hover:bg-surface-light transition-colors"
                  title="Dupliquer"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => onExportJson(bareme)}
                  className="p-1 rounded text-gray-400 hover:text-white hover:bg-surface-light transition-colors"
                  title="Exporter JSON"
                >
                  <Download size={14} />
                </button>
                {!bareme.isOfficial && (
                  <button
                    onClick={() => onDelete(bareme.id)}
                    className="p-1 rounded text-gray-500 hover:text-accent hover:bg-surface-light transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
