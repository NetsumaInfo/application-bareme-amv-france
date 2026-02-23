import { useCallback, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'

interface LayoutContextMenuState {
  x: number
  y: number
}

export function useLayoutContextMenu() {
  const [contextMenu, setContextMenu] = useState<LayoutContextMenuState | null>(null)

  const handleContextMenu = useCallback((event: ReactMouseEvent) => {
    const target = event.target as HTMLElement
    if (
      target.closest('input, textarea, select, button, a, [contenteditable="true"]')
      || target.closest('[data-native-context="true"]')
    ) {
      return
    }

    event.preventDefault()
    setContextMenu({ x: event.clientX, y: event.clientY })
  }, [])

  return {
    contextMenu,
    setContextMenu,
    handleContextMenu,
  }
}
