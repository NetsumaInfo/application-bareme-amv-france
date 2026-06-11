import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react'
import type { HTMLAttributes, MouseEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useZoomScale } from '@/hooks/useZoomScale'
import { useUIStore } from '@/store/useUIStore'

interface HoverTextTooltipProps {
  text: string
  children: ReactNode
  className?: string
  maxWidthPx?: number
  placement?: 'auto' | 'above' | 'below'
  /** Affiche l'info-bulle même quand l'utilisateur les a désactivées dans les paramètres. */
  force?: boolean
  /**
   * Ancre l'info-bulle au centre de l'élément déclencheur (position calculée une fois)
   * au lieu de suivre le curseur — comportement par défaut, évite que la bulle saute
   * sur les petits boutons/icônes. Si le déclencheur n'enveloppe que du texte (aucun
   * élément enfant mesurable), on retombe automatiquement sur la position du pointeur.
   * Passer `anchor={false}` pour forcer le suivi du curseur.
   */
  anchor?: boolean
}

function getTooltipPosition(
  pointerX: number,
  pointerY: number,
  tooltipWidth: number,
  tooltipHeight: number,
  zoomScale: number,
  placement: 'auto' | 'above' | 'below',
): { left: number; top: number; side: 'above' | 'below'; arrowCenterX: number } {
  const margin = 10
  const offsetY = 14
  const normalizedPointerX = pointerX / zoomScale
  const normalizedPointerY = pointerY / zoomScale

  let left = normalizedPointerX - tooltipWidth / 2
  let top = normalizedPointerY + offsetY
  let side: 'above' | 'below' = 'below'

  if (typeof window !== 'undefined') {
    const viewportW = window.innerWidth
    const viewportH = window.innerHeight
    const canFitAbove = normalizedPointerY - offsetY - tooltipHeight >= margin
    const canFitBelow = normalizedPointerY + offsetY + tooltipHeight <= viewportH - margin

    if (placement === 'above') {
      side = canFitAbove ? 'above' : 'below'
    } else if (placement === 'below') {
      side = canFitBelow ? 'below' : 'above'
    } else {
      side = canFitAbove ? 'above' : 'below'
    }

    top = side === 'above'
      ? normalizedPointerY - tooltipHeight - offsetY
      : normalizedPointerY + offsetY

    if (left < margin) {
      left = margin
    }
    if (left + tooltipWidth > viewportW - margin) {
      left = Math.max(margin, viewportW - tooltipWidth - margin)
    }
    if (top < margin) {
      top = margin
    } else if (top + tooltipHeight > viewportH - margin) {
      top = Math.max(margin, viewportH - tooltipHeight - margin)
    }
  } else {
    side = placement === 'above' ? 'above' : 'below'
  }

  const arrowCenterX = Math.min(Math.max(normalizedPointerX - left, 12), tooltipWidth - 12)

  return { left, top, side, arrowCenterX }
}

export function HoverTextTooltip({
  text,
  children,
  className,
  maxWidthPx = 320,
  placement = 'auto',
  force = false,
  anchor = true,
}: HoverTextTooltipProps) {
  // Le réglage global d'affichage des infobulles a été retiré : elles sont toujours actives.
  const tooltipsEnabled = true
  const safeText = text.trim()
  const wrapperRef = useRef<HTMLSpanElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const arrowRef = useRef<HTMLSpanElement | null>(null)
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

  const anchorPointFromElement = useCallback((): { x: number; y: number } | null => {
    const node = wrapperRef.current
    if (!node) return null
    // Le wrapper est `display: contents` (sans boîte propre), on mesure donc
    // le vrai élément déclencheur (premier enfant) pour ne pas casser les grilles.
    const target = (node.firstElementChild as HTMLElement | null) ?? node
    const rect = target.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) return null
    const x = rect.left + rect.width / 2
    const y = placement === 'below' ? rect.bottom : rect.top
    return { x, y }
  }, [placement])

  const showTooltip = (event: MouseEvent<HTMLElement>) => {
    suppressNativeTitles(event.currentTarget)
    const anchorPoint = anchor ? anchorPointFromElement() : null
    pointerRef.current = anchorPoint ?? { x: event.clientX, y: event.clientY }
    setVisible(true)
  }

  const moveTooltip = (event: MouseEvent<HTMLElement>) => {
    if (!visible || anchor) return
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

    const arrow = arrowRef.current
    if (arrow) {
      const borderColor = 'rgb(55 65 81)' // gray-700, matches tooltip border
      arrow.style.left = `${pos.arrowCenterX}px`
      if (pos.side === 'above') {
        arrow.style.top = ''
        arrow.style.bottom = '-4px'
        arrow.style.borderRight = `1px solid ${borderColor}`
        arrow.style.borderBottom = `1px solid ${borderColor}`
        arrow.style.borderTop = 'none'
        arrow.style.borderLeft = 'none'
      } else {
        arrow.style.bottom = ''
        arrow.style.top = '-4px'
        arrow.style.borderLeft = `1px solid ${borderColor}`
        arrow.style.borderTop = `1px solid ${borderColor}`
        arrow.style.borderRight = 'none'
        arrow.style.borderBottom = 'none'
      }
    }
  }, [placement, zoomScale])

  useLayoutEffect(() => {
    if (!visible) return
    applyTooltipPosition(pointerRef.current.x, pointerRef.current.y)
  }, [applyTooltipPosition, safeText, visible])

  const onViewportChange = useEffectEvent(() => {
    if (anchor) {
      const point = anchorPointFromElement()
      if (point) {
        pointerRef.current = point
        applyTooltipPosition(point.x, point.y)
        return
      }
    }
    applyTooltipPosition(pointerRef.current.x, pointerRef.current.y)
  })

  useEffect(() => {
    if (!visible) return
    const handleViewportChange = () => {
      onViewportChange()
    }
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)
    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [visible])

  useEffect(() => restoreNativeTitles, [restoreNativeTitles])

  if (!safeText || (!tooltipsEnabled && !force)) {
    return <>{children}</>
  }

  const tooltip = visible ? (
    <div
      ref={tooltipRef}
      role="tooltip"
      className="fixed z-10010 pointer-events-none rounded-lg border border-gray-700 bg-surface px-2.5 py-1 text-[11px] text-gray-100 shadow-xl leading-snug w-max whitespace-normal wrap-break-word"
      style={{ left: 0, top: 0, maxWidth: `${maxWidthPx}px`, visibility: 'hidden' }}
    >
      {safeText}
      <span
        ref={arrowRef}
        aria-hidden="true"
        className="absolute block h-2 w-2 bg-surface"
        style={{ left: 0, transform: 'translateX(-50%) rotate(45deg)' }}
      />
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
        ref={wrapperRef}
        className={className ?? 'contents'}
        {...triggerProps}
      >
        {children}
      </span>
      {tooltip && (typeof document === 'undefined' ? tooltip : createPortal(tooltip, document.body))}
    </>
  )
}
