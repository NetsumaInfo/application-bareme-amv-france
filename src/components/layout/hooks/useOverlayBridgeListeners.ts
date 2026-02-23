import { useEffect } from 'react'
import { emit, listen } from '@tauri-apps/api/event'
import * as tauri from '@/services/tauri'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import type {
  OverlayFocusMarkerPayload,
  UseOverlayBridgeOptions,
} from '@/components/layout/hooks/overlayBridgeTypes'

interface UseOverlayBridgeListenersParams {
  emitClipInfo: () => void
  emitOverlayMarkers: () => void
  onUndo: UseOverlayBridgeOptions['onUndo']
  onSetCurrentClipMiniatureFrame: UseOverlayBridgeOptions['onSetCurrentClipMiniatureFrame']
  onToggleMiniatures: UseOverlayBridgeOptions['onToggleMiniatures']
}

export function useOverlayBridgeListeners({
  emitClipInfo,
  emitOverlayMarkers,
  onUndo,
  onSetCurrentClipMiniatureFrame,
  onToggleMiniatures,
}: UseOverlayBridgeListenersParams) {
  useEffect(() => {
    let disposed = false
    let unlistenNext: (() => void) | null = null
    let unlistenPrev: (() => void) | null = null
    let unlistenRequest: (() => void) | null = null
    let unlistenMarkersRequest: (() => void) | null = null
    let unlistenFocusNote: (() => void) | null = null
    let unlistenClose: (() => void) | null = null
    let unlistenUndo: (() => void) | null = null
    let unlistenSetMiniature: (() => void) | null = null
    let unlistenToggleMiniatures: (() => void) | null = null

    listen('overlay:next-clip', () => {
      useProjectStore.getState().nextClip()
    }).then((fn) => {
      if (disposed) fn()
      else unlistenNext = fn
    })

    listen('overlay:prev-clip', () => {
      useProjectStore.getState().previousClip()
    }).then((fn) => {
      if (disposed) fn()
      else unlistenPrev = fn
    })

    listen('overlay:request-clip-info', () => {
      emitClipInfo()
    }).then((fn) => {
      if (disposed) fn()
      else unlistenRequest = fn
    })

    listen('overlay:request-note-markers', () => {
      emitOverlayMarkers()
    }).then((fn) => {
      if (disposed) fn()
      else unlistenMarkersRequest = fn
    })

    listen<OverlayFocusMarkerPayload>('overlay:focus-note-marker', (event) => {
      const clipId = event.payload?.clipId
      if (!clipId) return

      const projectStore = useProjectStore.getState()
      const targetIndex = projectStore.clips.findIndex((clip) => clip.id === clipId)
      if (targetIndex >= 0 && targetIndex !== projectStore.currentClipIndex) {
        projectStore.setCurrentClip(targetIndex)
      }

      const detail = {
        clipId,
        seconds: Number(event.payload?.seconds ?? 0),
        category: event.payload?.category ?? null,
        criterionId: event.payload?.criterionId ?? null,
        source: event.payload?.source ?? null,
        raw: event.payload?.raw ?? null,
      }

      window.dispatchEvent(new CustomEvent('amv:focus-note-marker', { detail }))
      emit('main:focus-note-marker', detail).catch(() => {})
    }).then((fn) => {
      if (disposed) fn()
      else unlistenFocusNote = fn
    })

    listen('overlay:close-player', () => {
      useUIStore.getState().setShowPipVideo(false)
      tauri.playerHide().catch(() => {})
    }).then((fn) => {
      if (disposed) fn()
      else unlistenClose = fn
    })

    listen('overlay:undo', () => {
      onUndo()
      useProjectStore.getState().markDirty()
    }).then((fn) => {
      if (disposed) fn()
      else unlistenUndo = fn
    })

    listen('overlay:set-miniature-frame', () => {
      onSetCurrentClipMiniatureFrame().catch(() => {})
    }).then((fn) => {
      if (disposed) fn()
      else unlistenSetMiniature = fn
    })

    listen('overlay:toggle-miniatures', () => {
      onToggleMiniatures()
    }).then((fn) => {
      if (disposed) fn()
      else unlistenToggleMiniatures = fn
    })

    return () => {
      disposed = true
      if (unlistenNext) unlistenNext()
      if (unlistenPrev) unlistenPrev()
      if (unlistenRequest) unlistenRequest()
      if (unlistenMarkersRequest) unlistenMarkersRequest()
      if (unlistenFocusNote) unlistenFocusNote()
      if (unlistenClose) unlistenClose()
      if (unlistenUndo) unlistenUndo()
      if (unlistenSetMiniature) unlistenSetMiniature()
      if (unlistenToggleMiniatures) unlistenToggleMiniatures()
    }
  }, [emitClipInfo, emitOverlayMarkers, onSetCurrentClipMiniatureFrame, onToggleMiniatures, onUndo])
}
