import { AlertCircle } from 'lucide-react'
import type { Criterion } from '@/types/bareme'
import type { CriterionScore } from '@/types/notation'
import { withAlpha } from '@/utils/colors'
import { ScoreRing } from '@/components/interfaces/modern/ScoreRing'

interface ModernCriterionCardProps {
  criterion: Criterion
  score?: CriterionScore
  onValueChange: (value: number) => void
  color: string
}

export function ModernCriterionCard({
  criterion,
  score,
  onValueChange,
  color,
}: ModernCriterionCardProps) {
  const value = typeof score?.value === 'number' ? score.value : 0
  const hasError = Boolean(score && !score.isValid)
  const min = criterion.min ?? 0
  const max = criterion.max ?? 10
  const step = criterion.step ?? 0.5

  return (
    <div
      className="rounded-xl border p-4 transition-colors duration-150"
      style={{
        borderColor: hasError
          ? withAlpha('#ef4444', 0.5)
          : withAlpha(color, score?.value !== undefined && score.value !== '' ? 0.45 : 0.25),
        backgroundColor: hasError
          ? withAlpha('#ef4444', 0.08)
          : withAlpha(color, score?.value !== undefined && score.value !== '' ? 0.09 : 0.05),
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white">{criterion.name}</h4>
          {criterion.description && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{criterion.description}</p>
          )}
        </div>
        <ScoreRing value={value} max={max} />
      </div>

      <div className="space-y-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onValueChange(Number(event.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{ accentColor: color }}
        />
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{min}</span>
          <span className="text-white font-mono font-bold text-sm">{value}</span>
          <span>{max}</span>
        </div>
      </div>

      {hasError && score?.validationErrors?.length ? (
        <div className="flex items-center gap-1 mt-2 text-xs text-accent">
          <AlertCircle size={12} />
          {score.validationErrors[0]}
        </div>
      ) : null}
    </div>
  )
}
