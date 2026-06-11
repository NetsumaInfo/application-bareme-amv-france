import { useEffect, useReducer } from 'react'
import { emit, listen } from '@tauri-apps/api/event'
import type { ClipInfo, OverlayTimecodeMarker } from '@/components/player/overlay/types'

interface UseOverlayClipMarkersOptions {
  refreshTracks: () => void
}

interface OverlayClipState {
  clipInfo: ClipInfo
  noteMarkers: OverlayTimecodeMarker[]
  overlayClipId: string | null
}

type OverlayClipAction =
  | { type: 'clip-info'; clipInfo: ClipInfo }
  | { type: 'markers'; overlayClipId: string | null; noteMarkers: OverlayTimecodeMarker[] }

const INITIAL_STATE: OverlayClipState = {
  clipInfo: { name: '', index: 0, total: 0 },
  noteMarkers: [],
  overlayClipId: null,
}

function overlayClipReducer(state: OverlayClipState, action: OverlayClipAction): OverlayClipState {
  switch (action.type) {
    case 'clip-info':
      return { ...state, clipInfo: action.clipInfo }
    case 'markers':
      return { ...state, overlayClipId: action.overlayClipId, noteMarkers: action.noteMarkers }
    default:
      return state
  }
}

export function useOverlayClipMarkers({ refreshTracks }: UseOverlayClipMarkersOptions) {
  const [state, dispatch] = useReducer(overlayClipReducer, INITIAL_STATE)

  useEffect(() => {
    let unlistenClip: (() => void) | null = null
    let unlistenMarkers: (() => void) | null = null

    listen<ClipInfo>('main:clip-changed', (event) => {
      dispatch({ type: 'clip-info', clipInfo: event.payload })
      refreshTracks()
    }).then((fn) => {
      unlistenClip = fn
    })

    listen<{ clipId?: string | null; markers?: OverlayTimecodeMarker[] }>('main:overlay-markers', (event) => {
      dispatch({
        type: 'markers',
        overlayClipId: event.payload?.clipId ?? null,
        noteMarkers: event.payload?.markers ?? [],
      })
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
    clipInfo: state.clipInfo,
    noteMarkers: state.noteMarkers,
    overlayClipId: state.overlayClipId,
  }
}
