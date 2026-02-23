import { useCallback, useEffect } from 'react'
import { emit, listen } from '@tauri-apps/api/event'
import * as tauri from '@/services/tauri'
import { useNotationStore } from '@/store/useNotationStore'
import { usePlayerStore } from '@/store/usePlayerStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import { getSortedClipPosition } from '@/utils/clipOrder'

interface UseNotesBridgeOptions {
  isNotesDetached: boolean
  clips: Array<{ id: string; filePath?: string }>
  currentClipIndex: number
  notes: unknown
  currentProject: {
    settings: {
      hideTotals?: boolean
      hideFinalScoreUntilEnd?: boolean
    }
  } | null
  hideFinalScore: boolean
  onUndo: () => void
  onSetCurrentClipMiniatureFrame: () => Promise<void>
  onToggleMiniatures: () => void
}

export function useNotesBridge({
  isNotesDetached,
  clips,
  currentClipIndex,
  notes,
  currentProject,
  hideFinalScore,
  onUndo,
  onSetCurrentClipMiniatureFrame,
  onToggleMiniatures,
}: UseNotesBridgeOptions) {
  const emitNotesClipData = useCallback(() => {
    const projectStore = useProjectStore.getState()
    const { clips: allClips, currentClipIndex: idx, currentProject: project } = projectStore
    const clip = allClips[idx] ?? null
    const sortedPosition = getSortedClipPosition(allClips, idx)
    const bareme = useNotationStore.getState().currentBareme
    const note = clip ? useNotationStore.getState().getNoteForClip(clip.id) : null
    const allClipsScored = allClips.length > 0 && allClips.every((item) => item.scored)
    const hideTotalsSetting = Boolean(project?.settings.hideTotals)
    const hideTotalsUntilAllScored = Boolean(project?.settings.hideFinalScoreUntilEnd) && !allClipsScored
    const hideTotals = Boolean(useUIStore.getState().hideFinalScore) || hideTotalsSetting || hideTotalsUntilAllScored
    emit('main:clip-data', {
      clip,
      bareme,
      note,
      clipIndex: sortedPosition >= 0 ? sortedPosition : idx,
      totalClips: allClips.length,
      hideTotals,
    }).catch(() => {})
  }, [])

  useEffect(() => {
    let disposed = false
    const unlisteners: (() => void)[] = []
    const pushUnlisten = (fn: () => void) => {
      if (disposed) {
        fn()
        return
      }
      unlisteners.push(fn)
    }

    listen('notes:request-data', () => {
      emitNotesClipData()
    }).then(pushUnlisten)

    listen<{ clipId: string; criterionId: string; value: number | string }>('notes:criterion-updated', (event) => {
      const { clipId, criterionId, value } = event.payload
      useNotationStore.getState().updateCriterion(clipId, criterionId, value as number)
      useProjectStore.getState().markDirty()
    }).then(pushUnlisten)

    listen<{ clipId: string; text: string }>('notes:text-notes-updated', (event) => {
      const { clipId, text } = event.payload
      useNotationStore.getState().setTextNotes(clipId, text)
      useProjectStore.getState().markDirty()
    }).then(pushUnlisten)

    listen<{ clipId: string; category: string; text: string }>('notes:category-note-updated', (event) => {
      const { clipId, category, text } = event.payload
      useNotationStore.getState().setCategoryNote(clipId, category, text)
      useProjectStore.getState().markDirty()
    }).then(pushUnlisten)

    listen<{ clipId: string; criterionId: string; text: string }>('notes:criterion-note-updated', (event) => {
      const { clipId, criterionId, text } = event.payload
      useNotationStore.getState().setCriterionNote(clipId, criterionId, text)
      useProjectStore.getState().markDirty()
    }).then(pushUnlisten)

    listen<{ direction?: 'next' | 'prev'; fromClipId?: string }>('notes:navigate-clip', (event) => {
      const store = useProjectStore.getState()
      const direction = event.payload.direction === 'prev' ? 'prev' : 'next'

      if (direction === 'prev') {
        store.previousClip()
      } else {
        store.nextClip()
      }
    }).then(pushUnlisten)

    listen('notes:undo', () => {
      onUndo()
      useProjectStore.getState().markDirty()
    }).then(pushUnlisten)

    listen('notes:open-player', () => {
      const store = useProjectStore.getState()
      const clip = store.clips[store.currentClipIndex]
      if (!clip?.filePath) return
      useUIStore.getState().setShowPipVideo(true)
      tauri.playerShow().catch(() => {})
    }).then(pushUnlisten)

    listen('notes:set-miniature-frame', () => {
      onSetCurrentClipMiniatureFrame().catch(() => {})
    }).then(pushUnlisten)

    listen('notes:toggle-miniatures', () => {
      onToggleMiniatures()
    }).then(pushUnlisten)

    listen<{
      clipId?: string
      seconds?: number
      category?: string | null
      criterionId?: string | null
    }>('notes:timecode-jump', (event) => {
      const clipId = event.payload?.clipId
      const seconds = Number(event.payload?.seconds ?? NaN)
      if (!clipId || !Number.isFinite(seconds) || seconds < 0) return

      const store = useProjectStore.getState()
      const index = store.clips.findIndex((clip) => clip.id === clipId)
      if (index < 0) return
      const clip = store.clips[index]
      if (!clip?.filePath) return

      if (store.currentClipIndex !== index) {
        store.setCurrentClip(index)
      }
      useUIStore.getState().setShowPipVideo(true)

      const goToTimecode = async () => {
        const playerState = usePlayerStore.getState()
        if (!playerState.isLoaded || playerState.currentFilePath !== clip.filePath) {
          playerState.setLoaded(false)
          await tauri.playerLoad(clip.filePath)
          playerState.setLoaded(true, clip.filePath)
          await tauri.playerShow().catch(() => {})
        }
        await tauri.playerSeek(seconds).catch(() => {})
        await tauri.playerPause().catch(() => {})
      }

      goToTimecode().catch(() => {})

      const detail = {
        clipId,
        seconds,
        category: event.payload?.category ?? null,
        criterionId: event.payload?.criterionId ?? null,
      }
      window.dispatchEvent(new CustomEvent('amv:focus-note-marker', { detail }))
      emit('main:focus-note-marker', detail).catch(() => {})
    }).then(pushUnlisten)

    listen('notes:close', () => {
      const ui = useUIStore.getState()
      ui.setNotesDetached(false)
      if (ui.currentInterface === 'dual') {
        ui.switchInterface('spreadsheet')
      }
    }).then(pushUnlisten)

    return () => {
      disposed = true
      unlisteners.forEach((fn) => fn())
    }
  }, [emitNotesClipData, onSetCurrentClipMiniatureFrame, onToggleMiniatures, onUndo])

  useEffect(() => {
    if (!isNotesDetached) return
    emitNotesClipData()
  }, [
    isNotesDetached,
    currentClipIndex,
    clips.length,
    notes,
    emitNotesClipData,
    currentProject?.settings.hideTotals,
    currentProject?.settings.hideFinalScoreUntilEnd,
    hideFinalScore,
  ])

  useEffect(() => {
    if (!isNotesDetached) return
    const clip = clips[currentClipIndex]
    if (!clip) return
    const note = useNotationStore.getState().getNoteForClip(clip.id) ?? null
    emit('main:note-updated', { note }).catch(() => {})
  }, [isNotesDetached, clips, currentClipIndex, notes])
}
