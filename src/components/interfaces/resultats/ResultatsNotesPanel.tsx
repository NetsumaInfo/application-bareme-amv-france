import { useEffect, useRef } from 'react'
import { Star } from 'lucide-react'
import TimecodeTextarea from '@/components/notes/TimecodeTextarea'
import { insertTextAtCursor } from '@/components/notes/insertTextAtCursor'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import type { Clip } from '@/types/project'
import { useI18n } from '@/i18n'
import { formatPreciseTimecode } from '@/utils/formatters'
import { normalizeShortcutFromEvent, type ShortcutAction } from '@/utils/shortcuts'
import { snapToFrameSeconds } from '@/utils/timecodes'
import * as tauri from '@/services/tauri'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'

export interface FavoriteJudgeEntry {
  judgeKey: string
  judgeName: string
  comment: string
}

interface ResultatsNotesPanelProps {
  hidden: boolean
  selectedClip: Clip | undefined
  noteText: string
  selectedClipFps: number | null
  shortcutBindings: Partial<Record<ShortcutAction, string>>
  favoriteJudges: FavoriteJudgeEntry[]
  judgeColors: Record<string, string>
  favoritesPanelVisible: boolean
  onToggleFavoritesPanel: () => void
  onUpdateFavoriteComment: (clipId: string, judgeKey: string, comment: string) => void
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
  favoriteJudges,
  judgeColors,
  favoritesPanelVisible,
  onToggleFavoritesPanel,
  onUpdateFavoriteComment,
  onChangeText,
  onJumpToTimecode,
  onTimecodeHover,
  onTimecodeLeave,
}: ResultatsNotesPanelProps) {
  const { t } = useI18n()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const hasFavoriteJudges = favoriteJudges.length > 0
  const shouldRenderPanel = (!hidden) || (favoritesPanelVisible && hasFavoriteJudges)

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

  if (!selectedClip || !shouldRenderPanel) {
    return null
  }

  const secondaryLabel = getClipSecondaryLabel(selectedClip)

  return (
    <div className="shrink-0 border-t border-gray-700 bg-surface px-3 py-2">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-gray-500">{t('Note générale')}</span>
        <HoverTextTooltip text={t('Afficher les favoris')}>
          <button
            type="button"
            onClick={hasFavoriteJudges ? onToggleFavoritesPanel : undefined}
            aria-label={t('Afficher les favoris')}
            disabled={!hasFavoriteJudges}
            className={`inline-flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
              favoritesPanelVisible
                ? 'border-amber-300/45 bg-amber-400/14 text-amber-200'
                : 'border-gray-700/70 bg-surface-dark/55 text-gray-400 hover:border-amber-300/35 hover:text-amber-200'
            } disabled:cursor-not-allowed disabled:opacity-35`}
          >
            <Star size={11} fill="currentColor" />
          </button>
        </HoverTextTooltip>
        <span className="text-[10px] text-gray-600">—</span>
        <span className="min-w-0 text-[10px] text-gray-400">
          <span className="text-primary-400">{getClipPrimaryLabel(selectedClip)}</span>
          {secondaryLabel ? (
            <span className="ml-1 text-gray-500">- {secondaryLabel}</span>
          ) : null}
        </span>
      </div>
      {favoritesPanelVisible && hasFavoriteJudges ? (
        <div className="mb-2 rounded-md border border-amber-300/25 bg-amber-400/6 p-2">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
            <Star size={10} fill="currentColor" />
            {t('Favoris')}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {favoriteJudges.map((entry) => {
              const color = judgeColors[entry.judgeKey] ?? '#fbbf24'
              return (
                <div
                  key={`${selectedClip.id}-${entry.judgeKey}`}
                  className="min-w-[140px] max-w-[260px] rounded-md border border-gray-700/55 bg-surface-dark/55 px-2 py-1.5"
                  style={{ boxShadow: `inset 2px 0 0 0 ${color}` }}
                >
                  <div className="mb-0.5 flex items-center gap-1">
                    <Star size={10} fill="currentColor" style={{ color }} />
                    <div className="truncate text-[10px] font-semibold" style={{ color }}>
                      {entry.judgeName}
                    </div>
                  </div>
                  <textarea
                    value={entry.comment}
                    onChange={(event) => {
                      onUpdateFavoriteComment(selectedClip.id, entry.judgeKey, event.target.value)
                    }}
                    placeholder={t('Pourquoi ce clip est un favori ?')}
                    className="mt-0.5 w-full min-h-[48px] resize-y rounded border border-gray-700/70 bg-surface px-1.5 py-1 text-[10px] leading-4 text-gray-200 placeholder:text-gray-500 focus:border-amber-300/45 focus:outline-none"
                  />
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
      {!hidden ? (
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
      ) : null}
    </div>
  )
}
