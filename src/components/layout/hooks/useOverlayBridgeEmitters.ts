import { useCallback, useEffect, useRef } from 'react'
import { emit } from '@tauri-apps/api/event'
import * as tauri from '@/services/tauri'
import { buildNoteTimecodeMarkers } from '@/utils/timecodes'
import { getClipPrimaryLabel } from '@/utils/formatters'
import { getSortedClipPosition } from '@/utils/clipOrder'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import type { UseOverlayBridgeOptions } from '@/components/layout/hooks/overlayBridgeTypes'

interface UseOverlayBridgeEmittersParams {
  clips: UseOverlayBridgeOptions['clips']
  currentClipIndex: number
  currentProject: UseOverlayBridgeOptions['currentProject']
  notes: unknown
  currentBareme: unknown
  isFullscreen: boolean
  isDetached: boolean
}

export function useOverlayBridgeEmitters({
  clips,
  currentClipIndex,
  currentProject,
  notes,
  currentBareme,
  isFullscreen,
  isDetached,
}: UseOverlayBridgeEmittersParams) {
  const overlayFpsHintRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    let active = true
    const clip = clips[currentClipIndex]
    if (!clip?.filePath) {
      overlayFpsHintRef.current = undefined
      return () => {
        active = false
      }
    }

    tauri.playerGetMediaInfo(clip.filePath)
      .then((info) => {
        if (!active) return
        const fps = Number(info?.fps)
        overlayFpsHintRef.current = Number.isFinite(fps) && fps > 0 ? fps : undefined
      })
      .catch(() => {
        if (!active) return
        overlayFpsHintRef.current = undefined
      })

    return () => {
      active = false
    }
  }, [clips, currentClipIndex])

  const emitClipInfo = useCallback(() => {
    const { clips: allClips, currentClipIndex: idx, currentProject: project } = useProjectStore.getState()
    const clip = allClips[idx]
    const sortedPosition = getSortedClipPosition(allClips, idx)
    emit('main:clip-changed', {
      name: clip ? getClipPrimaryLabel(clip) : '',
      index: sortedPosition >= 0 ? sortedPosition : idx,
      total: allClips.length,
      hasVideo: Boolean(clip?.filePath),
      miniaturesEnabled: project?.settings.showMiniatures ?? false,
    }).catch(() => {})
  }, [])

  const emitOverlayMarkers = useCallback(() => {
    const { clips: allClips, currentClipIndex: idx } = useProjectStore.getState()
    const clip = allClips[idx] ?? null
    const bareme = useNotationStore.getState().currentBareme
    const note = clip ? useNotationStore.getState().getNoteForClip(clip.id) : null
    const markers = buildNoteTimecodeMarkers(note, bareme, undefined, overlayFpsHintRef.current)
      .slice(0, 120)
      .map((marker) => ({
        key: marker.key,
        raw: marker.raw,
        seconds: marker.seconds,
        color: marker.color,
        previewText: marker.previewText,
        source: marker.source,
        category: marker.category ?? null,
        criterionId: marker.criterionId ?? null,
      }))

    emit('main:overlay-markers', {
      clipId: clip?.id ?? null,
      markers,
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (isFullscreen || isDetached) {
      emitClipInfo()
      emitOverlayMarkers()
    }
  }, [
    clips.length,
    currentClipIndex,
    currentProject?.settings.showMiniatures,
    emitClipInfo,
    emitOverlayMarkers,
    isDetached,
    isFullscreen,
  ])

  useEffect(() => {
    if (!(isFullscreen || isDetached)) return
    emitOverlayMarkers()
  }, [isFullscreen, isDetached, currentClipIndex, notes, currentBareme, emitOverlayMarkers])

  return {
    emitClipInfo,
    emitOverlayMarkers,
  }
}
