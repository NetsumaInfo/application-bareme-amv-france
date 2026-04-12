import { Clock3 } from 'lucide-react'
import TimecodeTextarea from '@/components/notes/TimecodeTextarea'
import type { MutableRefObject } from 'react'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'
import {
  formatShortcutAnnotation,
  getShortcutBinding,
  type ShortcutAction,
} from '@/utils/shortcuts'

interface NotationNotesFooterProps {
  hidden: boolean
  hasVideo: boolean
  noteText: string
  clipFps: number | null
  shortcutBindings: Partial<Record<ShortcutAction, string>>
  globalTextareaRef: MutableRefObject<HTMLTextAreaElement | null>
  onInsertTimecode: () => void
  onChangeText: (nextValue: string) => void
  onFocus: () => void
  onJumpToTimecode: (seconds: number) => void
  onTimecodeHover: (params: { seconds: number; anchorRect: DOMRect }) => void
  onTimecodeLeave: () => void
}

export function NotationNotesFooter({
  hidden,
  hasVideo,
  noteText,
  clipFps,
  shortcutBindings,
  globalTextareaRef,
  onInsertTimecode,
  onChangeText,
  onFocus,
  onJumpToTimecode,
  onTimecodeHover,
  onTimecodeLeave,
}: NotationNotesFooterProps) {
  const { t } = useI18n()
  const insertTimecodeShortcut = getShortcutBinding('insertTimecode', shortcutBindings)
  const insertTimecodeLabel = formatShortcutAnnotation(
    t('Insérer le timecode courant'),
    insertTimecodeShortcut,
    t,
  )

  if (hidden) {
    return null
  }

  return (
    <div className="border-t border-gray-700 shrink-0 bg-surface">
      <div className="px-3 py-1.5 border-b border-gray-700/60 flex items-center justify-end">
        <HoverTextTooltip
          text={
            hasVideo
              ? insertTimecodeLabel
              : t('Timecode indisponible (pas de vidéo)')
          }
        >
          <button
            type="button"
            onClick={hasVideo ? onInsertTimecode : undefined}
            disabled={!hasVideo}
            aria-label={
              hasVideo
                ? insertTimecodeLabel
                : t('Timecode indisponible (pas de vidéo)')
            }
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] border border-primary-500/40 bg-primary-500/10 text-primary-300 hover:bg-primary-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary-500/10 transition-colors"
          >
            <Clock3 size={12} />
            {t('Timecode')}
          </button>
        </HoverTextTooltip>
      </div>

      <div className="px-3 py-2">
        <TimecodeTextarea
          textareaRef={(el) => {
            globalTextareaRef.current = el
          }}
          placeholder={t('Notes générales...')}
          value={noteText}
          onChange={onChangeText}
          onFocus={onFocus}
          textareaClassName="min-h-[36px]"
          color="rgb(var(--color-primary-400))"
          fpsHint={clipFps ?? undefined}
          onTimecodeSelect={(item) => {
            onJumpToTimecode(item.seconds)
          }}
          onTimecodeHover={({ item, anchorRect }) => {
            onTimecodeHover({ seconds: item.seconds, anchorRect })
          }}
          onTimecodeLeave={onTimecodeLeave}
        />
      </div>
    </div>
  )
}
