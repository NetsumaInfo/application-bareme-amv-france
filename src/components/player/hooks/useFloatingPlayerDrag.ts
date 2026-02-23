import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'

type Position = {
  left: number
  top: number
}

export function useFloatingPlayerDrag() {
  const dragStartRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(
    null,
  )

  const panelWidth =
    typeof window !== 'undefined'
      ? Math.min(420, Math.max(260, window.innerWidth - 24))
      : 320
  const videoHeight = Math.round(panelWidth * 0.5625)

  const [position, setPosition] = useState<Position>({
    left:
      typeof window !== 'undefined'
        ? Math.max(12, window.innerWidth - panelWidth - 16)
        : 0,
    top: 80,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const clampPosition = useCallback(
    (nextLeft: number, nextTop: number): Position => {
      const maxLeft = Math.max(12, window.innerWidth - panelWidth - 12)
      const maxTop = Math.max(44, window.innerHeight - videoHeight - 64)
      return {
        left: Math.min(Math.max(12, nextLeft), maxLeft),
        top: Math.min(Math.max(44, nextTop), maxTop),
      }
    },
    [panelWidth, videoHeight],
  )

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      dragStartRef.current = {
        x: position.left,
        y: position.top,
        startX: e.clientX,
        startY: e.clientY,
      }
      setIsDragging(true)
    },
    [position.left, position.top],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragStartRef.current) return

      const deltaX = e.clientX - dragStartRef.current.startX
      const deltaY = e.clientY - dragStartRef.current.startY

      setPosition(
        clampPosition(dragStartRef.current.x + deltaX, dragStartRef.current.y + deltaY),
      )
    },
    [clampPosition],
  )

  const handleMouseUp = useCallback(() => {
    dragStartRef.current = null
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => clampPosition(prev.left, prev.top))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [clampPosition])

  return {
    panelWidth,
    videoHeight,
    position,
    isDragging,
    isHovering,
    setIsHovering,
    setPosition,
    handleMouseDown,
  }
}
