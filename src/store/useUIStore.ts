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
import {
  clampOverlayAutoHideMs,
  OVERLAY_AUTOHIDE_MS,
} from '@/components/player/overlay/overlayConstants'
import { DEFAULT_SCORE_COLOR_HIGH, DEFAULT_SCORE_COLOR_LOW } from '@/utils/scoreColor'
import { sanitizeColor } from '@/utils/colors'
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
  muteOnStart?: boolean
  showTooltips?: boolean
  confirmClipDeletion?: boolean
  appTheme?: AppThemePreset
  primaryColorPreset?: PrimaryColorPreset
  language?: AppLanguage
  projectsFolderPath?: string | null
  baremesFolderPath?: string | null
  enableScoreColorCoding?: boolean
  scoreColorApplyBase?: boolean
  scoreColorApplyTotals?: boolean
  scoreColorHighHex?: string
  scoreColorLowHex?: string
  overlayAutoHideMs?: number
}

async function flushPendingSettings() {
  if (!pendingSettings) return
  const patch = pendingSettings
  pendingSettings = null
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

// Coalesces rapid UI setter writes into a single debounced disk save.
// Only the disk write is debounced; cross-window broadcasts stay immediate.
let pendingSettings: PersistedUiSettings | null = null
let persistTimer: ReturnType<typeof setTimeout> | null = null
const PERSIST_DEBOUNCE_MS = 400

function persistUserSettingsPatch(patch: PersistedUiSettings) {
  pendingSettings = { ...(pendingSettings ?? {}), ...patch }
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    persistTimer = null
    void flushPendingSettings()
  }, PERSIST_DEBOUNCE_MS)
  return Promise.resolve()
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (persistTimer) {
      clearTimeout(persistTimer)
      persistTimer = null
    }
    void flushPendingSettings()
  })
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
  muteOnStart: boolean
  settingsHydrated: boolean
  showTooltips: boolean
  confirmClipDeletion: boolean
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
  enableScoreColorCoding: boolean
  scoreColorApplyBase: boolean
  scoreColorApplyTotals: boolean
  scoreColorHighHex: string
  scoreColorLowHex: string
  overlayAutoHideMs: number

  switchTab: (tab: AppTab) => void
  switchInterface: (mode: InterfaceMode) => void
  toggleFinalScore: () => void
  toggleAverages: () => void
  toggleTextNotes: () => void
  toggleAudioDb: () => void
  toggleMuteOnStart: () => void
  setSettingsHydrated: (hydrated: boolean) => void
  toggleShowTooltips: () => void
  toggleConfirmClipDeletion: () => void
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
  toggleScoreColorCoding: () => void
  toggleScoreColorBase: () => void
  toggleScoreColorTotals: () => void
  setScoreColorHigh: (hex: string) => void
  setScoreColorLow: (hex: string) => void
  setOverlayAutoHideMs: (ms: number) => void
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
  muteOnStart: true,
  settingsHydrated: false,
  showTooltips: false,
  confirmClipDeletion: true,
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
  enableScoreColorCoding: false,
  scoreColorApplyBase: true,
  scoreColorApplyTotals: true,
  scoreColorHighHex: DEFAULT_SCORE_COLOR_HIGH,
  scoreColorLowHex: DEFAULT_SCORE_COLOR_LOW,
  overlayAutoHideMs: OVERLAY_AUTOHIDE_MS,

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
      // Apply the astats audio filter live. Kept opt-in so audio is never
      // dropped by default on the stripped FFmpeg build.
      tauri.playerSetAudioMeter(next).catch(() => {})
      return { showAudioDb: next }
    }),
  toggleMuteOnStart: () =>
    set((state) => {
      const next = !state.muteOnStart
      persistUserSettingsPatch({ muteOnStart: next }).catch(() => {})
      return { muteOnStart: next }
    }),
  setSettingsHydrated: (hydrated) => set({ settingsHydrated: hydrated }),
  toggleShowTooltips: () =>
    set((state) => {
      const next = !state.showTooltips
      persistUserSettingsPatch({ showTooltips: next }).catch(() => {})
      emitUiSettingsUpdated({ showTooltips: next })
      return { showTooltips: next }
    }),
  toggleConfirmClipDeletion: () =>
    set((state) => {
      const next = !state.confirmClipDeletion
      persistUserSettingsPatch({ confirmClipDeletion: next }).catch(() => {})
      emitUiSettingsUpdated({ confirmClipDeletion: next })
      return { confirmClipDeletion: next }
    }),
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
  toggleScoreColorCoding: () =>
    set((state) => {
      const next = !state.enableScoreColorCoding
      persistUserSettingsPatch({ enableScoreColorCoding: next }).catch(() => {})
      emitUiSettingsUpdated({ enableScoreColorCoding: next })
      return { enableScoreColorCoding: next }
    }),
  toggleScoreColorBase: () =>
    set((state) => {
      const next = !state.scoreColorApplyBase
      persistUserSettingsPatch({ scoreColorApplyBase: next }).catch(() => {})
      emitUiSettingsUpdated({ scoreColorApplyBase: next })
      return { scoreColorApplyBase: next }
    }),
  toggleScoreColorTotals: () =>
    set((state) => {
      const next = !state.scoreColorApplyTotals
      persistUserSettingsPatch({ scoreColorApplyTotals: next }).catch(() => {})
      emitUiSettingsUpdated({ scoreColorApplyTotals: next })
      return { scoreColorApplyTotals: next }
    }),
  setScoreColorHigh: (hex) =>
    set(() => {
      const next = sanitizeColor(hex, DEFAULT_SCORE_COLOR_HIGH)
      persistUserSettingsPatch({ scoreColorHighHex: next }).catch(() => {})
      emitUiSettingsUpdated({ scoreColorHighHex: next })
      return { scoreColorHighHex: next }
    }),
  setScoreColorLow: (hex) =>
    set(() => {
      const next = sanitizeColor(hex, DEFAULT_SCORE_COLOR_LOW)
      persistUserSettingsPatch({ scoreColorLowHex: next }).catch(() => {})
      emitUiSettingsUpdated({ scoreColorLowHex: next })
      return { scoreColorLowHex: next }
    }),
  setOverlayAutoHideMs: (ms) =>
    set(() => {
      const next = clampOverlayAutoHideMs(ms)
      persistUserSettingsPatch({ overlayAutoHideMs: next }).catch(() => {})
      emitUiSettingsUpdated({ overlayAutoHideMs: next })
      return { overlayAutoHideMs: next }
    }),
  zoomIn: () => set((s) => ({ zoomLevel: Math.min(200, s.zoomLevel + 10) })),
  zoomOut: () => set((s) => ({ zoomLevel: Math.max(50, s.zoomLevel - 10) })),
  resetZoom: () => set({ zoomLevel: 100 }),
}))

applyAppearanceToDocument('midnight', 'petrol')
applyLanguageToDocument(defaultLanguage)
