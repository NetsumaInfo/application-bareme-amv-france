import { create } from 'zustand'
import { emit } from '@tauri-apps/api/event'
import type { InterfaceMode, LegacyInterfaceMode, AppTab } from '@/types/notation'
import type { ShortcutAction } from '@/utils/shortcuts'
import { DEFAULT_SHORTCUT_BINDINGS } from '@/utils/shortcuts'
import {
  applyAppearanceToDocument,
  type AppThemePreset,
  type PrimaryColorPreset,
} from '@/utils/appTheme'
import { applyLanguageToDocument, detectSystemLanguage, type AppLanguage } from '@/i18n/config'
import { emitUiSettingsUpdated } from '@/utils/uiSettingsEvents'
import * as tauri from '@/services/tauri'

type ZoomMode = 'fixed' | 'navigable'
const AUDIO_DB_UPDATED_EVENT = 'ui:audio-db-updated'

function readAudioDbPref(): boolean {
  return false
}

function normalizeInterfaceMode(mode: LegacyInterfaceMode): InterfaceMode {
  return mode === 'modern' ? 'notation' : mode
}

interface PersistedUiSettings {
  shortcutBindings?: Record<ShortcutAction, string>
  showAudioDb?: boolean
  confirmClipDeletion?: boolean
  appTheme?: AppThemePreset
  primaryColorPreset?: PrimaryColorPreset
  language?: AppLanguage
  projectsFolderPath?: string | null
  baremesFolderPath?: string | null
}

async function persistUserSettingsPatch(patch: PersistedUiSettings) {
  try {
    const existing = await tauri.loadUserSettings().catch(() => null)
    const base = existing && typeof existing === 'object'
      ? (existing as Record<string, unknown>)
      : {}
    await tauri.saveUserSettings({ ...base, ...patch })
  } catch {
    // Ignore persistence failures to keep UI responsive.
  }
}

function broadcastAudioDbSetting(enabled: boolean) {
  emit(AUDIO_DB_UPDATED_EVENT, { enabled }).catch(() => {})
}

interface UIStore {
  currentTab: AppTab
  currentInterface: InterfaceMode
  hideFinalScore: boolean
  hideAverages: boolean
  hideTextNotes: boolean
  showAudioDb: boolean
  confirmClipDeletion: boolean
  sidebarCollapsed: boolean
  showProjectModal: boolean
  showBaremeEditor: boolean
  requestedBaremeEditorId: string | null
  projectsFolderPath: string | null
  baremesFolderPath: string | null
  showPipVideo: boolean
  zoomLevel: number
  zoomMode: ZoomMode
  appTheme: AppThemePreset
  primaryColorPreset: PrimaryColorPreset
  language: AppLanguage
  shortcutBindings: Record<ShortcutAction, string>
  isNotesDetached: boolean

  switchTab: (tab: AppTab) => void
  switchInterface: (mode: InterfaceMode) => void
  toggleFinalScore: () => void
  toggleAverages: () => void
  toggleTextNotes: () => void
  toggleAudioDb: () => void
  toggleConfirmClipDeletion: () => void
  toggleSidebar: () => void
  setShowProjectModal: (show: boolean) => void
  setShowBaremeEditor: (show: boolean) => void
  setRequestedBaremeEditorId: (baremeId: string | null) => void
  setProjectsFolderPath: (path: string | null) => void
  setProjectsFolderPathPreference: (path: string) => Promise<void>
  setBaremesFolderPath: (path: string | null) => void
  setBaremesFolderPathPreference: (path: string) => Promise<void>
  setShowPipVideo: (show: boolean) => void
  setZoomLevel: (level: number) => void
  setZoomMode: (mode: ZoomMode) => void
  setAppTheme: (theme: AppThemePreset) => void
  setPrimaryColorPreset: (preset: PrimaryColorPreset) => void
  setLanguage: (language: AppLanguage) => void
  setShortcut: (action: ShortcutAction, shortcut: string) => void
  resetShortcuts: () => void
  setNotesDetached: (detached: boolean) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
}

const defaultLanguage = detectSystemLanguage()

