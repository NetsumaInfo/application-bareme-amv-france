import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { useZoomScale } from '@/hooks/useZoomScale'

type AppSelectValue = string | number

interface AppSelectOption<T extends AppSelectValue = string> {
  value: T
  label: ReactNode
  menuLabel?: ReactNode
  disabled?: boolean
}

interface AppSelectProps<T extends AppSelectValue> {
  value: T
  options: readonly AppSelectOption<T>[]
  onChange: (value: T) => void
  align?: 'left' | 'right'
  ariaLabel?: string
  className?: string
  disabled?: boolean
  maxMenuHeight?: number
  menuClassName?: string
  menuWidth?: number | 'trigger'
  placeholder?: ReactNode
  size?: 'sm' | 'md'
  triggerClassName?: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getTextLabel(label: ReactNode): string | undefined {
  if (typeof label === 'string' || typeof label === 'number') {
    return String(label)
  }
  return undefined
}

function getFirstEnabledIndex<T extends AppSelectValue>(options: readonly AppSelectOption<T>[]) {
  return options.findIndex((option) => !option.disabled)
}

function getNextEnabledIndex<T extends AppSelectValue>(
  options: readonly AppSelectOption<T>[],
  currentIndex: number,
  direction: 1 | -1,
) {
  if (options.length === 0) return -1

  for (let step = 1; step <= options.length; step += 1) {
    const nextIndex = (currentIndex + direction * step + options.length) % options.length
    if (!options[nextIndex].disabled) return nextIndex
  }

  return -1
}

export function AppSelect<T extends AppSelectValue>({
  value,
  options,
  onChange,
  align = 'left',
  ariaLabel,
  className = '',
  disabled = false,
  maxMenuHeight = 280,
  menuClassName = '',
  menuWidth = 'trigger',
  placeholder,
  size = 'sm',
  triggerClassName = '',
}: AppSelectProps<T>) {
  const zoomScale = useZoomScale()
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [menuPosition, setMenuPosition] = useState({
    left: 0,
    top: 0,
    width: 160,
    maxHeight: maxMenuHeight,
  })

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value],
  )
  const firstEnabledIndex = useMemo(() => getFirstEnabledIndex(options), [options])
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined
  const displayLabel = selectedOption?.label ?? placeholder ?? ''
  const textLabel = getTextLabel(displayLabel)
  const activeOptionId = open && activeIndex >= 0 && options[activeIndex]
    ? `${listboxId}-${String(options[activeIndex].value)}`
    : undefined
  const getInitialActiveIndex = useCallback(
    () => (selectedIndex >= 0 ? selectedIndex : firstEnabledIndex),
    [firstEnabledIndex, selectedIndex],
  )

  const updateMenuPosition = useCallback(() => {
    const trigger = rootRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const viewportPadding = 8
    const viewportWidth = window.innerWidth * zoomScale
    const viewportHeight = window.innerHeight * zoomScale
    const availableWidth = Math.max(96, viewportWidth - viewportPadding * 2)
    const desiredWidth = menuWidth === 'trigger' ? Math.max(96, rect.width) : menuWidth
    const width = Math.min(desiredWidth, availableWidth)
    const measuredHeight = menuRef.current?.offsetHeight ?? Math.min(maxMenuHeight, Math.max(44, options.length * 31 + 8))
    const spaceBelow = viewportHeight - rect.bottom - viewportPadding
    const spaceAbove = rect.top - viewportPadding
    const openUpwards = spaceBelow < measuredHeight && spaceAbove > spaceBelow
    const maxHeight = Math.max(72, Math.min(maxMenuHeight, openUpwards ? spaceAbove - 8 : spaceBelow - 8))
    const visibleHeight = Math.min(measuredHeight, maxHeight)
    const maxLeft = Math.max(viewportPadding, viewportWidth - width - viewportPadding)
    const rawLeft = align === 'right' ? rect.right - width : rect.left
    const left = clamp(rawLeft, viewportPadding, maxLeft)
    const rawTop = openUpwards ? rect.top - visibleHeight - 8 : rect.bottom + 8
    const maxTop = Math.max(viewportPadding, viewportHeight - visibleHeight - viewportPadding)
    const top = clamp(rawTop, viewportPadding, maxTop)

    setMenuPosition({ left, top, width, maxHeight })
  }, [align, maxMenuHeight, menuWidth, options.length, zoomScale])

  const openMenu = useCallback(() => {
    setActiveIndex(getInitialActiveIndex())
    updateMenuPosition()
    setOpen(true)
  }, [getInitialActiveIndex, updateMenuPosition])

  useLayoutEffect(() => {
    if (!open) return

    const animationFrame = window.requestAnimationFrame(updateMenuPosition)
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)
    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [open, updateMenuPosition])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const commitOption = (option: AppSelectOption<T>) => {
    if (option.disabled) return
    onChange(option.value)
    setOpen(false)
  }

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      if (!open) {
        openMenu()
        return
      }
      setActiveIndex((current) => getNextEnabledIndex(options, current >= 0 ? current : firstEnabledIndex, direction))
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!open) {
        openMenu()
        return
      }
      const activeOption = options[activeIndex]
      if (activeOption) commitOption(activeOption)
    }
  }

  const menu = open && !disabled && typeof document !== 'undefined'
    ? createPortal(
      <div
        ref={menuRef}
        className={`fixed z-[2300] overflow-hidden rounded-lg bg-surface p-1.5 shadow-2xl ring-1 ring-inset ring-primary-400/10 ${menuClassName}`.trim()}
        style={{
          left: `${menuPosition.left}px`,
          top: `${menuPosition.top}px`,
          width: `${menuPosition.width}px`,
        }}
      >
        <div
          id={listboxId}
          className="overflow-y-auto"
          role="listbox"
          style={{ maxHeight: `${menuPosition.maxHeight}px` }}
          aria-label={ariaLabel}
        >
          {options.map((option, index) => {
            const selected = option.value === value
            const active = index === activeIndex
            return (
              <button
                key={String(option.value)}
                type="button"
                id={`${listboxId}-${String(option.value)}`}
                onClick={() => commitOption(option)}
                onMouseEnter={() => setActiveIndex(index)}
                disabled={option.disabled}
                className={`flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                  selected
                    ? 'bg-primary-600/15 text-white'
                    : active
                      ? 'bg-white/[0.05] text-white'
                      : 'text-gray-300 hover:bg-white/[0.04] hover:text-white'
                }`}
                role="option"
                aria-selected={selected}
              >
                <span className="min-w-0 truncate">{option.menuLabel ?? option.label}</span>
                {selected ? <Check size={13} className="shrink-0 text-primary-300" /> : null}
              </button>
            )
          })}
        </div>
      </div>,
      document.body,
    )
    : null

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`.trim()}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (open) {
            setOpen(false)
          } else {
            openMenu()
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        data-open={open ? 'true' : 'false'}
        className={`inline-flex w-full items-center justify-between gap-2 rounded-lg bg-surface-dark/70 text-left text-gray-200 ring-1 ring-inset ring-primary-400/10 transition-colors hover:bg-surface-light/70 focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:cursor-not-allowed disabled:opacity-50 ${
          size === 'md' ? 'h-8 px-2.5 text-xs' : 'h-7 px-2 text-xs'
        } ${triggerClassName}`.trim()}
        aria-label={ariaLabel ?? textLabel}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        aria-activedescendant={activeOptionId}
      >
        <span className="min-w-0 flex-1 truncate">{displayLabel}</span>
        <ChevronDown size={13} className={`shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {menu}
    </div>
  )
}
