import { useEffect } from 'react'
import { extractTimecodesFromText, type ParsedTimecode } from '@/utils/timecodes'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'

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
  className = 'text-[11px] text-gray-200 leading-snug whitespace-pre-wrap wrap-break-word',
  emptyLabel,
  fpsHint,
  onTimecodeSelect,
  onTimecodeHover,
  onTimecodeLeave,
}: TimecodeInlineTextProps) {
  const { t } = useI18n()
  const resolvedEmptyLabel = emptyLabel ?? t('Aucune note')
  const value = text.trim()
  const items = extractTimecodesFromText(value, undefined, fpsHint)

  useEffect(() => {
    if (!value || items.length > 0) return
    onTimecodeLeave?.()
  }, [items.length, onTimecodeLeave, value])

  useEffect(() => () => {
    onTimecodeLeave?.()
  }, [onTimecodeLeave])

  if (!value) {
    return <div className="text-[11px] text-gray-500">{resolvedEmptyLabel}</div>
  }

  if (items.length === 0) {
    return <div className={className}>{value}</div>
  }

  const segments: Array<
    | { type: 'text'; value: string; start: number }
    | { type: 'time'; item: ParsedTimecode }
  > = []
  let cursor = 0
  for (const item of items) {
    const start = item.index
    const end = item.index + item.raw.length
    if (start > cursor) segments.push({ type: 'text', value: value.slice(cursor, start), start: cursor })
    segments.push({ type: 'time', item })
    cursor = end
  }
  if (cursor < value.length) segments.push({ type: 'text', value: value.slice(cursor), start: cursor })

  return (
    <div className={className}>
      {segments.map((segment) => {
        if (segment.type === 'text') {
          return <span key={`txt-${segment.start}`}>{segment.value}</span>
        }
        return (
          <HoverTextTooltip
            key={`time-${segment.item.index}-${segment.item.raw}`}
            text={t('Aller à {timecode}', { timecode: segment.item.raw })}
            placement="above"
          >
            <button
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
            >
              {segment.item.raw}
            </button>
          </HoverTextTooltip>
        )
      })}
    </div>
  )
}
