import { useMemo } from 'react'

export function useZoomStyles(zoomMode: 'fixed' | 'navigable', zoomLevel: number) {
  const isNavigableZoom = zoomMode === 'navigable'

  return useMemo(() => {
    const zoomScale = Math.max(0.5, zoomLevel / 100)
    const zoomStyle = isNavigableZoom ? undefined : { zoom: `${zoomLevel}%` }
    const navigableCanvasStyle = isNavigableZoom
      ? {
          transform: `scale(${zoomScale})`,
          transformOrigin: 'top left',
          width: `${100 / zoomScale}%`,
          minHeight: `${100 / zoomScale}vh`,
        }
      : undefined

    const zoomOverflow = zoomMode === 'fixed'
      ? 'overflow-x-hidden overflow-y-auto'
      : 'overflow-auto'

    return {
      isNavigableZoom,
      zoomStyle,
      navigableCanvasStyle,
      zoomOverflow,
    }
  }, [isNavigableZoom, zoomLevel, zoomMode])
}
