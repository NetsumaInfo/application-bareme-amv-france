import type { CSSProperties } from 'react'

interface AppRangeSliderProps {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  accentColor?: string
  ariaLabel?: string
  className?: string
  disabled?: boolean
  step?: number
}

export function AppRangeSlider({
  value,
  min,
  max,
  onChange,
  accentColor,
  ariaLabel,
  className = '',
  disabled = false,
  step,
}: AppRangeSliderProps) {
  const range = max - min
  const progress = range > 0 ? ((value - min) / range) * 100 : 0

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(event) => onChange(Number(event.target.value))}
      className={`app-range-slider w-full ${className}`.trim()}
      style={{
        '--app-range-value': `${Math.min(100, Math.max(0, progress))}%`,
        ...(accentColor ? { '--app-range-accent': accentColor } : {}),
      } as CSSProperties}
    />
  )
}
