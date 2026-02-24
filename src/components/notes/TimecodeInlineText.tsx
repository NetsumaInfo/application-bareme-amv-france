import { extractTimecodesFromText, type ParsedTimecode } from '@/utils/timecodes'

interface TimecodeInlineTextProps {
  text: string
  color?: string
  className?: string
  emptyLabel?: string
  fpsHint?: number
  onTimecodeSelect: (item: ParsedTimecode) => void
  onTimecodeHover?: (payload: { item: ParsedTimecode; anchorRect: DOMRect }) => void
  onTimecodeLeave?: () => void
}

export function TimecodeInlineText({
  text,
  color = '#60a5fa',
  className = 'text-[11px] text-gray-200 leading-snug whitespace-pre-wrap break-words',
  emptyLabel = 'Aucune note',
  fpsHint,
  onTimecodeSelect,
  onTimecodeHover,
  onTimecodeLeave,
}: TimecodeInlineTextProps) {
  const value = text.trim()
  if (!value) {
    return <div className="text-[11px] text-gray-500">{emptyLabel}</div>
  }

  const items = extractTimecodesFromText(value, undefined, fpsHint)
  if (items.length === 0) {
    return <div className={className}>{value}</div>
  }

  const segments: Array<{ type: 'text'; value: string } | { type: 'time'; item: ParsedTimecode }> = []
  let cursor = 0
  for (const item of items) {
    const start = item.index
    const end = item.index + item.raw.length
    if (start > cursor) segments.push({ type: 'text', value: value.slice(cursor, start) })
    segments.push({ type: 'time', item })
    cursor = end
  }
  if (cursor < value.length) segments.push({ type: 'text', value: value.slice(cursor) })

  return (
    <div className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={`txt-${index}`}>{segment.value}</span>
        }
        return (
          <button
            key={`time-${segment.item.index}-${segment.item.raw}-${index}`}
            type="button"
            className="inline m-0 p-0 bg-transparent border-0 underline underline-offset-2 decoration-dotted decoration-1 hover:brightness-110 transition-colors"
            style={{ color, font: 'inherit', lineHeight: 'inherit' }}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onTimecodeSelect(segment.item)
            }}
            onMouseEnter={(event) => {
              if (!onTimecodeHover) return
              onTimecodeHover({
                item: segment.item,
                anchorRect: (event.currentTarget as HTMLButtonElement).getBoundingClientRect(),
              })
            }}
            onMouseLeave={() => onTimecodeLeave?.()}
            title={`Aller à ${segment.item.raw}`}
          >
            {segment.item.raw}
          </button>
        )
      })}
    </div>
  )
}

