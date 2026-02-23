import { useEffect, useMemo, useState } from 'react'

export function useOverlayViewport() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
  })

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    window.addEventListener('resize', updateViewport)
    updateViewport()
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  return useMemo(() => ({
    compactControls: viewport.width < 700 || viewport.height < 390,
    tinyControls: viewport.width < 560 || viewport.height < 330,
  }), [viewport.height, viewport.width])
}
