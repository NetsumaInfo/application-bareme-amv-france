import { Subtitles } from 'lucide-react'
import { usePlayerStore } from '@/store/usePlayerStore'
import * as tauri from '@/services/tauri'

export default function SubtitleSelector() {
  const { subtitleTracks, currentSubtitleId, setCurrentSubtitleId } = usePlayerStore()

  if (subtitleTracks.length === 0) return null

  const handleChange = async (value: string) => {
    const id = value === 'off' ? null : Number(value)
    try {
      await tauri.playerSetSubtitleTrack(id)
      setCurrentSubtitleId(id)
    } catch (e) {
      console.error('Failed to set subtitle track:', e)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Subtitles size={13} className="text-gray-400 shrink-0" />
      <select
        value={currentSubtitleId === null ? 'off' : String(currentSubtitleId)}
        onChange={(e) => handleChange(e.target.value)}
        className="bg-surface-light text-gray-300 text-[11px] rounded px-1.5 py-0.5 border border-gray-700 focus:border-primary-500 outline-none max-w-[140px] truncate"
      >
        <option value="off">Pas de sous-titres</option>
        {subtitleTracks.map((track) => (
          <option key={track.id} value={String(track.id)}>
            {track.title || track.lang || `Piste ${track.id}`}
            {track.codec ? ` (${track.codec})` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
