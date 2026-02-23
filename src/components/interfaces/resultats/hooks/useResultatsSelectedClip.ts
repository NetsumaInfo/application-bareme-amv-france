import { useEffect, useMemo, useState } from 'react'
import * as tauri from '@/services/tauri'
import type { Clip } from '@/types/project'

interface UseResultatsSelectedClipOptions {
  sortedClips: Clip[]
}

export function useResultatsSelectedClip({ sortedClips }: UseResultatsSelectedClipOptions) {
  const [selectedClipIdState, setSelectedClipIdState] = useState<string | null>(null)
  const [selectedClipFps, setSelectedClipFps] = useState<number | null>(null)

  const selectedClipId = useMemo(
    () => {
      if (selectedClipIdState && sortedClips.some((clip) => clip.id === selectedClipIdState)) {
        return selectedClipIdState
      }
      return sortedClips[0]?.id ?? null
    },
    [selectedClipIdState, sortedClips],
  )

  const selectedClip = useMemo(
    () => sortedClips.find((clip) => clip.id === selectedClipId) ?? sortedClips[0],
    [selectedClipId, sortedClips],
  )

  useEffect(() => {
    let active = true
    if (!selectedClip?.filePath) {
      return () => {
        active = false
      }
    }

    tauri.playerGetMediaInfo(selectedClip.filePath)
      .then((info) => {
        if (!active) return
        const fps = Number(info?.fps)
        setSelectedClipFps(Number.isFinite(fps) && fps > 0 ? fps : null)
      })
      .catch(() => {
        if (!active) return
        setSelectedClipFps(null)
      })

    return () => {
      active = false
    }
  }, [selectedClip?.id, selectedClip?.filePath])

  return {
    selectedClipId,
    selectedClip,
    selectedClipFps,
    setSelectedClipId: setSelectedClipIdState,
  }
}
