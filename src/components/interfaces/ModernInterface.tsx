import { useCallback, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { CATEGORY_COLOR_PRESETS, sanitizeColor, withAlpha } from '@/utils/colors'

function ScoreRing({ value, max, size = 48 }: { value: number; max: number; size?: number }) {
  const percentage = max > 0 ? (value / max) * 100 : 0
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  const color =
    percentage >= 75 ? 'text-green-400' : percentage >= 50 ? 'text-yellow-400' : percentage > 0 ? 'text-accent' : 'text-gray-600'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth="3" fill="none" className="text-gray-700" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-150`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white">{value || '-'}</span>
      </div>
    </div>
  )
}

function CriterionCard({
  criterion,
  score,
  onValueChange,
  color,
}: {
  criterion: { id: string; name: string; description?: string; min?: number; max?: number; step?: number }
  score?: { value: number | string | boolean; isValid: boolean; validationErrors: string[] }
  onValueChange: (value: number) => void
  color: string
}) {
  const value = typeof score?.value === 'number' ? score.value : 0
  const hasError = score && !score.isValid
  const min = criterion.min ?? 0
  const max = criterion.max ?? 10
  const step = criterion.step ?? 0.5

  return (
    <div
      className="rounded-xl border p-4 transition-colors duration-150"
      style={{
        borderColor: hasError ? withAlpha('#ef4444', 0.5) : withAlpha(color, score?.value !== undefined && score.value !== '' ? 0.45 : 0.25),
        backgroundColor: hasError ? withAlpha('#ef4444', 0.08) : withAlpha(color, score?.value !== undefined && score.value !== '' ? 0.09 : 0.05),
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white">{criterion.name}</h4>
          {criterion.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{criterion.description}</p>}
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
          onChange={(e) => onValueChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{ accentColor: color }}
        />
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{min}</span>
          <span className="text-white font-mono font-bold text-sm">{value}</span>
          <span>{max}</span>
        </div>
      </div>

      {hasError && score.validationErrors.length > 0 && (
        <div className="flex items-center gap-1 mt-2 text-xs text-accent">
          <AlertCircle size={12} />
          {score.validationErrors[0]}
        </div>
      )}
    </div>
  )
}

function CategorySection({
  category,
  criteria,
  note,
  onValueChange,
  color,
  defaultOpen = true,
}: {
  category: string
  criteria: { id: string; name: string; description?: string; min?: number; max?: number; step?: number }[]
  note?: ReturnType<ReturnType<typeof useNotationStore.getState>['getNoteForClip']>
  onValueChange: (criterionId: string, value: number) => void
  color: string
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="rounded-lg border border-gray-800/80 bg-surface-dark/60 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
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
      {isOpen && (
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 p-3">
            {criteria.map((criterion) => (
              <CriterionCard
                key={criterion.id}
                criterion={criterion}
                score={note?.scores[criterion.id]}
                onValueChange={(v) => onValueChange(criterion.id, v)}
                color={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ModernInterface() {
  const { currentBareme, updateCriterion, getNoteForClip, getScoreForClip } = useNotationStore()
  const { clips, currentClipIndex, currentProject, markDirty } = useProjectStore()
  const { hideFinalScore, hideTextNotes } = useUIStore()
  const currentClip = clips[currentClipIndex]
  const allClipsScored = clips.length > 0 && clips.every((clip) => clip.scored)
  const hideTotalsUntilAllScored = Boolean(currentProject?.settings.hideFinalScoreUntilEnd) && !allClipsScored
  const hideTotalsSetting = Boolean(currentProject?.settings.hideTotals)
  const shouldHideTotals = hideFinalScore || hideTotalsSetting || hideTotalsUntilAllScored

  const note = currentClip ? getNoteForClip(currentClip.id) : undefined
  const totalScore = currentClip ? getScoreForClip(currentClip.id) : 0

  const handleValueChange = useCallback(
    (criterionId: string, value: number) => {
      if (!currentClip) return
      updateCriterion(currentClip.id, criterionId, value)
      markDirty()
    },
    [currentClip, updateCriterion, markDirty],
  )

  const categories = useMemo(() => {
    if (!currentBareme) return []
    const map = new Map<string, typeof currentBareme.criteria>()
    for (const criterion of currentBareme.criteria) {
      const category = criterion.category || 'Général'
      if (!map.has(category)) map.set(category, [])
      map.get(category)!.push(criterion)
    }
    return Array.from(map.entries()).map(([category, criteria], index) => ({
      category,
      criteria,
      color: sanitizeColor(
        currentBareme.categoryColors?.[category],
        CATEGORY_COLOR_PRESETS[index % CATEGORY_COLOR_PRESETS.length],
      ),
    }))
  }, [currentBareme])

  if (!currentBareme) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Aucun barème sélectionné
      </div>
    )
  }

  if (!currentClip) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Sélectionnez une vidéo pour commencer la notation
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-gray-700 bg-surface/70">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Clip courant</p>
        <p className="text-sm font-semibold text-primary-300 truncate">{getClipPrimaryLabel(currentClip)}</p>
        {getClipSecondaryLabel(currentClip) && (
          <p className="text-[11px] text-gray-500 truncate">{getClipSecondaryLabel(currentClip)}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {categories.map(({ category, criteria, color }) => (
          <CategorySection
            key={category}
            category={category}
            criteria={criteria}
            note={note}
            onValueChange={handleValueChange}
            color={color}
          />
        ))}
      </div>

      <div className="border-t border-gray-700">
        {!shouldHideTotals && (
          <div className="flex items-center justify-between px-4 py-3 bg-surface">
            <span className="text-sm font-medium text-gray-300">Score total</span>
            <div className="flex items-center gap-3">
              <ScoreRing value={totalScore} max={currentBareme.totalPoints} size={40} />
              <span className="text-lg font-bold text-white">
                {totalScore}
                <span className="text-sm text-gray-400 font-normal">/{currentBareme.totalPoints}</span>
              </span>
            </div>
          </div>
        )}

        {!hideTextNotes && (
          <div className="px-4 py-2 border-t border-gray-700">
            <textarea
              placeholder="Notes libres..."
              value={note?.textNotes ?? ''}
              onChange={(e) => {
                if (currentClip) {
                  useNotationStore.getState().setTextNotes(currentClip.id, e.target.value)
                  markDirty()
                }
              }}
              className="w-full px-3 py-2 text-xs bg-surface-dark border border-gray-700 rounded-lg text-gray-300 placeholder-gray-600 focus:border-primary-500 focus:outline-none resize-y min-h-[42px]"
              rows={2}
            />
          </div>
        )}
      </div>
    </div>
  )
}
