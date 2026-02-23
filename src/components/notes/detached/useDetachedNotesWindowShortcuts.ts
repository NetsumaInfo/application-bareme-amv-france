import { emit } from '@tauri-apps/api/event'
import { buildScreenshotName, captureElementToPngFile } from '@/utils/screenshot'
import { useDetachedNotesShortcuts } from '@/components/notes/detached/useDetachedNotesShortcuts'
import type { MutableRefObject } from 'react'
import type { ClipPayload } from '@/components/notes/detached/types'
import type { Clip } from '@/types/project'
import type { ShortcutAction } from '@/utils/shortcuts'
import * as tauri from '@/services/tauri'

interface UseDetachedNotesWindowShortcutsParams {
  shortcutBindings: Record<ShortcutAction, string>
  clipDataRef: MutableRefObject<ClipPayload | null>
  clipRef: MutableRefObject<Clip | null>
  insertCurrentTimecode: () => Promise<void>
  flushPendingNoteUpdates: () => void
}

export function useDetachedNotesWindowShortcuts({
  shortcutBindings,
  clipDataRef,
  clipRef,
  insertCurrentTimecode,
  flushPendingNoteUpdates,
}: UseDetachedNotesWindowShortcutsParams) {
  useDetachedNotesShortcuts({
    shortcutBindings,
    getClipPayload: () => clipDataRef.current,
    getCurrentClipId: () => clipRef.current?.id,
    insertCurrentTimecode,
    flushPendingNoteUpdates,
    onUndo: () => {
      emit('notes:undo').catch(() => {})
    },
    onNavigateClip: ({ direction, fromClipId }) => {
      emit('notes:navigate-clip', {
        direction,
        fromClipId,
      }).catch(() => {})
    },
    onTogglePause: () => {
      tauri.playerTogglePause().catch(() => {})
    },
    onSeekRelative: (seconds) => {
      tauri.playerSeekRelative(seconds).catch(() => {})
    },
    onSetFullscreen: (value) => {
      tauri.playerSetFullscreen(value).catch(() => {})
    },
    onFrameForward: () => {
      tauri.playerFrameStep().catch(() => {})
    },
    onFrameBack: () => {
      tauri.playerFrameBackStep().catch(() => {})
    },
    onScreenshot: async () => {
      const notesRoot = document.getElementById('root') as HTMLElement | null
      await captureElementToPngFile(
        notesRoot ?? document.documentElement,
        buildScreenshotName('notes-window', clipRef.current?.displayName),
      ).catch(() => {})
    },
    onToggleMiniatures: () => {
      emit('notes:toggle-miniatures').catch(() => {})
    },
    onSetMiniatureFrame: () => {
      emit('notes:set-miniature-frame').catch(() => {})
    },
  })
}
