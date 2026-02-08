import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { usePlayer } from '@/hooks/usePlayer'
import { formatTime } from '@/utils/formatters'

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2]

export default function PlayerControls() {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    playbackSpeed,
    isLoaded,
    togglePause,
    seek,
    seekRelative,
    setVolume,
    setSpeed,
    setMuted,
  } = usePlayer()

  return (
    <div className="flex flex-col gap-2 px-3 py-2 bg-surface rounded-lg">
      {/* Seek bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 w-12 text-right font-mono">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={(e) => seek(Number(e.target.value))}
          className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
          disabled={!isLoaded}
        />
        <span className="text-xs text-gray-400 w-12 font-mono">
          {formatTime(duration)}
        </span>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Skip back 5s */}
          <button
            onClick={() => seekRelative(-5)}
            className="p-1.5 rounded hover:bg-surface-light text-gray-300 hover:text-white transition-colors"
            disabled={!isLoaded}
            title="Reculer 5s"
          >
            <SkipBack size={16} />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePause}
            className="p-2 rounded-full bg-primary-600 hover:bg-primary-500 text-white transition-colors"
            disabled={!isLoaded}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          {/* Skip forward 5s */}
          <button
            onClick={() => seekRelative(5)}
            className="p-1.5 rounded hover:bg-surface-light text-gray-300 hover:text-white transition-colors"
            disabled={!isLoaded}
            title="Avancer 5s"
          >
            <SkipForward size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Speed control */}
          <select
            value={playbackSpeed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="bg-surface-light text-gray-300 text-xs rounded px-2 py-1 border border-gray-700 focus:border-primary-500 outline-none"
            disabled={!isLoaded}
          >
            {SPEED_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>

          {/* Volume */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMuted(!muted)}
              className="p-1 rounded hover:bg-surface-light text-gray-300 hover:text-white transition-colors"
            >
              {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value))
                if (muted) setMuted(false)
              }}
              className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
