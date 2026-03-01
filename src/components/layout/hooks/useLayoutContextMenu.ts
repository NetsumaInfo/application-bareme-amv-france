import { useCallback, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'

export type LayoutContextScope =
  | 'page'
  | 'welcome'
  | 'create-project'
  | 'settings'
  | 'bareme-editor'

interface LayoutContextMenuState {
  x: number
  y: number
  scope: LayoutContextScope
}

export function useLayoutContextMenu() {
  const [contextMenu, setContextMenu] = useState<LayoutContextMenuState | null>(null)

  const handleContextMenu = useCallback((event: ReactMouseEvent) => {
    const target = event.target as HTMLElement
    if (
      target.closest('input, textarea, select, [contenteditable="true"]')
      || target.closest('[data-native-context="true"]')
    ) {
      return
    }

    const scope = (
      target.closest<HTMLElement>('[data-context-scope]')?.dataset.contextScope as LayoutContextScope | undefined
    ) ?? 'page'

    event.preventDefault()
    setContextMenu({ x: event.clientX, y: event.clientY, scope })
  }, [])

  return {
    contextMenu,
    setContextMenu,
    handleContextMenu,
  }
}
