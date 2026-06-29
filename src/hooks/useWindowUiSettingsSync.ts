import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import * as tauri from '@/services/tauri'
import { useUIStore } from '@/store/useUIStore'
import { DEFAULT_SHORTCUT_BINDINGS } from '@/utils/shortcuts'
import { applyLanguageToDocument, normalizeAppLanguage } from '@/i18n/config'
import {
  applyAppearanceToDocument,
  normalizeAppThemePreset,
  normalizePrimaryColorPreset,
} from '@/utils/appTheme'
import { UI_SETTINGS_UPDATED_EVENT, type UiSettingsUpdatePayload } from '@/utils/uiSettingsEvents'
import { sanitizeColor } from '@/utils/colors'
import { DEFAULT_SCORE_COLOR_HIGH, DEFAULT_SCORE_COLOR_LOW } from '@/utils/scoreColor'
import { clampOverlayAutoHideMs } from '@/components/player/overlay/overlayConstants'

type SyncedUiState = Pick<
  ReturnType<typeof useUIStore.getState>,
  | 'appTheme'
  | 'primaryColorPreset'
  | 'language'
  | 'showAudioDb'
  | 'showTooltips'
  | 'confirmClipDeletion'
  | 'shortcutBindings'
  | 'enableScoreColorCoding'
  | 'scoreColorApplyBase'
  | 'scoreColorApplyTotals'
  | 'scoreColorHighHex'
  | 'scoreColorLowHex'
  | 'overlayAutoHideMs'
>

function extractUiSettingsPatch(input: unknown): Partial<SyncedUiState> {
  if (!input || typeof input !== 'object') {
    return {}
  }

  const settings = input as Record<string, unknown>
  const nextState: Partial<SyncedUiState> = {}

  if (typeof settings.showAudioDb === 'boolean') {
    nextState.showAudioDb = settings.showAudioDb
  }

  if (typeof settings.showTooltips === 'boolean') {
    nextState.showTooltips = settings.showTooltips
  }

  if (typeof settings.confirmClipDeletion === 'boolean') {
    nextState.confirmClipDeletion = settings.confirmClipDeletion
  }

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

  if (settings.shortcutBindings && typeof settings.shortcutBindings === 'object') {
    nextState.shortcutBindings = {
      ...DEFAULT_SHORTCUT_BINDINGS,
      ...(settings.shortcutBindings as Record<string, string>),
    } as SyncedUiState['shortcutBindings']
  }

  return nextState
}

function applyUiSettingsPatch(nextState: Partial<SyncedUiState>) {
  const hasPatch = Object.keys(nextState).length > 0
  if (hasPatch) {
    useUIStore.setState(nextState)
  }

  const state = useUIStore.getState()
  applyAppearanceToDocument(
    nextState.appTheme ?? state.appTheme,
    nextState.primaryColorPreset ?? state.primaryColorPreset,
  )
  applyLanguageToDocument(nextState.language ?? state.language)
}

export function useWindowUiSettingsSync() {
  useEffect(() => {
    tauri.loadUserSettings()
      .then((data) => {
        applyUiSettingsPatch(extractUiSettingsPatch(data))
      })
      .catch(() => {})

    let unlisten: (() => void) | null = null
    listen<UiSettingsUpdatePayload>(UI_SETTINGS_UPDATED_EVENT, (event) => {
      applyUiSettingsPatch(extractUiSettingsPatch(event.payload))
    })
      .then((off) => {
        unlisten = off
      })
      .catch(() => {})

    return () => {
      if (unlisten) {
        unlisten()
      }
    }
  }, [])
}
