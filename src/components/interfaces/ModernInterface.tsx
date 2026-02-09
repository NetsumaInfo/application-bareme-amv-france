import { useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'

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
          className={`${color} transition-all duration-300`}
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
}: {
  criterion: { id: string; name: string; description?: string; min?: number; max?: number; step?: number; weight: number }
  score?: { value: number | string | boolean; isValid: boolean; validationErrors: string[] }
  onValueChange: (value: number) => void
}) {
  const value = typeof score?.value === 'number' ? score.value : 0
  const hasError = score && !score.isValid
  const min = criterion.min ?? 0
  const max = criterion.max ?? 10
  const step = criterion.step ?? 0.5

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 transition-colors ${
        hasError ? 'border-accent/50 bg-accent/5' : score?.value !== undefined && score.value !== '' ? 'border-primary-500/30 bg-primary-500/5' : 'border-gray-700 bg-surface'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white">{criterion.name}</h4>
          {criterion.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{criterion.description}</p>}
        </div>
        <ScoreRing value={value} max={max} />
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onValueChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
        />
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{min}</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">x{criterion.weight}</span>
            <span className="text-white font-mono font-bold text-sm">{value}</span>
          </div>
          <span>{max}</span>
        </div>
      </div>

      {hasError && score.validationErrors.length > 0 && (
        <div className="flex items-center gap-1 mt-2 text-xs text-accent">
          <AlertCircle size={12} />
          {score.validationErrors[0]}
        </div>
      )}
    </motion.div>
  )
}

function CategorySection({
  category,
  criteria,
  note,
  onValueChange,
  defaultOpen = true,
}: {
  category: string
  criteria: { id: string; name: string; description?: string; min?: number; max?: number; step?: number; weight: number }[]
  note?: ReturnType<ReturnType<typeof useNotationStore.getState>['getNoteForClip']>
  onValueChange: (criterionId: string, value: number) => void
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold uppercase tracking-wider text-primary-400 hover:text-primary-300 transition-colors"
      >
        <span>{category}</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-3 pb-3">
              {criteria.map((criterion) => (
                <CriterionCard
                  key={criterion.id}
                  criterion={criterion}
                  score={note?.scores[criterion.id]}
                  onValueChange={(v) => onValueChange(criterion.id, v)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ModernInterface() {
  const { currentBareme, updateCriterion, getNoteForClip, getScoreForClip } = useNotationStore()
  const { clips, currentClipIndex, markClipScored, markDirty } = useProjectStore()
  const { hideFinalScore } = useUIStore()
  const currentClip = clips[currentClipIndex]

  const note = currentClip ? getNoteForClip(currentClip.id) : undefined
  const totalScore = currentClip ? getScoreForClip(currentClip.id) : 0

  const handleValueChange = useCallback(
    (criterionId: string, value: number) => {
      if (!currentClip) return
      updateCriterion(currentClip.id, criterionId, value)
      markDirty()

      // Check completion
      const store = useNotationStore.getState()
      if (store.isClipComplete(currentClip.id) && !currentClip.scored) {
        markClipScored(currentClip.id)
      }
    },
    [currentClip, updateCriterion, markDirty, markClipScored],
  )

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

  // Group by category
  const categories = new Map<string, typeof currentBareme.criteria>()
  for (const criterion of currentBareme.criteria) {
    const cat = criterion.category || 'General'
    if (!categories.has(cat)) categories.set(cat, [])
    categories.get(cat)!.push(criterion)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {Array.from(categories.entries()).map(([category, criteria]) => (
          <CategorySection
            key={category}
            category={category}
            criteria={criteria}
            note={note}
            onValueChange={handleValueChange}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700">
        {!hideFinalScore && (
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

        {/* Notes */}
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
            className="w-full px-3 py-2 text-xs bg-surface-dark border border-gray-700 rounded-lg text-gray-300 placeholder-gray-600 focus:border-primary-500 focus:outline-none resize-y min-h-[40px]"
            rows={2}
          />
        </div>
      </div>
    </div>
  )
}
