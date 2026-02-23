import { useEffect, useState } from 'react'
import * as tauri from '@/services/tauri'
import { DEFAULT_SHORTCUT_BINDINGS, type ShortcutAction } from '@/utils/shortcuts'

export function useOverlayShortcutBindings() {
  const [shortcutBindings, setShortcutBindings] = useState<Record<ShortcutAction, string>>({
    ...DEFAULT_SHORTCUT_BINDINGS,
  })

  useEffect(() => {
    tauri.loadUserSettings()
      .then((data) => {
        if (!data || typeof data !== 'object') return
        const settings = data as Record<string, unknown>
        const rawBindings = settings.shortcutBindings
        if (!rawBindings || typeof rawBindings !== 'object') return
        setShortcutBindings({
          ...DEFAULT_SHORTCUT_BINDINGS,
          ...(rawBindings as Record<ShortcutAction, string>),
        })
      })
      .catch(() => {})
  }, [])

  return shortcutBindings
}
