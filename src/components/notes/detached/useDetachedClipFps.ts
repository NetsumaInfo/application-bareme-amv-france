import { useEffect, useState } from 'react'
import type { Clip } from '@/types/project'
import * as tauri from '@/services/tauri'

export function useDetachedClipFps(clip: Clip | null) {
  const [clipFps, setClipFps] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    if (!clip?.filePath) {
      return () => {
        active = false
      }
    }

    tauri.playerGetMediaInfo(clip.filePath)
      .then((info) => {
        if (!active) return
        const fps = Number(info?.fps)
        setClipFps(Number.isFinite(fps) && fps > 0 ? fps : null)
      })
      .catch(() => {
        if (!active) return
        setClipFps(null)
      })

    return () => {
      active = false
    }
  }, [clip?.id, clip?.filePath])

  return clipFps
}
