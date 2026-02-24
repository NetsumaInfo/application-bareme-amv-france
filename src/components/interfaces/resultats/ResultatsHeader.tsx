import { useRef } from 'react'
import { Upload, Users } from 'lucide-react'
import type { ResultatsHeaderProps } from '@/components/interfaces/resultats/types'
import { ColorSwatchPicker } from '@/components/ui/ColorSwatchPicker'
import { COLOR_MEMORY_KEYS } from '@/utils/colorPickerStorage'

export function ResultatsHeader({
  importing,
  judges,
  importedJudges,
  selectedJudgeKey,
  judgeColors,
  onImportJudgeJson,
  onSelectJudge,
  onJudgeColorChange,
  onOpenMemberContextMenu,
}: ResultatsHeaderProps) {
  const colorPickerButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const seenNames = new Map<string, number>()
  const getDisplayName = (name: string, isCurrentJudge: boolean) => {
    const normalized = name.trim() || 'Juge'
    const count = seenNames.get(normalized) ?? 0
    seenNames.set(normalized, count + 1)
    if (isCurrentJudge) return `${normalized} (projet)`
    if (count === 0) return normalized
    return `${normalized} (${count + 1})`
  }

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

      {judges.map((judge) => {
        const color = judgeColors[judge.key] ?? '#60a5fa'
        const active = selectedJudgeKey === judge.key
        const displayName = getDisplayName(judge.judgeName, judge.isCurrentJudge)
        const importedIndex = judge.key.startsWith('imported-')
          ? Number(judge.key.replace('imported-', ''))
          : null

        return (
          <div key={judge.key} className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectJudge(judge.key)}
              onContextMenu={(event) => {
                if (importedIndex === null || importedIndex < 0 || importedIndex >= importedJudges.length) return
                event.preventDefault()
                onOpenMemberContextMenu(importedIndex, event.clientX, event.clientY)
              }}
              className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded border transition-colors ${
                active
                  ? 'border-primary-500/60 bg-primary-600/12 text-primary-200'
                  : 'border-gray-700 bg-surface-dark text-gray-300 hover:border-gray-500'
              }`}
              title={importedIndex !== null ? 'Clic droit pour options' : undefined}
            >
              <span
                role="button"
                tabIndex={0}
                className="inline-block w-2 h-2 rounded-full cursor-pointer"
                style={{ backgroundColor: color }}
                title="Couleur du juge (clic: sélecteur, clic droit: favoris)"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  colorPickerButtonRefs.current[judge.key]?.click()
                }}
                onContextMenu={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  const trigger = colorPickerButtonRefs.current[judge.key]
                  if (!trigger) return
                  trigger.dispatchEvent(new MouseEvent('contextmenu', {
                    bubbles: true,
                    cancelable: true,
                    clientX: event.clientX,
                    clientY: event.clientY,
                  }))
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return
                  event.preventDefault()
                  event.stopPropagation()
                  colorPickerButtonRefs.current[judge.key]?.click()
                }}
              />
              {displayName}
            </button>
            <ColorSwatchPicker
              value={color}
              onChange={(next) => onJudgeColorChange(judge.key, next)}
              title={`Couleur de ${displayName}`}
              memoryKey={COLOR_MEMORY_KEYS.recentJudgeColors}
              triggerRef={(node) => { colorPickerButtonRefs.current[judge.key] = node }}
            />
          </div>
        )
      })}
    </div>
  )
}
