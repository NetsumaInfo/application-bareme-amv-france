import { getTotalPoints } from '@/components/scoring/baremeEditorUtils'
import type { Criterion } from '@/types/bareme'

interface BaremeEditHeaderFieldsProps {
  readOnly: boolean
  name: string
  description: string
  criteria: Criterion[]
  hideTotalsUntilAllScored: boolean
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onHideTotalsChange: (value: boolean) => void
}

export function BaremeEditHeaderFields({
  readOnly,
  name,
  description,
  criteria,
  hideTotalsUntilAllScored,
  onNameChange,
  onDescriptionChange,
  onHideTotalsChange,
}: BaremeEditHeaderFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-gray-400 mb-1">Nom du barème</label>
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="ex: Finale 2026"
            className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none text-sm"
            disabled={readOnly}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Total calculé</label>
          <div className="px-3 py-2 rounded-lg border border-gray-700 bg-surface-dark text-sm font-semibold text-white">
            {getTotalPoints(criteria)} points
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Description (optionnel)</label>
        <input
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="ex: Barème phase finale"
          className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none text-sm"
          disabled={readOnly}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-700 bg-surface-dark/50 px-3 py-2">
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input
            type="checkbox"
            checked={hideTotalsUntilAllScored}
            onChange={(event) => onHideTotalsChange(event.target.checked)}
            disabled={readOnly}
            className="accent-primary-500"
          />
          Cacher totaux et résultats tant que tous les clips ne sont pas notés
        </label>
      </div>
    </>
  )
}
