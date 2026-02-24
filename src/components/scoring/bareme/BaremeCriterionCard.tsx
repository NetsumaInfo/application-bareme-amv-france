import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { CATEGORY_COLOR_PRESETS, sanitizeColor, withAlpha } from '@/utils/colors'
import { ColorSwatchPicker } from '@/components/ui/ColorSwatchPicker'
import { COLOR_MEMORY_KEYS } from '@/utils/colorPickerStorage'
import type { Criterion } from '@/types/bareme'

interface BaremeCriterionCardProps {
  criterion: Criterion
  index: number
  totalCriteria: number
  readOnly: boolean
  color: string
  onMoveCriterion: (index: number, direction: 'up' | 'down') => void
  onRemoveCriterion: (index: number) => void
  onUpdateCriterion: (index: number, updates: Partial<Criterion>) => void
  onUpdateCriterionCategory: (index: number, category: string) => void
  onCommitCategoryColor: (category: string) => void
  onSetCategoryColor: (category: string, color: string) => void
}

export function BaremeCriterionCard({
  criterion,
  index,
  totalCriteria,
  readOnly,
  color,
  onMoveCriterion,
  onRemoveCriterion,
  onUpdateCriterion,
  onUpdateCriterionCategory,
  onCommitCategoryColor,
  onSetCategoryColor,
}: BaremeCriterionCardProps) {
  const rawCategory = criterion.category?.trim() || ''

  return (
    <div
      key={criterion.id}
      className="rounded-lg border bg-surface-dark/60 p-3"
      style={{ borderColor: withAlpha(color, 0.35) }}
    >
      {!readOnly && (
        <div className="mb-2 flex items-center justify-end gap-1">
          <button
            onClick={() => onMoveCriterion(index, 'up')}
            disabled={index === 0}
            className="p-1 rounded text-gray-500 hover:text-white hover:bg-surface-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Monter"
          >
            <ArrowUp size={12} />
          </button>
          <button
            onClick={() => onMoveCriterion(index, 'down')}
            disabled={index >= totalCriteria - 1}
            className="p-1 rounded text-gray-500 hover:text-white hover:bg-surface-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Descendre"
          >
            <ArrowDown size={12} />
          </button>
          {totalCriteria > 1 && (
            <button
              onClick={() => onRemoveCriterion(index)}
              className="p-1 rounded text-gray-500 hover:text-accent hover:bg-surface-light transition-colors"
              title="Supprimer ce critère"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
        <div className="md:col-span-3">
          <label className="block text-[10px] text-gray-500 mb-0.5">Catégorie</label>
          <div className="flex items-center gap-2">
            <input
              value={rawCategory}
              onChange={(event) => onUpdateCriterionCategory(index, event.target.value)}
              onBlur={(event) => onCommitCategoryColor(event.target.value)}
              placeholder="Général"
              className="w-full px-2 py-1.5 rounded border text-xs text-white bg-surface focus:outline-none focus:border-primary-500"
              style={{ borderColor: withAlpha(color, 0.45) }}
              disabled={readOnly}
            />
            <ColorSwatchPicker
              value={sanitizeColor(color)}
              onChange={(nextColor) => {
                if (!rawCategory) return
                onSetCategoryColor(rawCategory, nextColor)
              }}
              disabled={readOnly || !rawCategory}
              title={rawCategory ? `Couleur de ${rawCategory}` : 'Saisis une catégorie d’abord'}
              memoryKey={COLOR_MEMORY_KEYS.recentBaremeColors}
            />
          </div>
          {rawCategory && (
            <div className="flex flex-wrap gap-1 mt-1">
              {CATEGORY_COLOR_PRESETS.map((preset) => (
                <button
                  key={`${criterion.id}-${preset}`}
                  type="button"
                  onClick={() => {
                    const categoryKey = rawCategory.trim()
                    if (!categoryKey) return
                    onSetCategoryColor(categoryKey, preset)
                  }}
                  disabled={readOnly}
                  className={`w-4 h-4 rounded border transition-opacity ${
                    sanitizeColor(color) === sanitizeColor(preset)
                      ? 'border-white'
                      : 'border-gray-700'
                  }`}
                  style={{ backgroundColor: preset }}
                  title={`Appliquer ${preset}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-4">
          <label className="block text-[10px] text-gray-500 mb-0.5">Nom du critère</label>
          <input
            value={criterion.name}
            onChange={(event) => onUpdateCriterion(index, { name: event.target.value })}
            placeholder="Rythme / Synchro"
            className="w-full px-2 py-1.5 bg-surface border border-gray-700 rounded text-xs text-white focus:border-primary-500 focus:outline-none"
            disabled={readOnly}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-[10px] text-gray-500 mb-0.5">Noté sur</label>
          <input
            type="number"
            value={criterion.max ?? 10}
            onChange={(event) => onUpdateCriterion(index, { max: Number(event.target.value) })}
            min={1}
            step={1}
            className="w-full px-2 py-1.5 bg-surface border border-gray-700 rounded text-xs text-white text-center focus:border-primary-500 focus:outline-none"
            disabled={readOnly}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-[10px] text-gray-500 mb-0.5">Pas</label>
          <input
            type="number"
            value={criterion.step ?? 0.5}
            onChange={(event) => onUpdateCriterion(index, { step: Number(event.target.value) })}
            step={0.1}
            className="w-full px-2 py-1.5 bg-surface border border-gray-700 rounded text-xs text-white text-center focus:border-primary-500 focus:outline-none"
            disabled={readOnly}
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-[10px] text-gray-500 mb-0.5">Options</label>
          <div className="h-[34px] px-2 py-1.5 bg-surface border border-gray-700 rounded flex items-center justify-center">
            <label className="inline-flex items-center gap-1 text-[11px] text-gray-300">
              <input
                type="checkbox"
                checked={criterion.required}
                onChange={(event) => onUpdateCriterion(index, { required: event.target.checked })}
                disabled={readOnly}
                className="accent-primary-500"
              />
              Requis
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 mt-2">
        <div>
          <label className="block text-[10px] text-gray-500 mb-0.5">Description</label>
          <input
            value={criterion.description || ''}
            onChange={(event) => onUpdateCriterion(index, { description: event.target.value })}
            placeholder="Optionnel"
            className="w-full px-2 py-1.5 bg-surface border border-gray-700 rounded text-xs text-white focus:border-primary-500 focus:outline-none"
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  )
}
