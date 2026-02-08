import { Headphones } from 'lucide-react'
import { usePlayerStore } from '@/store/usePlayerStore'
import * as tauri from '@/services/tauri'

export default function AudioTrackSelector() {
  const { audioTracks, currentAudioId, setCurrentAudioId } = usePlayerStore()

  if (audioTracks.length <= 1) return null

  const handleChange = async (value: string) => {
    const id = Number(value)
    try {
      await tauri.playerSetAudioTrack(id)
      setCurrentAudioId(id)
    } catch (e) {
      console.error('Failed to set audio track:', e)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Headphones size={13} className="text-gray-400 shrink-0" />
      <select
        value={currentAudioId !== null ? String(currentAudioId) : ''}
        onChange={(e) => handleChange(e.target.value)}
        className="bg-surface-light text-gray-300 text-[11px] rounded px-1.5 py-0.5 border border-gray-700 focus:border-primary-500 outline-none max-w-[140px] truncate"
      >
        {audioTracks.map((track) => (
          <option key={track.id} value={String(track.id)}>
            {track.title || track.lang || `Audio ${track.id}`}
            {track.channels ? ` (${track.channels}ch)` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
