import { useUIStore } from '@/store/useUIStore'

/**
 * Returns the current CSS zoom scale factor (1 when no zoom is applied).
 *
 * When the app uses CSS `zoom` (fixed zoom mode), `getBoundingClientRect()`
 * values and `event.clientX/Y` are reported in **zoomed coordinates**, but
 * `window.innerWidth/Height` stays in the **unscaled viewport coordinate
 * space**. Multiply viewport dimensions by this factor before comparing them
 * against rect/pointer coordinates to keep the coordinate spaces aligned.
 */
export function useZoomScale(): number {
  const zoomLevel = useUIStore((state) => state.zoomLevel)
  const zoomMode = useUIStore((state) => state.zoomMode)
  // Only CSS `zoom` (fixed mode) shifts the coordinate space.
  // `transform: scale` (navigable mode) does NOT affect clientX/Y or rects.
  return zoomMode === 'fixed' ? zoomLevel / 100 : 1
}

export function getCurrentZoomScale(): number {
  const { zoomLevel, zoomMode } = useUIStore.getState()
  return zoomMode === 'fixed' ? zoomLevel / 100 : 1
}

/**
 * Imperative (non-hook) version — safe to call inside callbacks, useMemo,
 * useLayoutEffect, and plain functions without violating React hook rules.
 *
 * Returns viewport dimensions already scaled by the active CSS zoom factor,
 * so they can be compared directly against getBoundingClientRect() values
 * and event.clientX/Y without coordinate-space mismatch.
 */
export function getZoomedViewport(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 1280, height: 720 }
  }

  const scale = getCurrentZoomScale()
  return {
    width: window.innerWidth * scale,
    height: window.innerHeight * scale,
  }
}
