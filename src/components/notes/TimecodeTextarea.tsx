import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { extractTimecodesFromText, type ParsedTimecode } from '@/utils/timecodes'

interface TimecodeTextareaProps {
  value: string
  onChange: (next: string) => void
  onTimecodeSelect: (item: ParsedTimecode) => void
  onTimecodeHover?: (payload: { item: ParsedTimecode; anchorRect: DOMRect }) => void
  onTimecodeLeave?: () => void
  placeholder?: string
  rows?: number
  color?: string
  className?: string
  textareaClassName?: string
  style?: React.CSSProperties
  onFocus?: () => void
  textareaRef?: (el: HTMLTextAreaElement | null) => void
  readOnly?: boolean
}

export default function TimecodeTextarea({
  value,
  onChange,
  onTimecodeSelect,
  onTimecodeHover,
  onTimecodeLeave,
  placeholder,
  rows = 2,
  color = '#60a5fa',
  className = '',
  textareaClassName = '',
  style,
  onFocus,
  textareaRef,
  readOnly = false,
}: TimecodeTextareaProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const innerRef = useRef<HTMLTextAreaElement | null>(null)
  const timecodes = useMemo(() => extractTimecodesFromText(value), [value])

  const setTextareaRef = useCallback((el: HTMLTextAreaElement | null) => {
    innerRef.current = el
    textareaRef?.(el)
  }, [textareaRef])

  const syncTextareaLayout = useCallback(() => {
    const el = innerRef.current
    if (!el) return
    const computed = window.getComputedStyle(el)
    const minHeight = Number.parseFloat(computed.minHeight || '0') || 0
    const maxHeight = 220
    el.style.height = 'auto'
    const targetHeight = Math.max(minHeight, Math.min(el.scrollHeight, maxHeight))
    el.style.height = `${targetHeight}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
    el.style.overflowX = 'hidden'

    if (document.activeElement !== el) {
      el.scrollTop = 0
      el.scrollLeft = 0
    }
    setScrollTop(el.scrollTop)
    setScrollLeft(el.scrollLeft)
  }, [])

  useEffect(() => {
    syncTextareaLayout()
  }, [value, rows, textareaClassName, syncTextareaLayout])

  useEffect(() => {
    window.addEventListener('resize', syncTextareaLayout)
    return () => window.removeEventListener('resize', syncTextareaLayout)
  }, [syncTextareaLayout])

  const segments = useMemo(() => {
    if (!value || timecodes.length === 0) {
      return [{ type: 'text' as const, value }]
    }
    const list: Array<{ type: 'text'; value: string } | { type: 'time'; item: ParsedTimecode }> = []
    let cursor = 0
    for (const item of timecodes) {
      const start = item.index
      const end = item.index + item.raw.length
      if (start > cursor) list.push({ type: 'text', value: value.slice(cursor, start) })
      list.push({ type: 'time', item })
      cursor = end
    }
    if (cursor < value.length) list.push({ type: 'text', value: value.slice(cursor) })
    return list
  }, [value, timecodes])

  return (
    <div className={`relative isolate overflow-hidden rounded ${className}`}>
      <textarea
        ref={setTextareaRef}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        onScroll={(e) => {
          const el = e.currentTarget
          setScrollTop(el.scrollTop)
          setScrollLeft(el.scrollLeft)
        }}
        onFocus={onFocus}
        spellCheck={false}
        rows={rows}
        style={style}
        className={`relative z-[1] w-full px-2 py-1.5 text-[11px] leading-[1.4] bg-surface-dark border border-gray-700 rounded text-transparent caret-gray-200 placeholder:text-gray-600 focus:border-primary-500 focus:outline-none resize-none min-h-[42px] overflow-x-hidden ${textareaClassName}`}
      />
      {value.trim().length > 0 && (
        <div
          className="pointer-events-none absolute inset-px z-[2] overflow-hidden rounded-[6px]"
          aria-hidden="true"
        >
          <div
            className="whitespace-pre-wrap break-words px-2 py-1.5 text-[11px] leading-[1.4] text-gray-300 select-none"
            style={{
              transform: `translate(${-scrollLeft}px, ${-scrollTop}px)`,
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
            }}
          >
            {segments.map((segment, index) => {
              if (segment.type === 'text') {
                return <span key={`text-${index}`}>{segment.value}</span>
              }
              return (
                <button
                  key={`time-${segment.item.index}-${segment.item.raw}-${index}`}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault()
                  }}
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
                  className="pointer-events-auto inline m-0 p-0 bg-transparent border-0 underline underline-offset-2 decoration-dotted decoration-1 align-baseline leading-[1.4] hover:brightness-110 transition-colors"
                  style={{
                    color,
                    font: 'inherit',
                    lineHeight: 'inherit',
                    letterSpacing: 'inherit',
                  }}
                  title={`Aller à ${segment.item.raw}`}
                >
                  {segment.item.raw}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
