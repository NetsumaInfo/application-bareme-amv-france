import { useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface HoverTextTooltipProps {
  text: string
  children: ReactNode
  className?: string
  maxWidthPx?: number
}

interface TooltipState {
  visible: boolean
  left: number
  top: number
}

function getTooltipPosition(
  event: MouseEvent<HTMLElement>,
  maxWidthPx: number,
): { left: number; top: number } {
  const margin = 10
  const offsetX = 14
  const offsetY = 18
  const approxHeight = 52

  let left = event.clientX + offsetX
  let top = event.clientY + offsetY

  if (typeof window !== 'undefined') {
    if (left + maxWidthPx > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - maxWidthPx - margin)
    }
    if (top + approxHeight > window.innerHeight - margin) {
      top = Math.max(margin, event.clientY - approxHeight - 10)
    }
  }

  return { left, top }
}

export function HoverTextTooltip({
  text,
  children,
  className,
  maxWidthPx = 320,
}: HoverTextTooltipProps) {
  const safeText = text.trim()
  const [state, setState] = useState<TooltipState>({ visible: false, left: 0, top: 0 })

  if (!safeText) {
    return <>{children}</>
  }

  const showTooltip = (event: MouseEvent<HTMLElement>) => {
    const pos = getTooltipPosition(event, maxWidthPx)
    setState({ visible: true, left: pos.left, top: pos.top })
  }

  const moveTooltip = (event: MouseEvent<HTMLElement>) => {
    if (!state.visible) return
    const pos = getTooltipPosition(event, maxWidthPx)
    setState((prev) => ({ ...prev, left: pos.left, top: pos.top }))
  }

  const hideTooltip = () => {
    setState((prev) => ({ ...prev, visible: false }))
  }

  const tooltip = state.visible ? (
    <div
      className="fixed z-[10010] pointer-events-none rounded-md border border-gray-700 bg-surface px-2 py-1 text-[11px] text-gray-100 shadow-xl leading-snug w-max whitespace-normal break-words"
      style={{ left: state.left, top: state.top, maxWidth: `${maxWidthPx}px` }}
    >
      {safeText}
    </div>
  ) : null

  return (
    <>
      <span
        className={className}
        onMouseEnter={showTooltip}
        onMouseMove={moveTooltip}
        onMouseLeave={hideTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </span>
      {tooltip && (typeof document === 'undefined' ? tooltip : createPortal(tooltip, document.body))}
    </>
  )
}
