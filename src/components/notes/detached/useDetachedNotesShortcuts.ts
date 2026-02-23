import { useEffect } from 'react'
import { normalizeShortcutFromEvent } from '@/utils/shortcuts'

type Direction = 'next' | 'prev'

interface ClipPayloadLike {
  clipIndex: number
  totalClips: number
}

interface DetachedNotesShortcutsOptions {
  shortcutBindings: Record<string, string>
  getClipPayload: () => ClipPayloadLike | null
  getCurrentClipId: () => string | undefined
  insertCurrentTimecode: () => Promise<void>
  flushPendingNoteUpdates: () => void
  onUndo: () => void
  onNavigateClip: (payload: {
    direction: Direction
    fromClipId?: string
  }) => void
  onTogglePause: () => void
  onSeekRelative: (seconds: number) => void
  onSetFullscreen: (value: boolean) => void
  onFrameForward: () => void
  onFrameBack: () => void
  onScreenshot: () => Promise<void>
  onToggleMiniatures: () => void
  onSetMiniatureFrame: () => void
}

export function useDetachedNotesShortcuts({
  shortcutBindings,
  getClipPayload,
  getCurrentClipId,
  insertCurrentTimecode,
  flushPendingNoteUpdates,
  onUndo,
  onNavigateClip,
  onTogglePause,
  onSeekRelative,
  onSetFullscreen,
  onFrameForward,
  onFrameBack,
  onScreenshot,
  onToggleMiniatures,
  onSetMiniatureFrame,
}: DetachedNotesShortcutsOptions) {
  useEffect(() => {
    const onKeyDown = async (event: KeyboardEvent) => {
      const navEvent = event as KeyboardEvent & { __amvClipNavHandled?: boolean }
      const shortcut = normalizeShortcutFromEvent(event)
      if (!shortcut) return

      if (
        event.repeat &&
        (shortcut === shortcutBindings.nextClip || shortcut === shortcutBindings.prevClip)
      ) {
        return
      }

      const target = event.target as HTMLElement | null
      const isTyping = Boolean(
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable),
      )

      if (shortcut === shortcutBindings.insertTimecode) {
        event.preventDefault()
        event.stopPropagation()
        insertCurrentTimecode().catch(() => {})
        return
      }

      if (shortcut === shortcutBindings.undo) {
        event.preventDefault()
        event.stopPropagation()
        flushPendingNoteUpdates()
        onUndo()
        return
      }

      if (isTyping) return

      if (shortcut === shortcutBindings.togglePause) {
        event.preventDefault()
        onTogglePause()
        return
      }
      if (shortcut === shortcutBindings.seekBack) {
        event.preventDefault()
        onSeekRelative(-5)
        return
      }
      if (shortcut === shortcutBindings.seekForward) {
        event.preventDefault()
        onSeekRelative(5)
        return
      }
      if (shortcut === shortcutBindings.seekBackLong) {
        event.preventDefault()
        onSeekRelative(-30)
        return
      }
      if (shortcut === shortcutBindings.seekForwardLong) {
        event.preventDefault()
        onSeekRelative(30)
        return
      }
      if (shortcut === shortcutBindings.nextClip || shortcut === shortcutBindings.prevClip) {
        if (navEvent.__amvClipNavHandled) return
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        navEvent.__amvClipNavHandled = true
        const payload = getClipPayload()
        if (!payload) return
        if (payload.totalClips <= 1) return
        const delta = shortcut === shortcutBindings.nextClip ? 1 : -1
        onNavigateClip({
          direction: delta > 0 ? 'next' : 'prev',
          fromClipId: getCurrentClipId(),
        })
        return
      }
      if (shortcut === shortcutBindings.fullscreen) {
        event.preventDefault()
        onSetFullscreen(true)
        return
      }
      if (shortcut === shortcutBindings.exitFullscreen) {
        event.preventDefault()
        onSetFullscreen(false)
        return
      }
      if (shortcut === shortcutBindings.frameForward) {
        event.preventDefault()
        onFrameForward()
        return
      }
      if (shortcut === shortcutBindings.frameBack) {
        event.preventDefault()
        onFrameBack()
        return
      }
      if (shortcut === shortcutBindings.screenshot) {
        event.preventDefault()
        await onScreenshot().catch(() => {})
        return
      }
      if (shortcut === shortcutBindings.toggleMiniatures) {
        event.preventDefault()
        onToggleMiniatures()
        return
      }
      if (shortcut === shortcutBindings.setMiniatureFrame) {
        event.preventDefault()
        onSetMiniatureFrame()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [
    flushPendingNoteUpdates,
    getClipPayload,
    getCurrentClipId,
    insertCurrentTimecode,
    onFrameBack,
    onFrameForward,
    onNavigateClip,
    onScreenshot,
    onSeekRelative,
    onSetFullscreen,
    onSetMiniatureFrame,
    onToggleMiniatures,
    onTogglePause,
    onUndo,
    shortcutBindings,
  ])
}
