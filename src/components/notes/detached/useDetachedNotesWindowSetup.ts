import { useEffect } from 'react'
import { emit } from '@tauri-apps/api/event'
import { useUIStore } from '@/store/useUIStore'
import { DEFAULT_SHORTCUT_BINDINGS } from '@/utils/shortcuts'
import {
  applyAppearanceToDocument,
  normalizeAppThemePreset,
  normalizePrimaryColorPreset,
} from '@/utils/appTheme'
import { applyLanguageToDocument, normalizeAppLanguage } from '@/i18n/config'
import * as tauri from '@/services/tauri'

export function useDetachedNotesWindowSetup() {
  useEffect(() => {
    document.documentElement.style.background = 'rgb(var(--color-surface-dark))'
    document.body.style.background = 'rgb(var(--color-surface-dark))'
    document.body.style.color = 'rgb(229 231 235)'
  }, [])

  useEffect(() => {
    const notifyClose = () => {
      emit('notes:close').catch(() => {})
    }
    window.addEventListener('beforeunload', notifyClose)
    window.addEventListener('unload', notifyClose)
    return () => {
      window.removeEventListener('beforeunload', notifyClose)
      window.removeEventListener('unload', notifyClose)
    }
  }, [])

  useEffect(() => {
    tauri.loadUserSettings()
      .then((data) => {
        if (!data || typeof data !== 'object') return
        const settings = data as Record<string, unknown>
        const nextState: Partial<ReturnType<typeof useUIStore.getState>> = {}

        const normalizedTheme = normalizeAppThemePreset(settings.appTheme)
        if (normalizedTheme) {
          nextState.appTheme = normalizedTheme
        }

        const normalizedPrimaryColor = normalizePrimaryColorPreset(settings.primaryColorPreset)
        if (normalizedPrimaryColor) {
          nextState.primaryColorPreset = normalizedPrimaryColor
        }

        const normalizedLanguage = normalizeAppLanguage(settings.language)
        if (normalizedLanguage) {
          nextState.language = normalizedLanguage
        }

        const rawBindings = settings.shortcutBindings
        if (rawBindings && typeof rawBindings === 'object') {
          nextState.shortcutBindings = {
            ...DEFAULT_SHORTCUT_BINDINGS,
            ...(rawBindings as Record<string, string>),
          }
        }

        if (Object.keys(nextState).length > 0) {
          useUIStore.setState(nextState)
        }

        applyAppearanceToDocument(
          nextState.appTheme ?? useUIStore.getState().appTheme,
          nextState.primaryColorPreset ?? useUIStore.getState().primaryColorPreset,
        )
        applyLanguageToDocument(nextState.language ?? useUIStore.getState().language)

        document.documentElement.style.background = 'rgb(var(--color-surface-dark))'
        document.body.style.background = 'rgb(var(--color-surface-dark))'
      })
      .catch(() => {})
  }, [])
}
