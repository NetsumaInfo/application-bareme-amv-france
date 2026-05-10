import type { ResultatsContestCategoryOption } from '@/components/interfaces/resultats/types'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'

interface ResultatsContestCategoryFilterProps {
  options: ResultatsContestCategoryOption[]
  selectedKey: string
  onSelect: (key: string) => void
}

export function ResultatsContestCategoryFilter({
  options,
  selectedKey,
  onSelect,
}: ResultatsContestCategoryFilterProps) {
  if (options.length <= 1) return null

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-700/40 py-1">
      {options.map((option) => {
        const active = option.key === selectedKey
        return (
          <HoverTextTooltip key={`contest-category-${option.key}`} text={option.label} className="inline-flex">
            <button
              type="button"
              onClick={() => onSelect(option.key)}
              className={`inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[11px] transition-colors ${
                active
                  ? 'border-primary-500/45 bg-surface-dark/90 text-white'
                  : 'border-gray-700/70 bg-transparent text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
              aria-pressed={active}
            >
              <span className="max-w-[180px] truncate">{option.label}</span>
              <span className={`rounded-sm px-1 py-[1px] text-[10px] ${active ? 'bg-primary-500/20 text-primary-100' : 'bg-surface-dark/70 text-gray-400'}`}>
                {option.count}
              </span>
            </button>
          </HoverTextTooltip>
        )
      })}
    </div>
  )
}
