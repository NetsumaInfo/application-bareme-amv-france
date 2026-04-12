import { forwardRef, useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { LucideIcon } from 'lucide-react'
import { useZoomScale } from '@/hooks/useZoomScale'

interface AppContextMenuPanelProps {
  x: number
  y: number
  minWidthClassName?: string
  className?: string
  children: ReactNode
}

interface AppContextMenuItemProps {
  label: string
  icon?: LucideIcon
  iconSecondary?: LucideIcon
  shortcut?: string
  disabled?: boolean
  active?: boolean
  danger?: boolean
  onClick?: () => void
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

export const AppContextMenuPanel = forwardRef<HTMLDivElement, AppContextMenuPanelProps>(
  function AppContextMenuPanel({
    x,
    y,
    minWidthClassName = 'min-w-[184px]',
    className = '',
    children,
  }, ref) {
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

    useLayoutEffect(() => {
      const updatePosition = () => {
        const viewport = getViewport()
        const node = internalRef.current
        if (!node) {
          setPosition(clampMenuPosition(x, y, viewport.width, viewport.height))
          return
        }

        setPosition(
          clampMenuPosition(x, y, viewport.width, viewport.height, node.offsetWidth, node.offsetHeight),
        )
      }

      updatePosition()
      window.addEventListener('resize', updatePosition)
      return () => window.removeEventListener('resize', updatePosition)
    }, [x, y, children, minWidthClassName, className, getViewport])

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
        className={`fixed z-[100] ${minWidthClassName} overflow-hidden rounded-md border border-slate-700/70 bg-[linear-gradient(180deg,rgba(20,24,36,0.98),rgba(12,16,26,0.98))] shadow-[0_14px_32px_rgba(2,6,23,0.34)] backdrop-blur-xl ${className}`}
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
  },
)

export function AppContextMenuSeparator() {
  return <div className="my-0.5 h-px bg-white/7" />
}

export function AppContextMenuItem({
  label,
  icon: Icon,
  iconSecondary: IconSecondary,
  shortcut,
  disabled = false,
  active = false,
  danger = false,
  onClick,
}: AppContextMenuItemProps) {
  const isClickable = !disabled && typeof onClick === 'function'
  const textClassName = disabled
    ? 'text-slate-500'
    : danger
      ? 'text-rose-300'
      : active
        ? 'text-primary-200'
        : 'text-slate-200'
  const hoverClassName = disabled
    ? ''
    : active
      ? 'bg-primary-500/10'
      : 'hover:bg-white/4'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={`group flex w-full items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left transition-colors ${hoverClassName} ${disabled ? 'cursor-not-allowed' : ''}`}
    >
      {(Icon || IconSecondary) ? (
        <span
          className={`relative flex h-6 min-w-6 items-center justify-center rounded-md ${
            disabled
              ? 'text-slate-500'
              : danger
                ? 'text-rose-300'
                : active
                  ? 'text-primary-200'
                  : 'text-slate-400 group-hover:text-slate-200'
          }`}
        >
          {Icon ? <Icon size={13.5} strokeWidth={1.85} /> : null}
          {IconSecondary ? (
            <span
              className={`absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[rgb(var(--color-surface-dark)/0.96)] ${
                disabled
                  ? 'text-slate-500'
                  : danger
                    ? 'text-rose-300'
                    : active
                      ? 'text-primary-200'
                      : 'text-slate-300'
              }`}
            >
              <IconSecondary size={8} strokeWidth={1.85} />
            </span>
          ) : null}
        </span>
      ) : null}

      <span className={`flex-1 text-[10.5px] font-medium leading-4 ${textClassName}`}>{label}</span>

      {shortcut ? (
        <span className={`text-[9px] leading-none ${disabled ? 'text-slate-600' : 'text-slate-500'}`}>{shortcut}</span>
      ) : null}
    </button>
  )
}
