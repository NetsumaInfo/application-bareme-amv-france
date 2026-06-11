import { useCallback, useEffectEvent, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode, Ref } from 'react'
import { createPortal } from 'react-dom'
import { useZoomScale } from '@/hooks/useZoomScale'

interface AppContextMenuPanelProps {
  x: number
  y: number
  minWidthClassName?: string
  className?: string
  children: ReactNode
  ref?: Ref<HTMLDivElement>
}

function clampMenuPosition(
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number,
  menuWidth = 184,
  menuHeight = 220,
) {
  let adjustedX = x
  let adjustedY = y
  if (adjustedX + menuWidth > viewportWidth - 8) adjustedX = viewportWidth - menuWidth - 8
  if (adjustedY + menuHeight > viewportHeight - 8) adjustedY = viewportHeight - menuHeight - 8
  if (adjustedX < 8) adjustedX = 8
  if (adjustedY < 8) adjustedY = 8
  return { left: adjustedX, top: adjustedY }
}

export function AppContextMenuPanel({
  x,
  y,
  minWidthClassName = 'min-w-[184px]',
  className = '',
  children,
  ref,
}: AppContextMenuPanelProps) {
  const zoomScale = useZoomScale()
  const internalRef = useRef<HTMLDivElement | null>(null)
  const getViewport = useCallback(() => ({
    width: window.innerWidth * zoomScale,
    height: window.innerHeight * zoomScale,
  }), [zoomScale])
  const [position, setPosition] = useState(() => {
    const viewport = getViewport()
    return clampMenuPosition(x, y, viewport.width, viewport.height)
  })

  const updatePosition = useEffectEvent(() => {
    const viewport = getViewport()
    const node = internalRef.current
    if (!node) {
      setPosition(clampMenuPosition(x, y, viewport.width, viewport.height))
      return
    }

    setPosition(
      clampMenuPosition(x, y, viewport.width, viewport.height, node.offsetWidth, node.offsetHeight),
    )
  })

  useLayoutEffect(() => {
    updatePosition()
    const handleResize = () => updatePosition()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [x, y, children, minWidthClassName, className])

  const setRefs = (node: HTMLDivElement | null) => {
    internalRef.current = node
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ref.current = node
    }
  }

  const content = (
    <div
      ref={setRefs}
      className={`fixed z-100 ${minWidthClassName} overflow-hidden rounded-md border border-slate-700/70 bg-[linear-gradient(180deg,rgba(20,24,36,0.98),rgba(12,16,26,0.98))] shadow-[0_14px_32px_rgba(2,6,23,0.34)] backdrop-blur-xl ${className}`}
      style={position}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
      role="presentation"
    >
      <div className="p-0.5">{children}</div>
    </div>
  )

  if (typeof document === 'undefined') {
    return content
  }

  return createPortal(content, document.body)
}

export { AppContextMenuSeparator } from '@/components/ui/AppContextMenuSeparator'
export { AppContextMenuItem } from '@/components/ui/AppContextMenuItem'
