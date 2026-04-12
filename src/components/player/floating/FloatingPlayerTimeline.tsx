import { formatTime } from '@/utils/formatters'
import { AppRangeSlider } from '@/components/ui/AppRangeSlider'
import type { NoteTimecodeMarker } from '@/utils/timecodes'
import { useI18n } from '@/i18n'

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
  const { t } = useI18n()
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-gray-500 font-mono w-8 text-right">
        {formatTime(currentTime)}
      </span>
      <div className="relative flex-1">
        <AppRangeSlider
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={onSeek}
          disabled={!isLoaded}
          ariaLabel={t('Lecture')}
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
                      : `${marker.raw} - ${marker.category ?? t('Notes globales')}`
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
