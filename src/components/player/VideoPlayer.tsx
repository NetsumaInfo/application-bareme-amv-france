import { useEffect, useState } from 'react'
import { Film } from 'lucide-react'
import PlayerControls from './PlayerControls'
import SubtitleSelector from './SubtitleSelector'
import AudioTrackSelector from './AudioTrackSelector'
import { useProjectStore } from '@/store/useProjectStore'
import { usePlayerStore } from '@/store/usePlayerStore'
import * as tauri from '@/services/tauri'

export default function VideoPlayer() {
  const [mpvAvailable, setMpvAvailable] = useState<boolean | null>(null)
  const { clips, currentClipIndex } = useProjectStore()
  const { isLoaded } = usePlayerStore()
  const currentClip = clips[currentClipIndex]

  useEffect(() => {
    tauri.playerIsAvailable().then(setMpvAvailable).catch(() => setMpvAvailable(false))
  }, [])

  return (
    <div className="flex flex-col gap-2">
      {/* Video area */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center min-h-[200px]">
        {mpvAvailable === false && (
          <div className="text-center p-6">
            <Film size={48} className="mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400 text-sm">
              Lecteur mpv non disponible
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Placez mpv-2.dll dans le dossier de l'application
            </p>
          </div>
        )}
        {mpvAvailable && !isLoaded && !currentClip && (
          <div className="text-center p-6">
            <Film size={48} className="mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400 text-sm">
              Sélectionnez une vidéo pour commencer
            </p>
          </div>
        )}
        {mpvAvailable && isLoaded && currentClip && (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <Film size={32} className="mx-auto mb-2 text-primary-500" />
              <p className="text-gray-300 text-sm font-medium">{currentClip.fileName}</p>
              <p className="text-gray-500 text-xs mt-1">
                Lecture en cours via mpv (fenêtre native)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <PlayerControls />

      {/* Track selectors + clip info */}
      {currentClip && (
        <div className="flex items-center justify-between px-2 py-1 gap-2">
          <div className="flex items-center gap-3">
            <SubtitleSelector />
            <AudioTrackSelector />
          </div>
          <span className="text-xs text-gray-500 shrink-0">
            {currentClipIndex + 1} / {clips.length}
          </span>
        </div>
      )}
    </div>
  )
}
