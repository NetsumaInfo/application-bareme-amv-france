import { useState } from 'react'
import { Star } from 'lucide-react'
import type { MutableRefObject } from 'react'
import TimecodeTextarea from '@/components/notes/TimecodeTextarea'
import type { ActiveNoteField } from '@/components/notes/detached/types'
import { useI18n } from '@/i18n'
import { withAlpha } from '@/utils/colors'

interface DetachedFavoriteCommentProps {
  favoriteComment: string
  favoriteTextareaRef: MutableRefObject<HTMLTextAreaElement | null>
  activeNoteFieldRef: MutableRefObject<ActiveNoteField | null>
  clipFps: number | null
  onFavoriteCommentChange: (value: string) => void
  onTimecodeJump: (seconds: number) => void
  onTimecodeHover: (payload: { seconds: number; anchorRect: DOMRect }) => void | Promise<void>
  onTimecodeLeave: () => void
}

export function DetachedFavoriteComment({
  favoriteComment,
  favoriteTextareaRef,
  activeNoteFieldRef,
  clipFps,
  onFavoriteCommentChange,
  onTimecodeJump,
  onTimecodeHover,
  onTimecodeLeave,
}: DetachedFavoriteCommentProps) {
  const { t } = useI18n()
  const [isExpanded, setIsExpanded] = useState(true)
  const color = '#f59e0b'

  return (
    <div className="border-b border-gray-800/60">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors border-l-[3px] border-b border-white/5 hover:bg-surface-light/85"
        style={{
          borderLeftColor: color,
          backgroundColor: isExpanded
            ? 'rgb(var(--color-surface-light) / 0.92)'
            : 'rgb(var(--color-surface) / 0.82)',
          boxShadow: isExpanded ? `inset 0 1px 0 ${withAlpha(color, 0.08)}` : 'none',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-xs" style={{ backgroundColor: color }}>
            <Star size={8} fill="rgb(10 15 26 / 0.95)" color="rgb(10 15 26 / 0.95)" aria-hidden="true" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
            {t('Commentaire favori')}
          </span>
        </div>

        <span
          className="text-[10px] transition-transform"
          style={{
            color: withAlpha(color, 0.72),
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </button>

      {isExpanded ? (
        <div className="px-2 py-1.5" style={{ backgroundColor: withAlpha(color, 0.04) }}>
          <TimecodeTextarea
            textareaRef={(element) => {
              favoriteTextareaRef.current = element
            }}
            placeholder={t('Pourquoi ce clip est un favori ?')}
            value={favoriteComment}
            onChange={onFavoriteCommentChange}
            onFocus={() => {
              activeNoteFieldRef.current = { kind: 'favorite' }
            }}
            textareaClassName="min-h-[34px]"
            style={{
              backgroundColor: withAlpha(color, 0.05),
              borderColor: withAlpha(color, 0.2),
            }}
            color={color}
            fpsHint={clipFps ?? undefined}
            onTimecodeSelect={(item) => {
              onTimecodeJump(item.seconds)
            }}
            onTimecodeHover={({ item, anchorRect }) => {
              onTimecodeHover({
                seconds: item.seconds,
                anchorRect,
              })
            }}
            onTimecodeLeave={onTimecodeLeave}
          />
        </div>
      ) : null}
    </div>
  )
}
