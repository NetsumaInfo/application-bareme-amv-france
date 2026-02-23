import { useCallback } from 'react'
import { normalizeShortcutFromEvent } from '@/utils/shortcuts'
import type { Clip } from '@/types/project'
import type { ShortcutAction } from '@/utils/shortcuts'
import type { KeyboardEvent as ReactKeyboardEvent, MutableRefObject } from 'react'

interface UseSpreadsheetGridNavigationParams {
  clips: Clip[]
  sortedClips: Clip[]
  criteriaCount: number
  shortcutBindings: Record<ShortcutAction, string>
  setCurrentClip: (index: number) => void
  cellRefs: MutableRefObject<Map<string, HTMLInputElement>>
  rowRefs: MutableRefObject<Map<number, HTMLTableRowElement>>
}

export function useSpreadsheetGridNavigation({
  clips,
  sortedClips,
  criteriaCount,
  shortcutBindings,
  setCurrentClip,
  cellRefs,
  rowRefs,
}: UseSpreadsheetGridNavigationParams) {
  const focusCell = useCallback(
    (clipIdx: number, critIdx: number) => {
      if (clipIdx < 0 || clipIdx >= sortedClips.length) return
      if (critIdx < 0 || critIdx >= criteriaCount) return
      const key = `${clipIdx}-${critIdx}`
      const input = cellRefs.current.get(key)
      if (input) {
        input.focus()
        input.select()
      }

      const row = rowRefs.current.get(clipIdx)
      if (row) {
        row.scrollIntoView({ block: 'nearest' })
      }

      const clip = sortedClips[clipIdx]
      const originalIndex = clips.findIndex((item) => item.id === clip.id)
      if (originalIndex !== -1) {
        setCurrentClip(originalIndex)
      }
    },
    [cellRefs, clips, criteriaCount, rowRefs, setCurrentClip, sortedClips],
  )

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<Element>, clipIdx: number, critIdx: number) => {
      const shortcut = normalizeShortcutFromEvent(event.nativeEvent)
      if (shortcut === shortcutBindings.notesNextField) {
        event.preventDefault()
        focusCell(clipIdx, critIdx + 1)
        return
      }
      if (shortcut === shortcutBindings.notesPrevField) {
        event.preventDefault()
        focusCell(clipIdx, critIdx - 1)
        return
      }
      if (shortcut === shortcutBindings.notesFieldDown) {
        event.preventDefault()
        focusCell(clipIdx + 1, critIdx)
        return
      }
      if (shortcut === shortcutBindings.notesFieldUp) {
        event.preventDefault()
        focusCell(clipIdx - 1, critIdx)
        return
      }

      if (event.key === 'Tab' && !event.shiftKey) {
        event.preventDefault()
        if (critIdx < criteriaCount - 1) focusCell(clipIdx, critIdx + 1)
        else if (clipIdx < sortedClips.length - 1) focusCell(clipIdx + 1, 0)
      } else if (event.key === 'Tab' && event.shiftKey) {
        event.preventDefault()
        if (critIdx > 0) focusCell(clipIdx, critIdx - 1)
        else if (clipIdx > 0) focusCell(clipIdx - 1, criteriaCount - 1)
      } else if (event.key === 'ArrowRight') {
        const input = event.currentTarget as HTMLInputElement
        if (input.selectionStart === input.value.length) {
          event.preventDefault()
          focusCell(clipIdx, critIdx + 1)
        }
      } else if (event.key === 'ArrowLeft') {
        const input = event.currentTarget as HTMLInputElement
        if (input.selectionStart === 0) {
          event.preventDefault()
          focusCell(clipIdx, critIdx - 1)
        }
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        focusCell(clipIdx + 1, critIdx)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        focusCell(clipIdx - 1, critIdx)
      } else if (event.key === 'Enter') {
        event.preventDefault()
        focusCell(clipIdx + 1, critIdx)
      }
    },
    [criteriaCount, focusCell, shortcutBindings, sortedClips.length],
  )

  return { handleKeyDown }
}
