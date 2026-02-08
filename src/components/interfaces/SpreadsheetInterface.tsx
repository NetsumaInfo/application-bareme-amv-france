import { useRef, useCallback } from 'react'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'

export default function SpreadsheetInterface() {
  const { currentBareme, updateCriterion, getNoteForClip, getScoreForClip } = useNotationStore()
  const { clips, currentClipIndex, markClipScored, markDirty } = useProjectStore()
  const currentClip = clips[currentClipIndex]
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map())

  const note = currentClip ? getNoteForClip(currentClip.id) : undefined
  const totalScore = currentClip ? getScoreForClip(currentClip.id) : 0

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
      } else if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        moveFocus(index, 'down')
      } else if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault()
        moveFocus(index, 'up')
      }
    },
    [moveFocus],
  )

  const handleChange = useCallback(
    (criterionId: string, value: string) => {
      if (!currentClip) return
      const numValue = value === '' ? '' : Number(value)
      if (typeof numValue === 'number' && isNaN(numValue)) return
      updateCriterion(currentClip.id, criterionId, numValue as number)
      markDirty()
    },
    [currentClip, updateCriterion, markDirty],
  )

  const handleBlur = useCallback(() => {
    if (!currentClip || !currentBareme) return
    // Check if all required fields are filled
    const note = getNoteForClip(currentClip.id)
    if (note) {
      const allFilled = currentBareme.criteria.every((c) => {
        if (!c.required) return true
        const score = note.scores[c.id]
        return score && score.isValid && score.value !== '' && score.value !== undefined
      })
      if (allFilled && !currentClip.scored) {
        markClipScored(currentClip.id)
      }
    }
  }, [currentClip, currentBareme, getNoteForClip, markClipScored])

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

  // Group criteria by category
  const categories = new Map<string, typeof currentBareme.criteria>()
  for (const criterion of currentBareme.criteria) {
    const cat = criterion.category || 'Général'
    if (!categories.has(cat)) categories.set(cat, [])
    categories.get(cat)!.push(criterion)
  }

  let globalIndex = 0

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-surface text-gray-400 text-xs uppercase tracking-wider">
              <th className="text-left px-3 py-2 font-medium">Critère</th>
              <th className="text-center px-2 py-2 font-medium w-16">Poids</th>
              <th className="text-center px-2 py-2 font-medium w-24">Score</th>
              <th className="text-center px-2 py-2 font-medium w-16">Max</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(categories.entries()).map(([category, criteria]) => (
              <>
                <tr key={`cat-${category}`}>
                  <td
                    colSpan={4}
                    className="px-3 py-1.5 text-xs font-semibold text-primary-400 bg-surface-dark/50 uppercase tracking-wider"
                  >
                    {category}
                  </td>
                </tr>
                {criteria.map((criterion) => {
                  const currentIndex = globalIndex++
                  const score = note?.scores[criterion.id]
                  const hasError = score && !score.isValid
                  const value = score?.value ?? ''

                  return (
                    <tr
                      key={criterion.id}
                      className="border-b border-gray-800 hover:bg-surface-light/30 transition-colors"
                    >
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-200">{criterion.name}</div>
                        {criterion.description && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {criterion.description}
                          </div>
                        )}
                      </td>
                      <td className="text-center px-2 py-2 text-gray-400">
                        x{criterion.weight}
                      </td>
                      <td className="text-center px-2 py-2">
                        <input
                          ref={(el) => {
                            if (el) inputRefs.current.set(criterion.id, el)
                          }}
                          type="number"
                          min={criterion.min}
                          max={criterion.max}
                          step={criterion.step || 0.5}
                          value={value === '' ? '' : String(value)}
                          onChange={(e) => handleChange(criterion.id, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, currentIndex)}
                          onBlur={handleBlur}
                          className={`w-20 px-2 py-1 text-center rounded border text-sm font-mono ${
                            hasError
                              ? 'border-accent bg-accent/10 text-accent-light'
                              : 'border-gray-700 bg-surface-dark text-white focus:border-primary-500'
                          } focus:outline-none`}
                        />
                        {hasError && score.validationErrors.length > 0 && (
                          <div className="text-xs text-accent mt-0.5">
                            {score.validationErrors[0]}
                          </div>
                        )}
                      </td>
                      <td className="text-center px-2 py-2 text-gray-500 font-mono">
                        {criterion.max ?? '-'}
                      </td>
                    </tr>
                  )
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with total score */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface border-t border-gray-700">
        <span className="text-sm font-medium text-gray-300">Score total</span>
        <span className="text-lg font-bold text-white">
          {totalScore}
          <span className="text-sm text-gray-400 font-normal">
            /{currentBareme.totalPoints}
          </span>
        </span>
      </div>

      {/* Notes text area */}
      <div className="px-3 py-2 border-t border-gray-700">
        <textarea
          placeholder="Notes libres..."
          value={note?.textNotes ?? ''}
          onChange={(e) => {
            if (currentClip) {
              useNotationStore.getState().setTextNotes(currentClip.id, e.target.value)
              markDirty()
            }
          }}
          className="w-full px-2 py-1.5 text-xs bg-surface-dark border border-gray-700 rounded text-gray-300 placeholder-gray-600 focus:border-primary-500 focus:outline-none resize-none"
          rows={2}
        />
      </div>
    </div>
  )
}
