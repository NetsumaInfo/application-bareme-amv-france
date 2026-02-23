import { useCallback, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { emit } from '@tauri-apps/api/event'
import { normalizeShortcutFromEvent } from '@/utils/shortcuts'
import type { ClipPayload } from '@/components/notes/detached/types'
import type { Criterion } from '@/types/bareme'
import type { Clip } from '@/types/project'

interface UseDetachedNotesNavigationOptions {
  flatCriteria: Criterion[]
  shortcutBindings: Record<string, string>
  inputRefs: React.MutableRefObject<Map<string, HTMLInputElement>>
  clipDataRef: React.MutableRefObject<ClipPayload | null>
  clipRef: React.MutableRefObject<Clip | null>
  flushPendingNoteUpdates: () => void
}

export function useDetachedNotesNavigation({
  flatCriteria,
  shortcutBindings,
  inputRefs,
  clipDataRef,
  clipRef,
  flushPendingNoteUpdates,
}: UseDetachedNotesNavigationOptions) {
  const moveFocus = useCallback((fromIndex: number, direction: 'prev' | 'next') => {
    const targetIndex = direction === 'next' ? fromIndex + 1 : fromIndex - 1
    if (targetIndex < 0 || targetIndex >= flatCriteria.length) return
    const targetId = flatCriteria[targetIndex].id
    const input = inputRefs.current.get(targetId)
    if (input) {
      input.focus()
      input.select()
    }
  }, [flatCriteria, inputRefs])

  const handleInputKeyDown = useCallback((event: ReactKeyboardEvent, index: number) => {
    const shortcut = normalizeShortcutFromEvent(event.nativeEvent)
    if (shortcut === shortcutBindings.notesNextField || shortcut === shortcutBindings.notesFieldDown) {
      event.preventDefault()
      moveFocus(index, 'next')
      return
    }
    if (shortcut === shortcutBindings.notesPrevField || shortcut === shortcutBindings.notesFieldUp) {
      event.preventDefault()
      moveFocus(index, 'prev')
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'Enter') {
      event.preventDefault()
      moveFocus(index, 'next')
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveFocus(index, 'prev')
    }
  }, [moveFocus, shortcutBindings])

  const handleNavigateClip = useCallback((direction: 'prev' | 'next') => {
    flushPendingNoteUpdates()
    const payload = clipDataRef.current
    if (!payload) return
    if (payload.totalClips <= 1) return
    emit('notes:navigate-clip', { direction, fromClipId: clipRef.current?.id }).catch(() => {})
  }, [clipDataRef, clipRef, flushPendingNoteUpdates])

  return {
    handleInputKeyDown,
    handleNavigateClip,
  }
}
