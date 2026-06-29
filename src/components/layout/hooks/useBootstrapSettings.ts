import { useEffect } from 'react'
import { useUIStore } from '@/store/useUIStore'
import * as tauri from '@/services/tauri'
import { DEFAULT_SHORTCUT_BINDINGS } from '@/utils/shortcuts'
import {
  applyAppearanceToDocument,
  normalizeAppThemePreset,
  normalizePrimaryColorPreset,
} from '@/utils/appTheme'
import { applyLanguageToDocument, normalizeAppLanguage } from '@/i18n/config'
import { OFFICIAL_BAREME, type Bareme } from '@/types/bareme'
import { clampOverlayAutoHideMs } from '@/components/player/overlay/overlayConstants'
import { sanitizeColor } from '@/utils/colors'
import { DEFAULT_SCORE_COLOR_HIGH, DEFAULT_SCORE_COLOR_LOW } from '@/utils/scoreColor'
import type { ShortcutAction } from '@/utils/shortcuts'

type UseBootstrapSettingsParams = {
  loadCustomBaremes: (baremes: Bareme[]) => void
}

export function useBootstrapSettings({ loadCustomBaremes }: UseBootstrapSettingsParams) {
  useEffect(() => {
    tauri.saveBareme(OFFICIAL_BAREME, OFFICIAL_BAREME.id).catch((errorValue) => {
      console.error('Failed to synchronize official bareme:', errorValue)
    })

    tauri.loadBaremes()
      .then((items) => {
        if (Array.isArray(items)) {
          loadCustomBaremes(items as Bareme[])
        }
      })
      .catch((errorValue) => {
        console.error('Failed to load baremes:', errorValue)
      })
  }, [loadCustomBaremes])

  useEffect(() => {
    tauri.loadUserSettings().then((data) => {
      if (data && typeof data === 'object') {
        const settings = data as Record<string, unknown>
        const nextState: Partial<ReturnType<typeof useUIStore.getState>> = {}

        if (typeof settings.showAudioDb === 'boolean') {
          nextState.showAudioDb = settings.showAudioDb
        }
        if (typeof settings.muteOnStart === 'boolean') {
          nextState.muteOnStart = settings.muteOnStart
        }
        if (typeof settings.showTooltips === 'boolean') {
          nextState.showTooltips = settings.showTooltips
        }
        if (typeof settings.confirmClipDeletion === 'boolean') {
          nextState.confirmClipDeletion = settings.confirmClipDeletion
        }
        // Score-color + overlay prefs are written to disk by their setters but
        // were never read back here — that is why they reset on relaunch.
        if (typeof settings.enableScoreColorCoding === 'boolean') {
          nextState.enableScoreColorCoding = settings.enableScoreColorCoding
        }
        if (typeof settings.scoreColorApplyBase === 'boolean') {
          nextState.scoreColorApplyBase = settings.scoreColorApplyBase
        }
        if (typeof settings.scoreColorApplyTotals === 'boolean') {
          nextState.scoreColorApplyTotals = settings.scoreColorApplyTotals
        }
        if (typeof settings.scoreColorHighHex === 'string') {
          nextState.scoreColorHighHex = sanitizeColor(settings.scoreColorHighHex, DEFAULT_SCORE_COLOR_HIGH)
        }
        if (typeof settings.scoreColorLowHex === 'string') {
          nextState.scoreColorLowHex = sanitizeColor(settings.scoreColorLowHex, DEFAULT_SCORE_COLOR_LOW)
        }
        if (typeof settings.overlayAutoHideMs === 'number') {
          nextState.overlayAutoHideMs = clampOverlayAutoHideMs(settings.overlayAutoHideMs)
        }
        if (typeof settings.projectsFolderPath === 'string' && settings.projectsFolderPath.trim()) {
          nextState.projectsFolderPath = settings.projectsFolderPath.trim()
        }
        if (typeof settings.baremesFolderPath === 'string' && settings.baremesFolderPath.trim()) {
          nextState.baremesFolderPath = settings.baremesFolderPath.trim()
        }
        const normalizedAppThemePreset = normalizeAppThemePreset(settings.appTheme)
        if (normalizedAppThemePreset) {
          nextState.appTheme = normalizedAppThemePreset
        }
        const normalizedPrimaryColorPreset = normalizePrimaryColorPreset(settings.primaryColorPreset)
        if (normalizedPrimaryColorPreset) {
          nextState.primaryColorPreset = normalizedPrimaryColorPreset
        }
        const normalizedLanguage = normalizeAppLanguage(settings.language)
        if (normalizedLanguage) {
          nextState.language = normalizedLanguage
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

          nextState.shortcutBindings = merged
          if (migrated) {
            tauri.saveUserSettings({ ...settings, shortcutBindings: merged }).catch(() => {})
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
      }
    }).catch(() => {}).finally(() => {
      // Signals usePlayer that persisted prefs are loaded so it can apply the
      // startup mute/volume and audio-meter state once (not before).
      useUIStore.getState().setSettingsHydrated(true)
    })
  }, [])
}
