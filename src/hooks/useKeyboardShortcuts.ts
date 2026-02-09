import { useEffect } from 'react'

type ShortcutHandler = () => void
type ShortcutMap = Record<string, ShortcutHandler>

export function useKeyboardShortcuts(shortcuts: ShortcutMap, globalShortcuts?: ShortcutMap) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let key = ''
      if (e.ctrlKey) key += 'ctrl+'
      if (e.shiftKey) key += 'shift+'
      if (e.altKey) key += 'alt+'
      key += e.key.toLowerCase()

      // Check global shortcuts first (always fire)
      if (globalShortcuts && globalShortcuts[key]) {
        e.preventDefault()
        globalShortcuts[key]()
        return
      }

      // Don't trigger regular shortcuts when typing in inputs
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return
      }

      const handler = shortcuts[key]
      if (handler) {
        e.preventDefault()
        handler()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, globalShortcuts])
}
