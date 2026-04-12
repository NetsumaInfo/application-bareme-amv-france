import { emit } from '@tauri-apps/api/event'
import type { AppLanguage } from '@/i18n/config'
import type { ShortcutAction } from '@/utils/shortcuts'
import type { AppThemePreset, PrimaryColorPreset } from '@/utils/appTheme'

export const UI_SETTINGS_UPDATED_EVENT = 'ui:settings-updated'

export interface UiSettingsUpdatePayload {
  appTheme?: AppThemePreset
  primaryColorPreset?: PrimaryColorPreset
  language?: AppLanguage
  showAudioDb?: boolean
  confirmClipDeletion?: boolean
  projectsFolderPath?: string
  baremesFolderPath?: string
  shortcutBindings?: Record<ShortcutAction, string>
}

export function emitUiSettingsUpdated(patch: UiSettingsUpdatePayload) {
  emit(UI_SETTINGS_UPDATED_EVENT, patch).catch(() => {})
}
