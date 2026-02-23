import type { ChangeEvent } from 'react'
import { formatTime } from '@/utils/formatters'
import type { NoteTimecodeMarker } from '@/utils/timecodes'

interface PlayerSeekBarProps {
  compact: boolean
  currentTime: number
  duration: number
  isLoaded: boolean
  noteMarkers: NoteTimecodeMarker[]
  onSeek: (value: number) => void
  onMarkerJump: (marker: NoteTimecodeMarker) => void
}

export default function PlayerSeekBar({
  compact,
  currentTime,
  duration,
  isLoaded,
  noteMarkers,
  onSeek,
  onMarkerJump,
}: PlayerSeekBarProps) {
  const markerSizeClass = compact ? 'w-1.5 h-1.5' : 'w-2 h-2'
  const markerYOffsetClass = compact ? '-translate-y-1/2' : '-translate-y-1/2'

  const handleSeekChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSeek(Number(event.target.value))
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`text-gray-400 font-mono ${compact ? 'text-[8px] w-7 text-right shrink-0' : 'text-[10px] w-10 text-right'}`}>
        {formatTime(currentTime)}
      </span>
      <div className="relative flex-1">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeekChange}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
          disabled={!isLoaded}
        />
        {duration > 0 && noteMarkers.length > 0 && (
          <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0">
            {noteMarkers.map((marker) => {
              const left = Math.max(0, Math.min(100, (marker.seconds / duration) * 100))
              return (
                <button
                  key={marker.key}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onMarkerJump(marker)
                  }}
                  className={`pointer-events-auto absolute top-0 -translate-x-1/2 ${markerYOffsetClass} ${markerSizeClass} rounded-full border shadow-sm hover:scale-110 transition-transform`}
                  style={{
                    left: `${left}%`,
                    backgroundColor: marker.color,
                    borderColor: 'rgba(15,23,42,0.8)',
                  }}
                  title={marker.previewText
                    ? `${marker.raw} - ${marker.previewText}`
                    : `${marker.raw} - ${marker.category ?? 'Notes globales'}`}
                />
              )
            })}
          </div>
        )}
      </div>
      {!compact && (
        <span className="text-[10px] text-gray-400 w-10 font-mono">
          {formatTime(duration)}
        </span>
      )}
    </div>
  )
}
