import { useCallback, useEffect, useRef } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { emit } from '@tauri-apps/api/event'
import type { Clip } from '@/types/project'
import type { Note } from '@/types/notation'

interface UseDetachedNoteDebounceOptions {
  clip: Clip | null
  setLocalNote: Dispatch<SetStateAction<Note | null>>
}

export function useDetachedNoteDebounce({
  clip,
  setLocalNote,
}: UseDetachedNoteDebounceOptions) {
  const textDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const categoryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const criterionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTextNoteRef = useRef<string | null>(null)
  const pendingCategoryNoteRef = useRef<{ category: string; text: string } | null>(null)
  const pendingCriterionNoteRef = useRef<{ criterionId: string; text: string } | null>(null)

  useEffect(() => {
    return () => {
      if (textDebounceRef.current) clearTimeout(textDebounceRef.current)
      if (categoryDebounceRef.current) clearTimeout(categoryDebounceRef.current)
      if (criterionDebounceRef.current) clearTimeout(criterionDebounceRef.current)
    }
  }, [])

  const handleTextChange = useCallback(
    (text: string) => {
      if (!clip) return

      setLocalNote((prev) => (prev ? { ...prev, textNotes: text } : prev))
      pendingTextNoteRef.current = text

      if (textDebounceRef.current) clearTimeout(textDebounceRef.current)
      textDebounceRef.current = setTimeout(() => {
        pendingTextNoteRef.current = null
        emit('notes:text-notes-updated', {
          clipId: clip.id,
          text,
        }).catch(() => {})
      }, 300)
    },
    [clip, setLocalNote],
  )

  const handleCategoryNoteChange = useCallback(
    (category: string, text: string) => {
      if (!clip) return

      setLocalNote((prev) =>
        prev
          ? {
              ...prev,
              categoryNotes: {
                ...(prev.categoryNotes || {}),
                [category]: text,
              },
            }
          : prev,
      )
      pendingCategoryNoteRef.current = { category, text }

      if (categoryDebounceRef.current) clearTimeout(categoryDebounceRef.current)
      categoryDebounceRef.current = setTimeout(() => {
        pendingCategoryNoteRef.current = null
        emit('notes:category-note-updated', {
          clipId: clip.id,
          category,
          text,
        }).catch(() => {})
      }, 250)
    },
    [clip, setLocalNote],
  )

  const handleCriterionNoteChange = useCallback(
    (criterionId: string, text: string) => {
      if (!clip) return

      setLocalNote((prev) =>
        prev
          ? {
              ...prev,
              criterionNotes: {
                ...(prev.criterionNotes || {}),
                [criterionId]: text,
              },
            }
          : prev,
      )
      pendingCriterionNoteRef.current = { criterionId, text }

      if (criterionDebounceRef.current) clearTimeout(criterionDebounceRef.current)
      criterionDebounceRef.current = setTimeout(() => {
        pendingCriterionNoteRef.current = null
        emit('notes:criterion-note-updated', {
          clipId: clip.id,
          criterionId,
          text,
        }).catch(() => {})
      }, 250)
    },
    [clip, setLocalNote],
  )

  const flushPendingNoteUpdates = useCallback(() => {
    if (!clip) return

    if (textDebounceRef.current) {
      clearTimeout(textDebounceRef.current)
      textDebounceRef.current = null
    }
    if (categoryDebounceRef.current) {
      clearTimeout(categoryDebounceRef.current)
      categoryDebounceRef.current = null
    }
    if (criterionDebounceRef.current) {
      clearTimeout(criterionDebounceRef.current)
      criterionDebounceRef.current = null
    }

    if (pendingTextNoteRef.current !== null) {
      emit('notes:text-notes-updated', {
        clipId: clip.id,
        text: pendingTextNoteRef.current,
      }).catch(() => {})
      pendingTextNoteRef.current = null
    }

    if (pendingCategoryNoteRef.current) {
      emit('notes:category-note-updated', {
        clipId: clip.id,
        category: pendingCategoryNoteRef.current.category,
        text: pendingCategoryNoteRef.current.text,
      }).catch(() => {})
      pendingCategoryNoteRef.current = null
    }

    if (pendingCriterionNoteRef.current) {
      emit('notes:criterion-note-updated', {
        clipId: clip.id,
        criterionId: pendingCriterionNoteRef.current.criterionId,
        text: pendingCriterionNoteRef.current.text,
      }).catch(() => {})
      pendingCriterionNoteRef.current = null
    }
  }, [clip])

  return {
    handleTextChange,
    handleCategoryNoteChange,
    handleCriterionNoteChange,
    flushPendingNoteUpdates,
  }
}
