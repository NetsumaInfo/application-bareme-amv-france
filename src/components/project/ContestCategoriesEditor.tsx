import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react'
import { ColorSwatchPicker } from '@/components/ui/ColorSwatchPicker'
import { CATEGORY_COLOR_PRESETS } from '@/utils/colors'
import type { ContestCategoryEditorItem } from '@/utils/contestCategory'
import { useI18n } from '@/i18n'

interface ContestCategoriesEditorProps {
  items: ContestCategoryEditorItem[]
  onChange: (nextItems: ContestCategoryEditorItem[]) => void
}

export function ContestCategoriesEditor({ items, onChange }: ContestCategoriesEditorProps) {
  const { t } = useI18n()
  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length || toIndex === fromIndex) return
    const nextItems = [...items]
    const [moved] = nextItems.splice(fromIndex, 1)
    if (!moved) return
    nextItems.splice(toIndex, 0, moved)
    onChange(nextItems)
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        {items.map((item, index) => (
          <div key={`contest-category-row-${index}-${item.name}`} className="flex items-center gap-2">
            <ColorSwatchPicker
              value={item.color}
              onChange={(nextColor) => {
                const nextItems = [...items]
                nextItems[index] = { ...item, color: nextColor }
                onChange(nextItems)
              }}
              triggerSize="sm"
              triggerVariant="dot"
              title={t('Couleur de {category}', { category: item.name || t('Catégorie') })}
            />
            <input
              type="text"
              defaultValue={item.name}
              placeholder={t('Nom catégorie')}
              onBlur={(event) => {
                const nextItems = [...items]
                nextItems[index] = { ...item, name: event.target.value }
                onChange(nextItems)
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return
                event.preventDefault()
                const target = event.currentTarget
                const nextItems = [...items]
                nextItems[index] = { ...item, name: target.value }
                onChange(nextItems)
                target.blur()
              }}
              className="min-w-0 flex-1 rounded-md border border-gray-700 bg-surface-dark/60 px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
            <button
              type="button"
              onClick={() => moveItem(index, index - 1)}
              disabled={index === 0}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-700 text-gray-400 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={t('Monter {category}', { category: item.name || t('Catégorie') })}
              title={t('Monter {category}', { category: item.name || t('Catégorie') })}
            >
              <ArrowUp size={12} />
            </button>
            <button
              type="button"
              onClick={() => moveItem(index, index + 1)}
              disabled={index === items.length - 1}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-700 text-gray-400 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={t('Descendre {category}', { category: item.name || t('Catégorie') })}
              title={t('Descendre {category}', { category: item.name || t('Catégorie') })}
            >
              <ArrowDown size={12} />
            </button>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, rowIndex) => rowIndex !== index))}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-700 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              aria-label={t('Supprimer catégorie')}
              title={t('Supprimer catégorie')}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          const nextColor = CATEGORY_COLOR_PRESETS[items.length % CATEGORY_COLOR_PRESETS.length]
          const nextLabel = `${t('Catégorie')} ${items.length + 1}`
          onChange([...items, { name: nextLabel, color: nextColor }])
        }}
        className="inline-flex h-7 items-center gap-1 rounded-md border border-gray-700 px-2 text-[11px] text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
      >
        <Plus size={12} />
        {t('Ajouter catégorie')}
      </button>
    </div>
  )
}
