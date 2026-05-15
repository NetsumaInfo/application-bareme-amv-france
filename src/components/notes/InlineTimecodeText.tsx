import { useEffect, useMemo } from 'react'
import { extractTimecodesFromText, type ParsedTimecode } from '@/utils/timecodes'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'

interface HoverPayload {
  item: ParsedTimecode
  anchorRect: DOMRect
}

interface InlineTimecodeTextProps {
  text: string
  color?: string
  className?: string
  onSelect: (item: ParsedTimecode) => void
  onHover?: (payload: HoverPayload) => void
  onLeave?: () => void
}

export default function InlineTimecodeText({
  text,
  color = '#60a5fa',
  className = '',
  onSelect,
  onHover,
  onLeave,
}: InlineTimecodeTextProps) {
  const { t } = useI18n()
  const timecodes = useMemo(() => extractTimecodesFromText(text), [text])
  useEffect(() => {
    if (timecodes.length > 0) return
    onLeave?.()
  }, [onLeave, timecodes.length])

  useEffect(() => () => {
    onLeave?.()
  }, [onLeave])

  const hasTimecodes = timecodes.length > 0
  if (!text.trim() || !hasTimecodes) return null

  const segments: Array<
    | { type: 'text'; value: string; start: number }
    | { type: 'time'; item: ParsedTimecode }
  > = []
  let cursor = 0
  for (const item of timecodes) {
    const start = item.index
    const end = item.index + item.raw.length
    if (start > cursor) {
      segments.push({ type: 'text', value: text.slice(cursor, start), start: cursor })
    }
    segments.push({ type: 'time', item })
    cursor = end
  }
  if (cursor < text.length) {
    segments.push({ type: 'text', value: text.slice(cursor), start: cursor })
  }

  return (
    <div
      className={`mt-1 whitespace-pre-wrap wrap-break-word text-[11px] leading-relaxed text-gray-400 ${className}`}
    >
      {segments.map((segment) => {
        if (segment.type === 'text') {
          return <span key={`text-${segment.start}`}>{segment.value}</span>
        }
        return (
          <HoverTextTooltip
            key={`time-${segment.item.index}-${segment.item.raw}`}
            text={t('Aller à {timecode}', { timecode: segment.item.raw })}
            placement="above"
          >
            <button
              type="button"
              onClick={() => onSelect(segment.item)}
              onMouseEnter={(e) => {
                if (!onHover) return
                onHover({
                  item: segment.item,
                  anchorRect: (e.currentTarget as HTMLButtonElement).getBoundingClientRect(),
                })
              }}
              onMouseLeave={() => onLeave?.()}
              className="inline font-mono underline underline-offset-2 decoration-dotted decoration-1 hover:brightness-110 transition-colors"
              style={{ color }}
            >
              {segment.item.raw}
            </button>
          </HoverTextTooltip>
        )
      })}
    </div>
  )
}
