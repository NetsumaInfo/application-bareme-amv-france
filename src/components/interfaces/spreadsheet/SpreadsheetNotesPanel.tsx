import { emit } from '@tauri-apps/api/event'
import TimecodeTextarea from '@/components/notes/TimecodeTextarea'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import type { MutableRefObject } from 'react'
import type { Clip } from '@/types/project'
import type { CategoryGroup } from './types'

interface TimecodeItemLike {
  seconds: number
}

interface SpreadsheetNotesPanelProps {
  currentClip: Clip
  currentNoteText: string
  categoryGroups: CategoryGroup[]
  clipFps: number | null
  notesTextareaRef: MutableRefObject<HTMLTextAreaElement | null>
  getCategoryScore: (clipId: string, group: CategoryGroup) => number
  onChangeText: (nextValue: string) => void
  onSeekAndPauseToTimecode: (seconds: number) => Promise<void>
  onTimecodeHover: (params: { item: TimecodeItemLike; anchorRect: DOMRect }) => Promise<void>
  onTimecodeLeave: () => void
}

export function SpreadsheetNotesPanel({
  currentClip,
  currentNoteText,
  categoryGroups,
  clipFps,
  notesTextareaRef,
  getCategoryScore,
  onChangeText,
  onSeekAndPauseToTimecode,
  onTimecodeHover,
  onTimecodeLeave,
}: SpreadsheetNotesPanelProps) {
  return (
    <div className="px-3 py-2 border-t border-gray-700 bg-surface shrink-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Notes</span>
        <span className="text-[10px] text-gray-600">—</span>
        <span className="text-[10px] text-gray-400">
          <span className="text-primary-400">{getClipPrimaryLabel(currentClip)}</span>
          {getClipSecondaryLabel(currentClip) && (
            <span className="text-gray-500 ml-1">- {getClipSecondaryLabel(currentClip)}</span>
          )}
        </span>
        <span className="text-[10px] text-gray-600 ml-auto">
          {categoryGroups.map((group) => (
            <span key={group.category} className="ml-2">
              <span style={{ color: group.color }}>{group.category}</span>:{' '}
              <span className="text-gray-400">
                {getCategoryScore(currentClip.id, group)}/{group.totalMax}
              </span>
            </span>
          ))}
        </span>
      </div>
      <TimecodeTextarea
        placeholder="Notes libres pour ce clip..."
        value={currentNoteText}
        onChange={onChangeText}
        rows={2}
        textareaClassName="text-xs min-h-[40px]"
        color="#60a5fa"
        fpsHint={clipFps ?? undefined}
        onTimecodeSelect={async (item) => {
          if (!currentClip.filePath) return
          await onSeekAndPauseToTimecode(item.seconds)
          const detail = {
            clipId: currentClip.id,
            seconds: item.seconds,
            category: null,
            criterionId: null,
          }
          window.dispatchEvent(new CustomEvent('amv:focus-note-marker', { detail }))
          emit('main:focus-note-marker', detail).catch(() => { })
        }}
        onTimecodeHover={({ item, anchorRect }) => {
          onTimecodeHover({ item, anchorRect }).catch(() => { })
        }}
        onTimecodeLeave={onTimecodeLeave}
        textareaRef={(element) => {
          notesTextareaRef.current = element
        }}
      />
    </div>
  )
}
