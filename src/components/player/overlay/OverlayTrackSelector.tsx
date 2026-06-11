import type { MutableRefObject, ReactNode } from 'react'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import type { OverlayIconScale } from '@/components/player/overlay/overlayConstants'

interface OverlayTrackOption {
  key: string | number
  label: string
  active: boolean
  onSelect: () => void
}

interface OverlayTrackSelectorProps {
  iconScale: OverlayIconScale
  buttonTitle: string
  disabledTitle: string
  enabled: boolean
  active: boolean
  icon: ReactNode
  open: boolean
  containerRef: MutableRefObject<HTMLDivElement | null>
  onToggle: () => void
  options: OverlayTrackOption[]
}

export function OverlayTrackSelector({
  buttonTitle,
  disabledTitle,
  enabled,
  active,
  icon,
  open,
  containerRef,
  onToggle,
  options,
}: OverlayTrackSelectorProps) {
  return (
    <div ref={containerRef} className="relative">
      <HoverTextTooltip text={enabled ? buttonTitle : disabledTitle}>
        <button
          type="button"
          onClick={() => enabled && onToggle()}
          aria-label={enabled ? buttonTitle : disabledTitle}
          aria-haspopup="menu"
          aria-expanded={open}
          className={`p-1.5 @[700px]/overlay:p-2.5 rounded-full transition-colors motion-reduce:transition-none
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
              enabled
                ? active
                  ? 'text-primary-400 hover:bg-primary-500/25 hover:text-primary-300'
                  : 'text-white/85 hover:bg-primary-500/25 hover:text-white'
                : 'text-white/30 cursor-default'
            }`}
        >
          {icon}
        </button>
      </HoverTextTooltip>
      {open && enabled && (
        <div
          role="menu"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-[180px]
            bg-black/85 border border-white/15 rounded-lg shadow-xl py-1 z-50 backdrop-blur-sm"
        >
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              role="menuitemradio"
              aria-checked={option.active}
              onClick={option.onSelect}
              className={`w-full text-left px-3 py-2 text-sm transition-colors motion-reduce:transition-none
                hover:bg-primary-500/20
                focus-visible:outline-none focus-visible:bg-primary-500/20 ${
                  option.active ? 'text-primary-400 font-medium' : 'text-white/85'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
