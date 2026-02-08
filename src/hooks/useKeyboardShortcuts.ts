import { useEffect } from 'react'

type ShortcutHandler = () => void
type ShortcutMap = Record<string, ShortcutHandler>

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return
      }

      let key = ''
      if (e.ctrlKey) key += 'ctrl+'
      if (e.shiftKey) key += 'shift+'
      if (e.altKey) key += 'alt+'
      key += e.key.toLowerCase()

      const handler = shortcuts[key]
      if (handler) {
        e.preventDefault()
        handler()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}
