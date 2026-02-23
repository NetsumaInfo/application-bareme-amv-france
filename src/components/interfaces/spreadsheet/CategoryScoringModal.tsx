import { useEffect, useRef } from 'react'
import { getClipPrimaryLabel } from '@/utils/formatters'
import { withAlpha } from '@/utils/colors'
import type { Note } from '@/types/notation'
import type { Clip } from '@/types/project'
import type { CategoryGroup } from './types'

interface CategoryScoringModalProps {
  group: CategoryGroup | null
  currentClip: Clip | null
  clipNote: Note | undefined
  categoryScore: number
  onChange: (clipId: string, criterionId: string, value: string) => void
  onClose: () => void
}

export function CategoryScoringModal({
  group,
  currentClip,
  clipNote,
  categoryScore,
  onChange,
  onClose,
}: CategoryScoringModalProps) {
  const scoringPanelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!group || !currentClip) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [currentClip, group, onClose])

  if (!group || !currentClip) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        ref={scoringPanelRef}
        className="w-[380px] max-h-[80vh] rounded-xl border shadow-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: '#0f0f23',
          borderColor: withAlpha(group.color, 0.35),
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="px-4 py-3 flex items-center justify-between shrink-0"
          style={{
            backgroundColor: withAlpha(group.color, 0.18),
            borderBottom: `1px solid ${withAlpha(group.color, 0.3)}`,
          }}
        >
          <div>
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: group.color }}>
              {group.category}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[200px]">
              {getClipPrimaryLabel(currentClip)}
              {currentClip.author && <span className="text-gray-500"> — {currentClip.author}</span>}
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold font-mono" style={{ color: categoryScore > 0 ? group.color : '#6b7280' }}>
              {categoryScore}
            </span>
            <span className="text-xs text-gray-500">/{group.totalMax}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {group.criteria.map((criterion) => {
            const score = clipNote?.scores[criterion.id]
            const value = score?.value ?? ''
            const hasError = score && !score.isValid

            return (
              <div
                key={criterion.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                style={{
                  backgroundColor: hasError ? withAlpha('#ef4444', 0.12) : withAlpha(group.color, 0.06),
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-200 truncate" title={criterion.name}>
                    {criterion.name}
                  </div>
                  {criterion.description && (
                    <div className="text-[9px] text-gray-500 truncate">{criterion.description}</div>
                  )}
                </div>
                <input
                  type="number"
                  min={criterion.min}
                  max={criterion.max}
                  step={criterion.step || 0.5}
                  value={value === '' ? '' : String(value)}
                  onChange={(event) => onChange(currentClip.id, criterion.id, event.target.value)}
                  autoFocus={criterion.id === group.criteria[0]?.id}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === 'ArrowDown') {
                      event.preventDefault()
                      const index = group.criteria.findIndex((item) => item.id === criterion.id)
                      const nextCriterion = group.criteria[index + 1]
                      if (nextCriterion) {
                        const input = scoringPanelRef.current?.querySelector(
                          `input[data-crit-id="${nextCriterion.id}"]`,
                        ) as HTMLInputElement | null
                        input?.focus()
                        input?.select()
                      } else {
                        onClose()
                      }
                    } else if (event.key === 'ArrowUp') {
                      event.preventDefault()
                      const index = group.criteria.findIndex((item) => item.id === criterion.id)
                      const prevCriterion = group.criteria[index - 1]
                      if (prevCriterion) {
                        const input = scoringPanelRef.current?.querySelector(
                          `input[data-crit-id="${prevCriterion.id}"]`,
                        ) as HTMLInputElement | null
                        input?.focus()
                        input?.select()
                      }
                    } else if (event.key === 'Escape') {
                      onClose()
                    }
                  }}
                  data-crit-id={criterion.id}
                  className={`amv-soft-number w-20 px-2 py-1.5 text-center text-sm rounded-lg border font-mono focus-visible:outline-none ${hasError
                      ? 'border-accent bg-accent/10 text-accent-light'
                      : 'text-white focus:border-primary-500'
                    } focus:outline-none`}
                  style={!hasError
                    ? {
                      borderColor: withAlpha(group.color, 0.4),
                      backgroundColor: withAlpha(group.color, 0.1),
                    }
                    : undefined}
                />
                <span className="text-[10px] text-gray-500 w-7 text-right font-mono">/{criterion.max ?? 10}</span>
              </div>
            )
          })}
        </div>

        <div
          className="px-3 py-2 border-t border-gray-700 flex items-center justify-between shrink-0"
          style={{ background: '#1a1a2e' }}
        >
          <span className="text-[10px] text-gray-500">Entrée/↓ = suivant · Échap = fermer</span>
          <button
            onClick={onClose}
            className="px-3 py-1 text-[11px] rounded-md bg-surface-light text-gray-300 hover:text-white hover:bg-primary-600 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
