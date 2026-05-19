import { useEffect, useState, type RefObject } from 'react'
import { getIconScale, type OverlayIconScale } from '@/components/player/overlay/overlayConstants'

export function useControlScale(ref: RefObject<HTMLElement | null>): OverlayIconScale {
  const [width, setWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280,
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = Math.round(el.getBoundingClientRect().width)
        setWidth((prev) => (prev === next ? prev : next))
      })
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [ref])

  return getIconScale(width)
}
