import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { HTMLAttributes, MouseEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useZoomScale } from '@/hooks/useZoomScale'

interface HoverTextTooltipProps {
  text: string
  children: ReactNode
  className?: string
  maxWidthPx?: number
  placement?: 'auto' | 'above' | 'below'
}

function getTooltipPosition(
  pointerX: number,
  pointerY: number,
  tooltipWidth: number,
  tooltipHeight: number,
  zoomScale: number,
  placement: 'auto' | 'above' | 'below',
): { left: number; top: number } {
  const margin = 10
  const offsetY = 18
  const normalizedPointerX = pointerX / zoomScale
  const normalizedPointerY = pointerY / zoomScale

  let left = normalizedPointerX - tooltipWidth / 2
  let top = normalizedPointerY + offsetY

  if (typeof window !== 'undefined') {
    const viewportW = window.innerWidth
    const viewportH = window.innerHeight
    const canFitAbove = normalizedPointerY - offsetY - tooltipHeight >= margin
    const canFitBelow = normalizedPointerY + offsetY + tooltipHeight <= viewportH - margin

    if (placement === 'above') {
      top = canFitAbove
        ? normalizedPointerY - tooltipHeight - offsetY
        : normalizedPointerY + offsetY
    } else if (placement === 'below') {
      top = canFitBelow
        ? normalizedPointerY + offsetY
        : normalizedPointerY - tooltipHeight - offsetY
    } else {
      top = normalizedPointerY + offsetY
    }

    if (left < margin) {
      left = margin
    }
    if (left + tooltipWidth > viewportW - margin) {
      left = Math.max(margin, viewportW - tooltipWidth - margin)
    }
    if (top + tooltipHeight > viewportH - margin) {
      top = Math.max(margin, normalizedPointerY - tooltipHeight - 10)
    } else if (top < margin) {
      top = margin
    }
  }

  return { left, top }
}

export function HoverTextTooltip({
  text,
  children,
  className,
  maxWidthPx = 320,
  placement = 'auto',
}: HoverTextTooltipProps) {
  const safeText = text.trim()
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const suppressedTitlesRef = useRef<Array<{ element: HTMLElement; title: string }>>([])
  const pointerRef = useRef({ x: 0, y: 0 })
  const [visible, setVisible] = useState(false)
  const zoomScale = useZoomScale()

  const suppressNativeTitles = useCallback((root: HTMLElement) => {
    const entries: Array<{ element: HTMLElement; title: string }> = []
    const candidates = [
      root,
      ...Array.from(root.querySelectorAll<HTMLElement>('[title]')),
    ]

    for (const element of candidates) {
      const title = element.getAttribute('title')
      if (!title) continue
      entries.push({ element, title })
      element.removeAttribute('title')
    }

    suppressedTitlesRef.current = entries
  }, [])

  const restoreNativeTitles = useCallback(() => {
    for (const entry of suppressedTitlesRef.current) {
      entry.element.setAttribute('title', entry.title)
    }
    suppressedTitlesRef.current = []
  }, [])

  const showTooltip = (event: MouseEvent<HTMLElement>) => {
    suppressNativeTitles(event.currentTarget)
    pointerRef.current = { x: event.clientX, y: event.clientY }
    setVisible(true)
  }

  const moveTooltip = (event: MouseEvent<HTMLElement>) => {
    if (!visible) return
    pointerRef.current = { x: event.clientX, y: event.clientY }
    applyTooltipPosition(event.clientX, event.clientY)
  }

  const hideTooltip = () => {
    restoreNativeTitles()
    setVisible(false)
  }

  const applyTooltipPosition = useCallback((pointerX: number, pointerY: number) => {
    const node = tooltipRef.current
    if (!node) return

    const pos = getTooltipPosition(pointerX, pointerY, node.offsetWidth, node.offsetHeight, zoomScale, placement)
    node.style.left = `${pos.left}px`
    node.style.top = `${pos.top}px`
    node.style.visibility = 'visible'
  }, [placement, zoomScale])

  useLayoutEffect(() => {
    if (!visible) return
    applyTooltipPosition(pointerRef.current.x, pointerRef.current.y)
  }, [applyTooltipPosition, safeText, visible])

  useEffect(() => {
    if (!visible) return
    const handleViewportChange = () => {
      applyTooltipPosition(pointerRef.current.x, pointerRef.current.y)
    }
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)
    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [applyTooltipPosition, visible])

  useEffect(() => restoreNativeTitles, [restoreNativeTitles])

  if (!safeText) {
    return <>{children}</>
  }

  const tooltip = visible ? (
    <div
      ref={tooltipRef}
      role="tooltip"
      className="fixed z-[10010] pointer-events-none rounded-md border border-gray-700 bg-surface px-2 py-1 text-[11px] text-gray-100 shadow-xl leading-snug w-max whitespace-normal break-words"
      style={{ left: 0, top: 0, maxWidth: `${maxWidthPx}px`, visibility: 'hidden' }}
    >
      {safeText}
    </div>
  ) : null

  const triggerProps: HTMLAttributes<HTMLElement> = {
    onMouseEnter: showTooltip,
    onMouseMove: moveTooltip,
    onMouseLeave: hideTooltip,
  }

  return (
    <>
      <span
        className={className ?? 'contents'}
        {...triggerProps}
      >
        {children}
      </span>
      {tooltip && (typeof document === 'undefined' ? tooltip : createPortal(tooltip, document.body))}
    </>
  )
}
