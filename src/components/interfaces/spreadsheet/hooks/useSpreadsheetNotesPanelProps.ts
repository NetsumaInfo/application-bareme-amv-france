import type { ComponentProps, MutableRefObject } from 'react'
import type { SpreadsheetNotesPanel } from '@/components/interfaces/spreadsheet/SpreadsheetNotesPanel'
import type { CategoryGroup } from '@/utils/results'
import type { Clip } from '@/types/project'
import type { Note } from '@/types/notation'

interface UseSpreadsheetNotesPanelPropsParams {
  currentClip: Clip | undefined
  hideTextNotes: boolean
  currentNote: Note | undefined
  categoryGroups: CategoryGroup[]
  clipFps: number | null
  notesTextareaRef: MutableRefObject<HTMLTextAreaElement | null>
  getCategoryScore: (clipId: string, group: CategoryGroup) => number
  setTextNotes: (clipId: string, text: string) => void
  markDirty: () => void
  setShowPipVideo: (show: boolean) => void
  seek: (time: number) => Promise<void>
  pause: () => Promise<void>
  showFramePreview: (params: { seconds: number; anchorRect: DOMRect }) => Promise<void>
  hideFramePreview: () => void
}

export function buildSpreadsheetNotesPanelProps({
  currentClip,
  hideTextNotes,
  currentNote,
  categoryGroups,
  clipFps,
  notesTextareaRef,
  getCategoryScore,
  setTextNotes,
  markDirty,
  setShowPipVideo,
  seek,
  pause,
  showFramePreview,
  hideFramePreview,
}: UseSpreadsheetNotesPanelPropsParams): ComponentProps<typeof SpreadsheetNotesPanel> | null {
  if (!currentClip || hideTextNotes) return null

  return {
    currentClip,
    currentNoteText: currentNote?.textNotes ?? '',
    categoryGroups,
    clipFps,
    notesTextareaRef,
    getCategoryScore,
    onChangeText: (nextValue: string) => {
      setTextNotes(currentClip.id, nextValue)
      markDirty()
    },
    onSeekAndPauseToTimecode: async (seconds: number) => {
      setShowPipVideo(true)
      await seek(seconds)
      await pause()
    },
    onTimecodeHover: (payload) => {
      return showFramePreview({ seconds: payload.item.seconds, anchorRect: payload.anchorRect })
    },
    onTimecodeLeave: hideFramePreview,
  }
}
