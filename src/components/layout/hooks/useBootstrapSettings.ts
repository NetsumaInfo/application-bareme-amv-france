import { useEffect } from 'react'
import { useUIStore } from '@/store/useUIStore'
import * as tauri from '@/services/tauri'
import { DEFAULT_SHORTCUT_BINDINGS } from '@/utils/shortcuts'
import type { Bareme } from '@/types/bareme'

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
          const merged = { ...DEFAULT_SHORTCUT_BINDINGS, ...(settings.shortcutBindings as Record<string, string>) }
          useUIStore.setState({ shortcutBindings: merged })
        }
      }
    }).catch(() => {})
  }, [])
}
