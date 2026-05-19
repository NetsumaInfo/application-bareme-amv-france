import { formatTime } from '@/utils/formatters'
import type { ChangeEvent } from 'react'
import type { MarkerTooltip, OverlayTimecodeMarker } from '@/components/player/overlay/types'
import { useI18n } from '@/i18n'
import type { OverlayIconScale } from '@/components/player/overlay/overlayConstants'

interface OverlayTimelineProps {
  iconScale: OverlayIconScale
  currentTime: number
  duration: number
  visibleMarkers: OverlayTimecodeMarker[]
  markerTooltip: MarkerTooltip | null
  onSeek: (event: ChangeEvent<HTMLInputElement>) => void
  onMarkerJump: (marker: OverlayTimecodeMarker) => void
  onMarkerTooltipChange: (tooltip: MarkerTooltip | null) => void
}

export function OverlayTimeline({
  currentTime,
  duration,
  visibleMarkers,
  markerTooltip,
  onSeek,
  onMarkerJump,
  onMarkerTooltipChange,
}: OverlayTimelineProps) {
  const { t } = useI18n()
  const safeDuration = duration > 0 ? duration : 0
  const progressPct = safeDuration > 0
    ? Math.max(0, Math.min(100, (currentTime / safeDuration) * 100))
    : 0
  const timelineGradient = `linear-gradient(to right, rgb(var(--color-primary-500)) 0%, rgb(var(--color-primary-500)) ${progressPct}%, rgba(255,255,255,0.28) ${progressPct}%, rgba(255,255,255,0.28) 100%)`
  return (
    <div className="flex items-center gap-2 mb-2 @[700px]/overlay:gap-3 @[700px]/overlay:mb-4">
      <span className="text-xs w-10 @[700px]/overlay:text-sm @[700px]/overlay:w-14 text-white font-mono text-right select-none">
        {formatTime(currentTime)}
      </span>
      <div className="relative flex-1">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={onSeek}
          aria-label={t('Position de lecture')}
          className="w-full h-1 @[700px]/overlay:h-1.5 rounded-full appearance-none cursor-pointer accent-primary-500
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
            @[700px]/overlay:[&::-webkit-slider-thumb]:w-4 @[700px]/overlay:[&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          style={{ background: timelineGradient }}
        />
        {visibleMarkers.length > 0 && (
          <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0 z-20">
            {visibleMarkers.map((marker) => {
              const left = duration > 0 ? Math.max(0, Math.min(100, (marker.seconds / duration) * 100)) : 0
              const tooltipText = marker.previewText?.trim()
                ? marker.previewText
                : `${marker.category ?? t('Notes')}`
              return (
                <button
                  key={marker.key}
                  type="button"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onMarkerJump(marker)
                  }}
                  onMouseEnter={() => onMarkerTooltipChange({ left, text: tooltipText })}
                  onMouseLeave={() => onMarkerTooltipChange(null)}
                  onFocus={() => onMarkerTooltipChange({ left, text: tooltipText })}
                  onBlur={() => onMarkerTooltipChange(null)}
                  aria-label={tooltipText}
                  className="w-2 h-2 @[700px]/overlay:w-2.5 @[700px]/overlay:h-2.5
                    pointer-events-auto absolute top-0 -translate-x-1/2 -translate-y-1/2
                    rounded-full border shadow-md
                    hover:scale-125 focus-visible:scale-125
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400
                    transition-transform motion-reduce:transition-none"
                  style={{
                    left: `${left}%`,
                    backgroundColor: marker.color,
                    borderColor: 'rgba(15,23,42,0.9)',
                  }}
                />
              )
            })}
          </div>
        )}
        {markerTooltip && (
          <div
            className="pointer-events-none absolute -top-8 -translate-x-1/2 px-2 py-1 rounded-sm bg-slate-900/95 border border-white/15 text-[10px] text-gray-100 whitespace-nowrap max-w-[260px] overflow-hidden text-ellipsis z-30 backdrop-blur-sm"
            style={{ left: `${markerTooltip.left}%` }}
          >
            {markerTooltip.text}
          </div>
        )}
      </div>
      <span className="text-xs w-10 @[700px]/overlay:text-sm @[700px]/overlay:w-14 text-white font-mono select-none">
        {formatTime(duration)}
      </span>
    </div>
  )
}
