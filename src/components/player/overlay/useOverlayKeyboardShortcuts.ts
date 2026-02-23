import { useEffect } from 'react'
import { emit } from '@tauri-apps/api/event'
import { formatPreciseTimecode } from '@/utils/formatters'
import {
  normalizeShortcutFromEvent,
  type ShortcutAction,
} from '@/utils/shortcuts'
import * as tauri from '@/services/tauri'

type UseOverlayKeyboardShortcutsParams = {
  shortcutBindings: Record<ShortcutAction, string>
  isPlayerFullscreen: boolean
  clipName: string
  onResetHideTimer: () => void
}

export function useOverlayKeyboardShortcuts({
  shortcutBindings,
  isPlayerFullscreen,
  clipName,
  onResetHideTimer,
}: UseOverlayKeyboardShortcutsParams) {
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const navEvent = e as KeyboardEvent & { __amvClipNavHandled?: boolean }
      const shortcut = normalizeShortcutFromEvent(e)
      if (!shortcut) return

      if (
        e.repeat &&
        (shortcut === shortcutBindings.nextClip || shortcut === shortcutBindings.prevClip)
      ) {
        return
      }

      if (
        shortcut === shortcutBindings.exitFullscreen ||
        shortcut === shortcutBindings.fullscreen
      ) {
        e.preventDefault()
        e.stopPropagation()
        if (shortcut === shortcutBindings.exitFullscreen) {
          tauri.playerSetFullscreen(false).catch(() => {})
        } else {
          tauri.playerSetFullscreen(!isPlayerFullscreen).catch(() => {})
        }
        onResetHideTimer()
        return
      }

      if (shortcut === shortcutBindings.togglePause) {
        e.preventDefault()
        e.stopPropagation()
        tauri.playerTogglePause().catch(() => {})
        onResetHideTimer()
        return
      }

      if (shortcut === shortcutBindings.seekForward) {
        e.preventDefault()
        e.stopPropagation()
        tauri.playerSeekRelative(5).catch(() => {})
        onResetHideTimer()
        return
      }

      if (shortcut === shortcutBindings.seekBack) {
        e.preventDefault()
        e.stopPropagation()
        tauri.playerSeekRelative(-5).catch(() => {})
        onResetHideTimer()
        return
      }

      if (shortcut === shortcutBindings.seekForwardLong) {
        e.preventDefault()
        e.stopPropagation()
        tauri.playerSeekRelative(30).catch(() => {})
        onResetHideTimer()
        return
      }

      if (shortcut === shortcutBindings.seekBackLong) {
        e.preventDefault()
        e.stopPropagation()
        tauri.playerSeekRelative(-30).catch(() => {})
        onResetHideTimer()
        return
      }

      if (shortcut === shortcutBindings.nextClip) {
        if (navEvent.__amvClipNavHandled) return
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        navEvent.__amvClipNavHandled = true
        emit('overlay:next-clip').catch(() => {})
        onResetHideTimer()
        return
      }

      if (shortcut === shortcutBindings.prevClip) {
        if (navEvent.__amvClipNavHandled) return
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        navEvent.__amvClipNavHandled = true
        emit('overlay:prev-clip').catch(() => {})
        onResetHideTimer()
        return
      }

      if (shortcut === shortcutBindings.frameForward) {
        e.preventDefault()
        e.stopPropagation()
        tauri.playerFrameStep().catch(() => {})
        onResetHideTimer()
        return
      }

      if (shortcut === shortcutBindings.frameBack) {
        e.preventDefault()
        e.stopPropagation()
        tauri.playerFrameBackStep().catch(() => {})
        onResetHideTimer()
        return
      }

      if (shortcut === shortcutBindings.screenshot) {
        e.preventDefault()
        e.stopPropagation()
        const status = await tauri.playerGetStatus().catch(() => null)
        const stamp = status
          ? formatPreciseTimecode(status.current_time).replace(/[:.]/g, '-')
          : 'frame'
        const safeName = (clipName || 'clip').replace(/[^\w-]+/g, '_')
        const path = await tauri
          .saveScreenshotDialog(`${safeName}-${stamp}.png`)
          .catch(() => null)
        if (path) {
          await tauri.playerScreenshot(path).catch(() => {})
        }
        onResetHideTimer()
        return
      }

      if (shortcut === shortcutBindings.toggleMiniatures) {
        e.preventDefault()
        e.stopPropagation()
        emit('overlay:toggle-miniatures').catch(() => {})
        onResetHideTimer()
        return
      }

      if (shortcut === shortcutBindings.setMiniatureFrame) {
        e.preventDefault()
        e.stopPropagation()
        emit('overlay:set-miniature-frame').catch(() => {})
        onResetHideTimer()
        return
      }

      if (shortcut === shortcutBindings.undo) {
        e.preventDefault()
        e.stopPropagation()
        emit('overlay:undo').catch(() => {})
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [clipName, isPlayerFullscreen, onResetHideTimer, shortcutBindings])
}
