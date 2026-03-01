import { forwardRef, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { LucideIcon } from 'lucide-react'

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

function clampMenuPosition(x: number, y: number, menuWidth = 210, menuHeight = 220) {
  let adjustedX = x
  let adjustedY = y
  if (adjustedX + menuWidth > window.innerWidth - 8) adjustedX = window.innerWidth - menuWidth - 8
  if (adjustedY + menuHeight > window.innerHeight - 8) adjustedY = window.innerHeight - menuHeight - 8
  if (adjustedX < 8) adjustedX = 8
  if (adjustedY < 8) adjustedY = 8
  return { left: adjustedX, top: adjustedY }
}

export const AppContextMenuPanel = forwardRef<HTMLDivElement, AppContextMenuPanelProps>(
  function AppContextMenuPanel({
    x,
    y,
    minWidthClassName = 'min-w-[210px]',
    className = '',
    children,
  }, ref) {
    const internalRef = useRef<HTMLDivElement | null>(null)
    const [position, setPosition] = useState(() => clampMenuPosition(x, y))

    useLayoutEffect(() => {
      const updatePosition = () => {
        const node = internalRef.current
        if (!node) {
          setPosition(clampMenuPosition(x, y))
          return
        }

        setPosition(clampMenuPosition(x, y, node.offsetWidth, node.offsetHeight))
      }

      updatePosition()
      window.addEventListener('resize', updatePosition)
      return () => window.removeEventListener('resize', updatePosition)
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
        className={`fixed z-[100] ${minWidthClassName} overflow-hidden rounded-lg border border-slate-600/80 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(9,14,29,0.98))] shadow-[0_10px_30px_rgba(2,6,23,0.42)] backdrop-blur-xl ${className}`}
        style={position}
        onClick={(event) => event.stopPropagation()}
        onContextMenu={(event) => {
          event.preventDefault()
          event.stopPropagation()
        }}
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
  return <div className="my-0.5 h-px bg-slate-700/80" />
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
      ? 'text-rose-400'
      : active
        ? 'text-sky-300'
        : 'text-slate-200'
  const hoverClassName = disabled
    ? ''
    : active
      ? 'bg-sky-500/12'
      : 'hover:bg-white/6'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={`group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${hoverClassName} ${disabled ? 'cursor-not-allowed' : ''}`}
    >
      {(Icon || IconSecondary) ? (
        <span
          className={`flex h-[26px] min-w-[26px] items-center justify-center rounded-md border ${
            disabled
              ? 'border-slate-700/80 bg-slate-900/70 text-slate-500'
              : danger
                ? 'border-rose-500/20 bg-rose-500/10 text-rose-300'
                : active
                  ? 'border-sky-500/30 bg-sky-500/14 text-sky-300'
                  : 'border-slate-700/80 bg-slate-900/70 text-slate-300 group-hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1">
            {Icon ? <Icon size={13} /> : null}
            {IconSecondary ? <IconSecondary size={13} /> : null}
          </span>
        </span>
      ) : null}

      <span className={`flex-1 text-[12px] leading-[1.15rem] ${textClassName}`}>{label}</span>

      {shortcut ? (
        <span className={`text-[9px] ${disabled ? 'text-slate-600' : 'text-slate-500'}`}>{shortcut}</span>
      ) : null}
    </button>
  )
}
