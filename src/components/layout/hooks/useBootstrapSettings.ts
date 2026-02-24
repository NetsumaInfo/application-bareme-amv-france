import { useEffect } from 'react'
import { useUIStore } from '@/store/useUIStore'
import * as tauri from '@/services/tauri'
import { DEFAULT_SHORTCUT_BINDINGS } from '@/utils/shortcuts'
import type { Bareme } from '@/types/bareme'
import type { ShortcutAction } from '@/utils/shortcuts'

type UseBootstrapSettingsParams = {
  loadCustomBaremes: (baremes: Bareme[]) => void
}

export function useBootstrapSettings({ loadCustomBaremes }: UseBootstrapSettingsParams) {
  useEffect(() => {
    tauri.loadBaremes()
      .then((items) => {
        if (Array.isArray(items)) {
          loadCustomBaremes(items as Bareme[])
        }
      })
      .catch(() => {})
  }, [loadCustomBaremes])

  useEffect(() => {
    tauri.loadUserSettings().then((data) => {
      if (data && typeof data === 'object') {
        const settings = data as Record<string, unknown>
        if (typeof settings.showAudioDb === 'boolean') {
          useUIStore.setState({ showAudioDb: settings.showAudioDb })
        }
        if (settings.shortcutBindings && typeof settings.shortcutBindings === 'object') {
          const rawBindings = settings.shortcutBindings as Record<string, string>
          const merged = { ...DEFAULT_SHORTCUT_BINDINGS, ...rawBindings } as Record<ShortcutAction, string>
          let migrated = false

          if (!Object.prototype.hasOwnProperty.call(rawBindings, 'saveAs') || merged.saveAs === 'ctrl+alt+s') {
            merged.saveAs = 'ctrl+shift+s'
            migrated = true
          }
          if (!Object.prototype.hasOwnProperty.call(rawBindings, 'screenshot') || merged.screenshot === 'ctrl+shift+s') {
            merged.screenshot = 'ctrl+shift+g'
            migrated = true
          }

          useUIStore.setState({ shortcutBindings: merged })
          if (migrated) {
            tauri.saveUserSettings({ ...settings, shortcutBindings: merged }).catch(() => {})
          }
        }
      }
    }).catch(() => {})
  }, [])
}
