import { useCallback, type PointerEvent } from 'react'

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

/**
 * Pointer handler that starts a native Windows window drag (`startDragging`) so
 * frameless windows keep full Aero Snap (ghost preview, edge/quarter snap, Snap
 * Assist) and behave like a real OS window. Drag never starts on interactive
 * controls (button / link / input / `[data-no-drag]`).
 *
 * Trade-off: while `startDragging` runs, the Windows modal move loop pauses the
 * WebView2 message pump, so the React UI freezes until the drag is released.
 * Video playback is unaffected (it lives in a separate Win32 mpv window).
 */
export function useWindowDrag() {
  return useCallback((event: PointerEvent) => {
    if (event.button !== 0 || !isTauri) return
    if (
      (event.target as HTMLElement).closest(
        'button,a,input,select,textarea,[role="slider"],[data-no-drag]',
      )
    ) {
      return
    }
    void import('@tauri-apps/api/window').then((m) => {
      m.getCurrentWindow().startDragging().catch(() => {})
    })
  }, [])
}
