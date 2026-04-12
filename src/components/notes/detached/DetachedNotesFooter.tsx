import { Clock3 } from 'lucide-react'
import type { MutableRefObject } from 'react'
import TimecodeTextarea from '@/components/notes/TimecodeTextarea'
import type { ActiveNoteField } from '@/components/notes/detached/types'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'
import {
  formatShortcutAnnotation,
  getShortcutBinding,
  type ShortcutAction,
} from '@/utils/shortcuts'

interface DetachedNotesFooterProps {
  globalTextareaRef: MutableRefObject<HTMLTextAreaElement | null>
  activeNoteFieldRef: MutableRefObject<ActiveNoteField | null>
  globalNotes: string
  hasVideo: boolean
  clipFps: number | null
  shortcutBindings: Partial<Record<ShortcutAction, string>>
  onInsertTimecode: () => void
  onTextChange: (value: string) => void
  onTimecodeJump: (seconds: number, payload?: { category?: string; criterionId?: string }) => void
  onTimecodeHover: (payload: { seconds: number; anchorRect: DOMRect }) => void | Promise<void>
  onTimecodeLeave: () => void
}

export function DetachedNotesFooter({
  globalTextareaRef,
  activeNoteFieldRef,
  globalNotes,
  hasVideo,
  clipFps,
  shortcutBindings,
  onInsertTimecode,
  onTextChange,
  onTimecodeJump,
  onTimecodeHover,
  onTimecodeLeave,
}: DetachedNotesFooterProps) {
  const { t } = useI18n()
  const insertTimecodeShortcut = getShortcutBinding('insertTimecode', shortcutBindings)
  const insertTimecodeLabel = formatShortcutAnnotation(
    t('Insérer le timecode courant'),
    insertTimecodeShortcut,
    t,
  )

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
          value={globalNotes}
          onChange={onTextChange}
          onFocus={() => {
            activeNoteFieldRef.current = { kind: 'global' }
          }}
          textareaClassName="min-h-[36px]"
          color="#60a5fa"
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
    </div>
  )
}
