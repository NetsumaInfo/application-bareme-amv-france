import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { usePlayer } from '@/hooks/usePlayer'
import { formatTime } from '@/utils/formatters'

interface PlayerControlsProps {
  compact?: boolean
}

export default function PlayerControls({ compact }: PlayerControlsProps) {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    isLoaded,
    togglePause,
    seek,
    seekRelative,
    setVolume,
    setMuted,
  } = usePlayer()

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-1">
        <button
          onClick={togglePause}
          className="p-1 rounded-full bg-primary-600 hover:bg-primary-500 text-white transition-colors"
          disabled={!isLoaded}
        >
          {isPlaying ? <Pause size={10} /> : <Play size={10} />}
        </button>
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={(e) => seek(Number(e.target.value))}
          className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
          disabled={!isLoaded}
        />
        <span className="text-[8px] text-gray-500 font-mono w-7 text-right shrink-0">
          {formatTime(currentTime)}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 px-2 py-1.5 bg-surface rounded-lg">
      {/* Seek bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-400 w-10 text-right font-mono">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={(e) => seek(Number(e.target.value))}
          className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
          disabled={!isLoaded}
        />
        <span className="text-[10px] text-gray-400 w-10 font-mono">
          {formatTime(duration)}
        </span>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => seekRelative(-5)}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
            disabled={!isLoaded}
            title="- 5s"
          >
            <SkipBack size={14} />
          </button>
          <button
            onClick={togglePause}
            className="p-1.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white transition-colors"
            disabled={!isLoaded}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={() => seekRelative(5)}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
            disabled={!isLoaded}
            title="+ 5s"
          >
            <SkipForward size={14} />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMuted(!muted)}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
          >
            {muted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
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
            className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
        </div>
      </div>
    </div>
  )
}
