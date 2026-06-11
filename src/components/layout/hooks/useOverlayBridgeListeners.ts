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
    let active = true
    const unlisteners: Array<() => void> = []

    const register = async () => {
      const offs = await Promise.all([
        listen('overlay:next-clip', () => {
          useProjectStore.getState().nextClip()
        }),

        listen('overlay:prev-clip', () => {
          useProjectStore.getState().previousClip()
        }),

        listen('overlay:request-clip-info', () => {
          emitClipInfo()
        }),

        listen('overlay:request-note-markers', () => {
          emitOverlayMarkers()
        }),

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
        }),

        listen('overlay:close-player', () => {
          useUIStore.getState().setShowPipVideo(false)
          tauri.playerHide().catch(() => {})
        }),

        listen('overlay:undo', () => {
          onUndo()
          useProjectStore.getState().markDirty()
        }),

        listen('overlay:set-miniature-frame', () => {
          onSetCurrentClipMiniatureFrame().catch(() => {})
        }),

        listen('overlay:toggle-miniatures', () => {
          onToggleMiniatures()
        }),
      ])

      if (!active) {
        offs.forEach((off) => off())
        return
      }
      unlisteners.push(...offs)
    }

    register()

    return () => {
      active = false
      unlisteners.forEach((off) => off())
    }
  }, [emitClipInfo, emitOverlayMarkers, onSetCurrentClipMiniatureFrame, onToggleMiniatures, onUndo])
}
