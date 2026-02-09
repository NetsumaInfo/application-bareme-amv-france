import { useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'

function CompactCriterion({
  criterion,
  score,
  onValueChange,
  onKeyDown,
  inputRef,
}: {
  criterion: { id: string; name: string; min?: number; max?: number; step?: number; weight: number }
  score?: { value: number | string | boolean; isValid: boolean; validationErrors: string[] }
  onValueChange: (value: number | string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  inputRef: (el: HTMLInputElement | null) => void
}) {
  const value = score?.value ?? ''
  const hasError = score && !score.isValid

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
        hasError ? 'bg-accent/10' : ''
      }`}
    >
      <span className="flex-1 text-xs text-gray-300 truncate" title={criterion.name}>
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
        className={`w-14 px-1.5 py-0.5 text-center text-xs rounded border font-mono ${
          hasError
            ? 'border-accent bg-accent/10 text-accent-light'
            : 'border-gray-700 bg-surface-dark text-white focus:border-primary-500'
        } focus:outline-none`}
      />
      <span className="text-xs text-gray-600 w-6 text-right font-mono">{criterion.max ?? '-'}</span>
    </div>
  )
}

export default function NotationInterface() {
  const { currentBareme, updateCriterion, getNoteForClip, getScoreForClip } = useNotationStore()
  const { clips, currentClipIndex, nextClip, previousClip, markClipScored, markDirty } = useProjectStore()
  const { hideFinalScore, toggleFinalScore } = useUIStore()
  const currentClip = clips[currentClipIndex]
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map())

  const note = currentClip ? getNoteForClip(currentClip.id) : undefined
  const totalScore = currentClip ? getScoreForClip(currentClip.id) : 0

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
      if (!currentBareme) return
      const targetIndex = direction === 'down' ? fromIndex + 1 : fromIndex - 1
      if (targetIndex < 0 || targetIndex >= currentBareme.criteria.length) return
      const targetId = currentBareme.criteria[targetIndex].id
      const input = inputRefs.current.get(targetId)
      if (input) {
        input.focus()
        input.select()
      }
    },
    [currentBareme],
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
      {/* Compact header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-surface">
        <button
          onClick={previousClip}
          disabled={currentClipIndex === 0}
          className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center min-w-0 flex-1 px-2">
          <div className="text-xs font-medium text-white truncate">{currentClip.fileName}</div>
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

      {/* Criteria list - compact */}
      <div className="flex-1 overflow-y-auto py-1">
        {currentBareme.criteria.map((criterion, index) => (
          <CompactCriterion
            key={criterion.id}
            criterion={criterion}
            score={note?.scores[criterion.id]}
            onValueChange={(v) => handleValueChange(criterion.id, v)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            inputRef={(el) => {
              if (el) inputRefs.current.set(criterion.id, el)
            }}
          />
        ))}
      </div>

      {/* Score footer */}
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

        {/* Quick notes */}
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
            className="w-full px-2 py-1 text-[11px] bg-surface-dark border border-gray-700 rounded text-gray-300 placeholder-gray-600 focus:border-primary-500 focus:outline-none resize-y min-h-[40px]"
            rows={2}
          />
        </div>
      </div>
    </div>
  )
}
