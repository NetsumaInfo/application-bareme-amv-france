import { Clock3 } from 'lucide-react'
import TimecodeTextarea from '@/components/notes/TimecodeTextarea'
import type { MutableRefObject } from 'react'
import { useI18n } from '@/i18n'

interface NotationNotesFooterProps {
  hidden: boolean
  hasVideo: boolean
  noteText: string
  clipFps: number | null
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
  globalTextareaRef,
  onInsertTimecode,
  onChangeText,
  onFocus,
  onJumpToTimecode,
  onTimecodeHover,
  onTimecodeLeave,
}: NotationNotesFooterProps) {
  const { t } = useI18n()

  if (hidden) {
    return null
  }

  return (
    <div className="border-t border-gray-700 shrink-0 bg-surface">
      <div className="px-3 py-1.5 border-b border-gray-700/60 flex items-center justify-end">
        <button
          type="button"
          onClick={hasVideo ? onInsertTimecode : undefined}
          disabled={!hasVideo}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] border border-primary-500/40 bg-primary-500/10 text-primary-300 hover:bg-primary-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary-500/10 transition-colors"
          title={hasVideo ? t('Insérer le timecode courant') : t('Timecode indisponible (pas de vidéo)')}
        >
          <Clock3 size={12} />
          {t('Timecode')}
        </button>
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
          color="#60a5fa"
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
