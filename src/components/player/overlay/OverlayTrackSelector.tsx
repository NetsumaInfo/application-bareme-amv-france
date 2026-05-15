import type { MutableRefObject, ReactNode } from 'react'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'

interface OverlayTrackOption {
  key: string | number
  label: string
  active: boolean
  onSelect: () => void
}

interface OverlayTrackSelectorProps {
  compactControls: boolean
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
  compactControls,
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
          onClick={() => enabled && onToggle()}
          aria-label={enabled ? buttonTitle : disabledTitle}
          className={`${compactControls ? 'p-1.5' : 'p-2.5'} rounded-full hover:bg-white/20 transition-colors ${
            enabled
              ? active
                ? 'text-primary-400'
                : 'text-white/80 hover:text-white'
              : 'text-white/30 cursor-default'
          }`}
        >
          {icon}
        </button>
      </HoverTextTooltip>
      {open && enabled && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-[180px] bg-black/90 border border-white/20 rounded-lg shadow-xl py-1 z-50 backdrop-blur-xs">
          {options.map((option) => (
            <button
              key={option.key}
              onClick={option.onSelect}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors ${
                option.active ? 'text-primary-400 font-medium' : 'text-white/80'
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
