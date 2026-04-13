import { useEffect, useRef } from 'react'
import TimecodeTextarea from '@/components/notes/TimecodeTextarea'
import { insertTextAtCursor } from '@/components/notes/insertTextAtCursor'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import type { Clip } from '@/types/project'
import { useI18n } from '@/i18n'
import { formatPreciseTimecode } from '@/utils/formatters'
import { normalizeShortcutFromEvent, type ShortcutAction } from '@/utils/shortcuts'
import { snapToFrameSeconds } from '@/utils/timecodes'
import * as tauri from '@/services/tauri'

interface ResultatsNotesPanelProps {
  hidden: boolean
  selectedClip: Clip | undefined
  noteText: string
  selectedClipFps: number | null
  shortcutBindings: Partial<Record<ShortcutAction, string>>
  onChangeText: (clipId: string, text: string) => void
  onJumpToTimecode: (clipId: string, seconds: number) => void
  onTimecodeHover: (params: { seconds: number; anchorRect: DOMRect }) => void
  onTimecodeLeave: () => void
}

export function ResultatsNotesPanel({
  hidden,
  selectedClip,
  noteText,
  selectedClipFps,
  shortcutBindings,
  onChangeText,
  onJumpToTimecode,
  onTimecodeHover,
  onTimecodeLeave,
}: ResultatsNotesPanelProps) {
  const { t } = useI18n()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const shortcut = normalizeShortcutFromEvent(event)
      if (!shortcut || shortcut !== shortcutBindings.insertTimecode) return
      const textarea = textareaRef.current
      if (!textarea || document.activeElement !== textarea) return
      if (!selectedClip) return
      if (!selectedClip.filePath) return

      event.preventDefault()
      event.stopPropagation()

      const insertCurrentTimecode = async () => {
        const status = await tauri.playerGetStatus().catch(() => null)
        if (!status) return
        const preciseSeconds = snapToFrameSeconds(status.current_time, selectedClipFps)
        const timecode = formatPreciseTimecode(preciseSeconds)
        const { nextValue, caret } = insertTextAtCursor(textarea, timecode)
        onChangeText(selectedClip.id, nextValue)
        requestAnimationFrame(() => {
          textarea.focus()
          textarea.setSelectionRange(caret, caret)
        })
      }

      insertCurrentTimecode().catch(() => {})
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [onChangeText, selectedClip, selectedClipFps, shortcutBindings])

  if (hidden || !selectedClip) {
    return null
  }

  const secondaryLabel = getClipSecondaryLabel(selectedClip)

  return (
    <div className="shrink-0 border-t border-gray-700 bg-surface px-3 py-2">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-gray-500">{t('Note générale')}</span>
        <span className="text-[10px] text-gray-600">—</span>
        <span className="min-w-0 text-[10px] text-gray-400">
          <span className="text-primary-400">{getClipPrimaryLabel(selectedClip)}</span>
          {secondaryLabel ? (
            <span className="ml-1 text-gray-500">- {secondaryLabel}</span>
          ) : null}
        </span>
      </div>
      <TimecodeTextarea
        textareaRef={(el) => {
          textareaRef.current = el
        }}
        value={noteText}
        onChange={(nextValue) => {
          onChangeText(selectedClip.id, nextValue)
        }}
        onTimecodeSelect={(item) => {
          onJumpToTimecode(selectedClip.id, item.seconds)
        }}
        onTimecodeHover={({ item, anchorRect }) => {
          onTimecodeHover({ seconds: item.seconds, anchorRect })
        }}
        onTimecodeLeave={onTimecodeLeave}
        color="#60a5fa"
        fpsHint={selectedClipFps ?? undefined}
        rows={2}
        textareaClassName="text-xs min-h-[40px]"
        placeholder={t('Notes générales...')}
      />
    </div>
  )
}
