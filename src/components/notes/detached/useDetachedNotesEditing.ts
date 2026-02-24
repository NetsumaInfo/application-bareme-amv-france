import { useCallback } from 'react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { emit } from '@tauri-apps/api/event'
import { formatPreciseTimecode } from '@/utils/formatters'
import { snapToFrameSeconds } from '@/utils/timecodes'
import { parseNumericInputValue } from '@/utils/numberInput'
import { insertTextAtCursor } from '@/components/notes/insertTextAtCursor'
import { useDetachedNoteDebounce } from '@/components/notes/detached/useDetachedNoteDebounce'
import type { ActiveNoteField } from '@/components/notes/detached/types'
import type { Clip } from '@/types/project'
import type { Note, CriterionScore } from '@/types/notation'
import * as tauri from '@/services/tauri'

type UseDetachedNotesEditingParams = {
  clip: Clip | null
  clipFps: number | null
  setLocalNote: Dispatch<SetStateAction<Note | null>>
  categoryTextareaRefs: MutableRefObject<Map<string, HTMLTextAreaElement>>
  globalTextareaRef: MutableRefObject<HTMLTextAreaElement | null>
  activeNoteFieldRef: MutableRefObject<ActiveNoteField | null>
}

export function useDetachedNotesEditing({
  clip,
  clipFps,
  setLocalNote,
  categoryTextareaRefs,
  globalTextareaRef,
  activeNoteFieldRef,
}: UseDetachedNotesEditingParams) {
  const {
    handleTextChange,
    handleCategoryNoteChange,
    handleCriterionNoteChange,
    flushPendingNoteUpdates,
  } = useDetachedNoteDebounce({
    clip,
    setLocalNote,
  })

  const handleValueChange = useCallback(
    (criterionId: string, value: number | string) => {
      if (!clip) return
      const parsedValue =
        typeof value === 'number'
          ? (Number.isFinite(value) ? value : null)
          : parseNumericInputValue(value)
      if (parsedValue === null) return

      setLocalNote((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          scores: {
            ...prev.scores,
            [criterionId]: {
              criterionId,
              value: parsedValue,
              isValid: true,
              validationErrors: [],
            } as CriterionScore,
          },
        }
      })

      emit('notes:criterion-updated', {
        clipId: clip.id,
        criterionId,
        value: parsedValue,
      }).catch(() => {})
    },
    [clip, setLocalNote],
  )

  const insertCurrentTimecode = useCallback(async () => {
    if (!clip?.filePath) return
    const target = activeNoteFieldRef.current
    if (!target) return

    const status = await tauri.playerGetStatus().catch(() => null)
    if (!status) return
    const preciseSeconds = snapToFrameSeconds(status.current_time, clipFps)
    const timecode = formatPreciseTimecode(preciseSeconds)

    if (target.kind === 'global') {
      const textarea = globalTextareaRef.current
      if (!textarea) return
      const { nextValue, caret } = insertTextAtCursor(textarea, timecode)
      handleTextChange(nextValue)
      requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(caret, caret)
      })
      return
    }

    const category = target.category
    if (!category) return
    const textarea = categoryTextareaRefs.current.get(category)
    if (!textarea) return
    const { nextValue, caret } = insertTextAtCursor(textarea, timecode)
    handleCategoryNoteChange(category, nextValue)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(caret, caret)
    })
  }, [
    clip,
    clipFps,
    activeNoteFieldRef,
    categoryTextareaRefs,
    globalTextareaRef,
    handleCategoryNoteChange,
    handleTextChange,
  ])

  return {
    handleValueChange,
    handleTextChange,
    handleCategoryNoteChange,
    handleCriterionNoteChange,
    flushPendingNoteUpdates,
    insertCurrentTimecode,
  }
}
