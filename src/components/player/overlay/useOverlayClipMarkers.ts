import { useEffect, useState } from 'react'
import { emit, listen } from '@tauri-apps/api/event'
import type { ClipInfo, OverlayTimecodeMarker } from '@/components/player/overlay/types'

interface UseOverlayClipMarkersOptions {
  refreshTracks: () => void
}

export function useOverlayClipMarkers({ refreshTracks }: UseOverlayClipMarkersOptions) {
  const [clipInfo, setClipInfo] = useState<ClipInfo>({ name: '', index: 0, total: 0 })
  const [noteMarkers, setNoteMarkers] = useState<OverlayTimecodeMarker[]>([])
  const [overlayClipId, setOverlayClipId] = useState<string | null>(null)

  useEffect(() => {
    let unlistenClip: (() => void) | null = null
    let unlistenMarkers: (() => void) | null = null

    listen<ClipInfo>('main:clip-changed', (event) => {
      setClipInfo(event.payload)
      refreshTracks()
    }).then((fn) => {
      unlistenClip = fn
    })

    listen<{ clipId?: string | null; markers?: OverlayTimecodeMarker[] }>('main:overlay-markers', (event) => {
      setOverlayClipId(event.payload?.clipId ?? null)
      setNoteMarkers(event.payload?.markers ?? [])
    }).then((fn) => {
      unlistenMarkers = fn
    })

    emit('overlay:request-clip-info').catch(() => {})
    emit('overlay:request-note-markers').catch(() => {})

    return () => {
      if (unlistenClip) unlistenClip()
      if (unlistenMarkers) unlistenMarkers()
    }
  }, [refreshTracks])

  return {
    clipInfo,
    noteMarkers,
    overlayClipId,
  }
}
