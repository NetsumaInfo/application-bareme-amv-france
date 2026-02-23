import { formatTime } from '@/utils/formatters'
import type { ChangeEvent } from 'react'
import type { NoteTimecodeMarker } from '@/utils/timecodes'

interface FloatingPlayerTimelineProps {
  currentTime: number
  duration: number
  isLoaded: boolean
  noteMarkers: NoteTimecodeMarker[]
  onSeek: (seconds: number) => void
  onMarkerJump: (marker: NoteTimecodeMarker) => void
}

export function FloatingPlayerTimeline({
  currentTime,
  duration,
  isLoaded,
  noteMarkers,
  onSeek,
  onMarkerJump,
}: FloatingPlayerTimelineProps) {
  const handleSeekChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSeek(Number(event.target.value))
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-gray-500 font-mono w-8 text-right">
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
                  className="pointer-events-auto absolute top-0 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border shadow-md hover:scale-110 transition-transform"
                  style={{
                    left: `${left}%`,
                    backgroundColor: marker.color,
                    borderColor: 'rgba(15,23,42,0.85)',
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
      </div>
      <span className="text-[9px] text-gray-500 font-mono w-8">
        {formatTime(duration)}
      </span>
    </div>
  )
}
