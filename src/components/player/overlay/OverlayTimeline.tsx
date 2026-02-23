import { formatTime } from '@/utils/formatters'
import type { ChangeEvent } from 'react'
import type { MarkerTooltip, OverlayTimecodeMarker } from '@/components/player/overlay/types'

interface OverlayTimelineProps {
  compactControls: boolean
  currentTime: number
  duration: number
  visibleMarkers: OverlayTimecodeMarker[]
  markerTooltip: MarkerTooltip | null
  onSeek: (event: ChangeEvent<HTMLInputElement>) => void
  onMarkerJump: (marker: OverlayTimecodeMarker) => void
  onMarkerTooltipChange: (tooltip: MarkerTooltip | null) => void
}

export function OverlayTimeline({
  compactControls,
  currentTime,
  duration,
  visibleMarkers,
  markerTooltip,
  onSeek,
  onMarkerJump,
  onMarkerTooltipChange,
}: OverlayTimelineProps) {
  return (
    <div className={`flex items-center ${compactControls ? 'gap-2 mb-2' : 'gap-3 mb-4'}`}>
      <span className={`${compactControls ? 'text-xs w-10' : 'text-sm w-14'} text-white font-mono text-right select-none`}>
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
          className={`w-full ${compactControls ? 'h-1' : 'h-1.5'} bg-white/30 rounded-full appearance-none cursor-pointer accent-primary-500
            [&::-webkit-slider-thumb]:appearance-none ${compactControls ? '[&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3' : '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4'}
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500
            [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
          `}
        />
        {visibleMarkers.length > 0 && (
          <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0 z-20">
            {visibleMarkers.map((marker) => {
              const left = Math.max(0, Math.min(100, (marker.seconds / duration) * 100))
              const tooltipText = marker.previewText?.trim()
                ? marker.previewText
                : `${marker.category ?? 'Notes'}`
              return (
                <button
                  key={marker.key}
                  type="button"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onMarkerJump(marker)
                  }}
                  onMouseEnter={() => {
                    onMarkerTooltipChange({ left, text: tooltipText })
                  }}
                  onMouseLeave={() => onMarkerTooltipChange(null)}
                  className={`${compactControls ? 'w-2 h-2' : 'w-2.5 h-2.5'} pointer-events-auto absolute top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border shadow-md hover:scale-110 transition-transform`}
                  style={{
                    left: `${left}%`,
                    backgroundColor: marker.color,
                    borderColor: 'rgba(15,23,42,0.9)',
                  }}
                  title={
                    marker.previewText
                      ? `${marker.raw} - ${marker.previewText}`
                      : `${marker.raw} - ${marker.category ?? 'Notes globales'}`
                  }
                />
              )
            })}
          </div>
        )}
        {markerTooltip && (
          <div
            className="pointer-events-none absolute -top-8 -translate-x-1/2 px-2 py-1 rounded bg-slate-900/95 border border-white/15 text-[10px] text-gray-100 whitespace-nowrap max-w-[260px] overflow-hidden text-ellipsis"
            style={{ left: `${markerTooltip.left}%` }}
          >
            {markerTooltip.text}
          </div>
        )}
      </div>
      <span className={`${compactControls ? 'text-xs w-10' : 'text-sm w-14'} text-white font-mono select-none`}>
        {formatTime(duration)}
      </span>
    </div>
  )
}
