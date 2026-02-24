import type { RefObject } from 'react'
import { useMemo } from 'react'
import InlineTimecodeText from '@/components/notes/InlineTimecodeText'

interface SpreadsheetSubcategoryBubbleCriterion {
  id: string
  label: string
  comment: string
}

interface SpreadsheetSubcategoryBubbleCategory {
  category: string
  color: string
  categoryComment: string | null
  criteria: SpreadsheetSubcategoryBubbleCriterion[]
}

export interface SpreadsheetSubcategoryBubbleData {
  clipId: string
  clipLabel: string
  clipSubLabel: string | null
  x: number
  y: number
  categories: SpreadsheetSubcategoryBubbleCategory[]
}

interface SpreadsheetSubcategoryBubbleProps {
  bubble: SpreadsheetSubcategoryBubbleData | null
  bubbleRef?: RefObject<HTMLDivElement | null>
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onTimecodeSelect?: (payload: { clipId: string; seconds: number }) => void
  onTimecodeHover?: (payload: { clipId: string; seconds: number; anchorRect: DOMRect }) => void
  onTimecodeLeave?: () => void
}

const BUBBLE_WIDTH = 360
const BUBBLE_MIN_HEIGHT = 260

export function SpreadsheetSubcategoryBubble({
  bubble,
  bubbleRef,
  onMouseEnter,
  onMouseLeave,
  onTimecodeSelect,
  onTimecodeHover,
  onTimecodeLeave,
}: SpreadsheetSubcategoryBubbleProps) {
  const style = useMemo(() => {
    if (!bubble) return undefined
    const maxLeft = Math.max(12, window.innerWidth - BUBBLE_WIDTH - 12)
    const maxTop = Math.max(12, window.innerHeight - BUBBLE_MIN_HEIGHT - 12)
    const left = Math.min(Math.max(12, bubble.x + 14), maxLeft)
    const top = Math.min(Math.max(12, bubble.y + 14), maxTop)
    return { left, top, width: BUBBLE_WIDTH }
  }, [bubble])

  if (!bubble || !style) return null

  return (
    <div
      ref={bubbleRef}
      className="fixed z-[125] pointer-events-auto rounded-xl border border-primary-500/30 bg-surface/95 backdrop-blur-sm shadow-2xl overflow-hidden"
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onWheel={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="px-3 py-2 border-b border-gray-700/70 bg-surface-light/40 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-primary-200">{bubble.clipLabel}</p>
          {bubble.clipSubLabel ? (
            <p className="truncate text-[10px] text-gray-400">{bubble.clipSubLabel}</p>
          ) : null}
        </div>
      </div>

      <div className="max-h-[55vh] overflow-auto px-3 py-2 space-y-2">
        {bubble.categories.map((group) => (
          <div key={group.category} className="rounded-lg border border-gray-700/70 bg-surface-dark/30 overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-2 py-1 border-b border-gray-700/60">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-200 truncate">
                  {group.category}
                </span>
              </div>
              {group.criteria.length === 1 ? (
                <span
                  className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold border shrink-0"
                  style={{
                    color: group.color,
                    borderColor: `${group.color}66`,
                    backgroundColor: `${group.color}22`,
                  }}
                >
                  {group.criteria[0].label}
                </span>
              ) : null}
            </div>

            {group.categoryComment ? (
              <div className="px-2 py-1 border-b border-gray-800/60">
                <p className="text-[10px] text-primary-200 whitespace-pre-wrap break-words">
                  {group.categoryComment}
                </p>
                <InlineTimecodeText
                  text={group.categoryComment}
                  color={group.color}
                  onSelect={(item) => {
                    onTimecodeSelect?.({ clipId: bubble.clipId, seconds: item.seconds })
                  }}
                  onHover={({ item, anchorRect }) => {
                    onTimecodeHover?.({ clipId: bubble.clipId, seconds: item.seconds, anchorRect })
                  }}
                  onLeave={onTimecodeLeave}
                  className="text-[10px]"
                />
              </div>
            ) : null}

            <div className="divide-y divide-gray-800/60">
              {group.criteria.map((criterion) => (
                <div key={criterion.id} className="px-2 py-1">
                  <div className="mb-1">
                    {group.criteria.length > 1 ? (
                    <span
                      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold border"
                      style={{
                        color: group.color,
                        borderColor: `${group.color}66`,
                        backgroundColor: `${group.color}22`,
                      }}
                    >
                      {criterion.label}
                    </span>
                    ) : null}
                  </div>
                  <p className="text-[10px] text-primary-200 whitespace-pre-wrap break-words">
                    {criterion.comment}
                  </p>
                  <InlineTimecodeText
                    text={criterion.comment}
                    color={group.color}
                    onSelect={(item) => {
                      onTimecodeSelect?.({ clipId: bubble.clipId, seconds: item.seconds })
                    }}
                    onHover={({ item, anchorRect }) => {
                      onTimecodeHover?.({ clipId: bubble.clipId, seconds: item.seconds, anchorRect })
                    }}
                    onLeave={onTimecodeLeave}
                    className="text-[10px]"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