export const useUIStore = create<UIStore>((set) => ({
  currentTab: 'notation',
  currentInterface: 'spreadsheet',
  hideFinalScore: false,
  hideAverages: false,
  hideTextNotes: false,
  showAudioDb: readAudioDbPref(),
  confirmClipDeletion: true,
  sidebarCollapsed: false,
  showProjectModal: false,
  showBaremeEditor: false,
  requestedBaremeEditorId: null,
  projectsFolderPath: null,
  baremesFolderPath: null,
  showPipVideo: true,
  zoomLevel: 100,
  zoomMode: 'fixed',
  appTheme: 'midnight',
  primaryColorPreset: 'petrol',
  language: defaultLanguage,
  shortcutBindings: { ...DEFAULT_SHORTCUT_BINDINGS },
  isNotesDetached: false,

  switchTab: (tab) => set({ currentTab: tab }),
  switchInterface: (mode) => set({ currentInterface: normalizeInterfaceMode(mode) }),
  toggleFinalScore: () => set((s) => ({ hideFinalScore: !s.hideFinalScore })),
  toggleAverages: () => set((s) => ({ hideAverages: !s.hideAverages })),
  toggleTextNotes: () => set((s) => ({ hideTextNotes: !s.hideTextNotes })),
  toggleAudioDb: () =>
    set((state) => {
      const next = !state.showAudioDb
      persistUserSettingsPatch({ showAudioDb: next }).catch(() => {})
      broadcastAudioDbSetting(next)
      emitUiSettingsUpdated({ showAudioDb: next })
      return { showAudioDb: next }
    }),
  toggleConfirmClipDeletion: () =>
    set((state) => {
      const next = !state.confirmClipDeletion
      persistUserSettingsPatch({ confirmClipDeletion: next }).catch(() => {})
      emitUiSettingsUpdated({ confirmClipDeletion: next })
      return { confirmClipDeletion: next }
    }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setShowProjectModal: (show) => set({ showProjectModal: show }),
  setShowBaremeEditor: (show) => set((state) => ({
    showBaremeEditor: show,
    requestedBaremeEditorId: show ? state.requestedBaremeEditorId : null,
  })),
  setRequestedBaremeEditorId: (baremeId) => set({ requestedBaremeEditorId: baremeId }),
  setProjectsFolderPath: (path) => set({ projectsFolderPath: path }),
  setProjectsFolderPathPreference: async (path) => {
    const next = path.trim()
    if (!next) return
    await tauri.ensureDirectoryExists(next)
    await persistUserSettingsPatch({ projectsFolderPath: next })
    emitUiSettingsUpdated({ projectsFolderPath: next })
    set({ projectsFolderPath: next })
  },
  setBaremesFolderPath: (path) => set({ baremesFolderPath: path }),
  setBaremesFolderPathPreference: async (path) => {
    const next = path.trim()
    if (!next) return
    await tauri.ensureDirectoryExists(next)
    await persistUserSettingsPatch({ baremesFolderPath: next })
    emitUiSettingsUpdated({ baremesFolderPath: next })
    set({ baremesFolderPath: next })
  },
  setShowPipVideo: (show) => set({ showPipVideo: show }),
  setZoomLevel: (level) => set({ zoomLevel: level }),
  setZoomMode: (mode) => set({ zoomMode: mode }),
  setAppTheme: (theme) =>
    set(() => {
      applyAppearanceToDocument(theme, useUIStore.getState().primaryColorPreset)
      persistUserSettingsPatch({ appTheme: theme }).catch(() => {})
      emitUiSettingsUpdated({ appTheme: theme })
      return { appTheme: theme }
    }),
  setPrimaryColorPreset: (preset) =>
    set(() => {
      applyAppearanceToDocument(useUIStore.getState().appTheme, preset)
      persistUserSettingsPatch({ primaryColorPreset: preset }).catch(() => {})
      emitUiSettingsUpdated({ primaryColorPreset: preset })
      return { primaryColorPreset: preset }
    }),
  setLanguage: (language) =>
    set(() => {
      applyLanguageToDocument(language)
      persistUserSettingsPatch({ language }).catch(() => {})
      emitUiSettingsUpdated({ language })
      return { language }
    }),
  setShortcut: (action, shortcut) =>
    set((state) => {
      const next = { ...state.shortcutBindings, [action]: shortcut }
      persistUserSettingsPatch({ shortcutBindings: next }).catch(() => {})
      emitUiSettingsUpdated({ shortcutBindings: next })
      return { shortcutBindings: next }
    }),
  resetShortcuts: () => {
    persistUserSettingsPatch({ shortcutBindings: { ...DEFAULT_SHORTCUT_BINDINGS } }).catch(() => {})
    emitUiSettingsUpdated({ shortcutBindings: { ...DEFAULT_SHORTCUT_BINDINGS } })
    set({ shortcutBindings: { ...DEFAULT_SHORTCUT_BINDINGS } })
  },
  setNotesDetached: (detached) => set({ isNotesDetached: detached }),
  zoomIn: () => set((s) => ({ zoomLevel: Math.min(200, s.zoomLevel + 10) })),
  zoomOut: () => set((s) => ({ zoomLevel: Math.max(50, s.zoomLevel - 10) })),
  resetZoom: () => set({ zoomLevel: 100 }),
}))

applyAppearanceToDocument('midnight', 'petrol')
applyLanguageToDocument(defaultLanguage)
