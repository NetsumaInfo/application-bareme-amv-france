import { useCallback } from 'react'
import { normalizeShortcutFromEvent } from '@/utils/shortcuts'
import type { Criterion } from '@/types/bareme'

interface UseNotationFocusNavigationOptions {
  flatCriteria: Criterion[]
  shortcutBindings: Record<string, string>
  inputRefs: React.MutableRefObject<Map<string, HTMLInputElement>>
}

export function useNotationFocusNavigation({
  flatCriteria,
  shortcutBindings,
  inputRefs,
}: UseNotationFocusNavigationOptions) {
  const moveFocus = useCallback(
    (fromIndex: number, direction: 'prev' | 'next') => {
      const targetIndex = direction === 'next' ? fromIndex + 1 : fromIndex - 1
      if (targetIndex < 0 || targetIndex >= flatCriteria.length) return
      const targetId = flatCriteria[targetIndex].id
      const input = inputRefs.current.get(targetId)
      if (input) {
        input.focus()
        input.select()
      }
    },
    [flatCriteria, inputRefs],
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
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
    },
    [moveFocus, shortcutBindings],
  )

  return {
    handleKeyDown,
  }
}
