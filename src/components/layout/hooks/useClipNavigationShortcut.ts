import { useCallback, useEffect } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { normalizeShortcutFromEvent } from '@/utils/shortcuts'

type UseClipNavigationShortcutParams = {
  nextClipShortcut: string
  prevClipShortcut: string
  enabled?: boolean
}

export function useClipNavigationShortcut({
  nextClipShortcut,
  prevClipShortcut,
  enabled = true,
}: UseClipNavigationShortcutParams) {
  const canHandleClipNavFromTarget = useCallback((target: EventTarget | null) => {
    const element = target as HTMLElement | null
    if (!element) return true
    if (element.tagName === 'TEXTAREA' || element.isContentEditable) return false
    if (element.tagName === 'INPUT') {
      const input = element as HTMLInputElement
      const type = (input.type || 'text').toLowerCase()
      // Keep N/P available in numeric grids, but don't hijack text typing
      if (type === 'number' || type === 'range') return true
      return false
    }
    return true
  }, [])

  useEffect(() => {
    if (!enabled) return

    const handleClipNavigationShortcut = (event: KeyboardEvent) => {
      const navEvent = event as KeyboardEvent & { __amvClipNavHandled?: boolean }
      if (navEvent.__amvClipNavHandled) return

      const shortcut = normalizeShortcutFromEvent(event)
      if (!shortcut) return
      const isNext = shortcut === nextClipShortcut
      const isPrev = shortcut === prevClipShortcut
      if (!isNext && !isPrev) return
      if (!canHandleClipNavFromTarget(event.target)) return
      if (event.repeat) return

      navEvent.__amvClipNavHandled = true
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      if (isNext) {
        useProjectStore.getState().nextClip()
      } else {
        useProjectStore.getState().previousClip()
      }
    }

    document.addEventListener('keydown', handleClipNavigationShortcut, true)
    return () => {
      document.removeEventListener('keydown', handleClipNavigationShortcut, true)
    }
  }, [canHandleClipNavFromTarget, enabled, nextClipShortcut, prevClipShortcut])
}
