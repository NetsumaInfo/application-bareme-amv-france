import { useCallback, useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { CATEGORY_COLOR_PRESETS, sanitizeColor, withAlpha } from '@/utils/colors'

function CompactCriterion({
  criterion,
  score,
  onValueChange,
  onKeyDown,
  inputRef,
  color,
}: {
  criterion: { id: string; name: string; min?: number; max?: number; step?: number }
  score?: { value: number | string | boolean; isValid: boolean; validationErrors: string[] }
  onValueChange: (value: number | string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  inputRef: (el: HTMLInputElement | null) => void
  color: string
}) {
  const value = score?.value ?? ''
  const hasError = score && !score.isValid

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded transition-colors"
      style={{
        backgroundColor: hasError ? withAlpha('#ef4444', 0.12) : withAlpha(color, 0.07),
      }}
    >
      <span className="flex-1 text-xs text-gray-200 truncate" title={criterion.name}>
        {criterion.name}
      </span>
      <input
        ref={inputRef}
        type="number"
        min={criterion.min}
        max={criterion.max}
        step={criterion.step || 0.5}
        value={value === '' ? '' : String(value)}
        onChange={(e) => onValueChange(e.target.value === '' ? '' : Number(e.target.value))}
        onKeyDown={onKeyDown}
        className={`amv-soft-number w-16 px-1.5 py-0.5 text-center text-xs rounded border font-mono focus-visible:outline-none ${
          hasError
            ? 'border-accent bg-accent/10 text-accent-light'
            : 'bg-surface-dark text-white focus:border-primary-500'
        } focus:outline-none`}
        style={!hasError ? { borderColor: withAlpha(color, 0.42) } : undefined}
      />
      <span className="text-xs text-gray-600 w-7 text-right font-mono">{criterion.max ?? '-'}</span>
    </div>
  )
}

export default function NotationInterface() {
  const { currentBareme, updateCriterion, getNoteForClip, getScoreForClip } = useNotationStore()
  const { clips, currentClipIndex, nextClip, previousClip, markClipScored, markDirty } = useProjectStore()
  const { hideFinalScore, toggleFinalScore, hideTextNotes } = useUIStore()
  const currentClip = clips[currentClipIndex]
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map())

  const note = currentClip ? getNoteForClip(currentClip.id) : undefined
  const totalScore = currentClip ? getScoreForClip(currentClip.id) : 0

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

  const flatCriteria = useMemo(
    () => categories.flatMap((group) => group.criteria),
    [categories],
  )

  const handleValueChange = useCallback(
    (criterionId: string, value: number | string) => {
      if (!currentClip) return
      const numValue = value === '' ? '' : Number(value)
      if (typeof numValue === 'number' && isNaN(numValue)) return
      updateCriterion(currentClip.id, criterionId, numValue as number)
      markDirty()

      const store = useNotationStore.getState()
      if (store.isClipComplete(currentClip.id) && !currentClip.scored) {
        markClipScored(currentClip.id)
      }
    },
    [currentClip, updateCriterion, markDirty, markClipScored],
  )

  const moveFocus = useCallback(
    (fromIndex: number, direction: 'up' | 'down') => {
      const targetIndex = direction === 'down' ? fromIndex + 1 : fromIndex - 1
      if (targetIndex < 0 || targetIndex >= flatCriteria.length) return
      const targetId = flatCriteria[targetIndex].id
      const input = inputRefs.current.get(targetId)
      if (input) {
        input.focus()
        input.select()
      }
    },
    [flatCriteria],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        moveFocus(index, 'down')
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        moveFocus(index, 'up')
      }
    },
    [moveFocus],
  )

  if (!currentBareme || !currentClip) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Sélectionnez une vidéo
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-surface-dark">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-surface">
        <button
          onClick={previousClip}
          disabled={currentClipIndex === 0}
          className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center min-w-0 flex-1 px-2">
          <div className="text-xs font-medium text-white truncate">{getClipPrimaryLabel(currentClip)}</div>
          {getClipSecondaryLabel(currentClip) && (
            <div className="text-[10px] text-primary-400 truncate">{getClipSecondaryLabel(currentClip)}</div>
          )}
          <div className="text-[10px] text-gray-500">
            {currentClipIndex + 1} / {clips.length}
          </div>
        </div>
        <button
          onClick={nextClip}
          disabled={currentClipIndex >= clips.length - 1}
          className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-2">
        {categories.map(({ category, criteria, color }) => (
          <div
            key={category}
            className="rounded-md border border-gray-800/80 bg-surface-dark/70 overflow-hidden"
            style={{ borderColor: withAlpha(color, 0.28) }}
          >
            <div
              className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                color,
                backgroundColor: withAlpha(color, 0.14),
                borderBottom: `1px solid ${withAlpha(color, 0.24)}`,
              }}
            >
              {category}
            </div>
            <div className="p-1.5 space-y-1">
              {criteria.map((criterion) => {
                const flatIndex = flatCriteria.findIndex((item) => item.id === criterion.id)
                return (
                  <CompactCriterion
                    key={criterion.id}
                    criterion={criterion}
                    score={note?.scores[criterion.id]}
                    onValueChange={(v) => handleValueChange(criterion.id, v)}
                    onKeyDown={(e) => handleKeyDown(e, flatIndex)}
                    inputRef={(el) => {
                      if (el) inputRefs.current.set(criterion.id, el)
                    }}
                    color={color}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-700 bg-surface">
        <div className="flex items-center justify-between px-3 py-2">
          <button
            onClick={toggleFinalScore}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
            title={hideFinalScore ? 'Afficher le score' : 'Masquer le score'}
          >
            {hideFinalScore ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          {!hideFinalScore && (
            <span className="text-sm font-bold text-white">
              {totalScore}
              <span className="text-xs text-gray-400 font-normal">/{currentBareme.totalPoints}</span>
            </span>
          )}
        </div>

        {!hideTextNotes && (
          <div className="px-3 pb-2">
            <textarea
              placeholder="Notes..."
              value={note?.textNotes ?? ''}
              onChange={(e) => {
                if (currentClip) {
                  useNotationStore.getState().setTextNotes(currentClip.id, e.target.value)
                  markDirty()
                }
              }}
              className="w-full px-2 py-1 text-[11px] bg-surface-dark border border-gray-700 rounded text-gray-300 placeholder-gray-600 focus:border-primary-500 focus:outline-none resize-y min-h-[42px]"
              rows={2}
            />
          </div>
        )}
      </div>
    </div>
  )
}
