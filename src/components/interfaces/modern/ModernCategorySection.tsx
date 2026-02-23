import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Criterion } from '@/types/bareme'
import type { Note } from '@/types/notation'
import { withAlpha } from '@/utils/colors'
import { ModernCriterionCard } from '@/components/interfaces/modern/ModernCriterionCard'

interface ModernCategorySectionProps {
  category: string
  criteria: Criterion[]
  note?: Note
  onValueChange: (criterionId: string, value: number) => void
  color: string
  defaultOpen?: boolean
}

export function ModernCategorySection({
  category,
  criteria,
  note,
  onValueChange,
  color,
  defaultOpen = true,
}: ModernCategorySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="rounded-lg border border-gray-800/80 bg-surface-dark/60 overflow-hidden">
      <button
        onClick={() => setIsOpen((value) => !value)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors"
        style={{
          color,
          backgroundColor: withAlpha(color, 0.12),
          borderBottom: `1px solid ${withAlpha(color, 0.2)}`,
        }}
      >
        <span>{category}</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {isOpen ? (
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 p-3">
            {criteria.map((criterion) => (
              <ModernCriterionCard
                key={criterion.id}
                criterion={criterion}
                score={note?.scores[criterion.id]}
                onValueChange={(value) => onValueChange(criterion.id, value)}
                color={color}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
