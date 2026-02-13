import { create } from 'zustand'
import type { InterfaceMode, AppTab } from '@/types/notation'
import type { ShortcutAction } from '@/utils/shortcuts'
import { DEFAULT_SHORTCUT_BINDINGS } from '@/utils/shortcuts'
import * as tauri from '@/services/tauri'

type ZoomMode = 'fixed' | 'navigable'

function readAudioDbPref(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem('amv.showAudioDb') === '1'
}

function writeAudioDbPref(show: boolean): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('amv.showAudioDb', show ? '1' : '0')
  window.dispatchEvent(new CustomEvent('amv:audio-db-changed', { detail: show }))
}

function normalizeInterfaceMode(mode: InterfaceMode): InterfaceMode {
  return mode === 'modern' ? 'notation' : mode
}

interface UIStore {
  currentTab: AppTab
  currentInterface: InterfaceMode
  hideFinalScore: boolean
  hideAverages: boolean
  hideTextNotes: boolean
  showAudioDb: boolean
  sidebarCollapsed: boolean
  showProjectModal: boolean
  showBaremeEditor: boolean
  projectsFolderPath: string | null
  showPipVideo: boolean
  zoomLevel: number
  zoomMode: ZoomMode
  shortcutBindings: Record<ShortcutAction, string>
  isNotesDetached: boolean

  switchTab: (tab: AppTab) => void
  switchInterface: (mode: InterfaceMode) => void
  toggleFinalScore: () => void
  toggleAverages: () => void
  toggleTextNotes: () => void
  toggleAudioDb: () => void
  toggleSidebar: () => void
  setShowProjectModal: (show: boolean) => void
  setShowBaremeEditor: (show: boolean) => void
  setProjectsFolderPath: (path: string) => void
  setShowPipVideo: (show: boolean) => void
  setZoomLevel: (level: number) => void
  setZoomMode: (mode: ZoomMode) => void
  setShortcut: (action: ShortcutAction, shortcut: string) => void
  resetShortcuts: () => void
  setNotesDetached: (detached: boolean) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  currentTab: 'notation',
  currentInterface: 'spreadsheet',
  hideFinalScore: false,
  hideAverages: false,
  hideTextNotes: false,
  showAudioDb: readAudioDbPref(),
  sidebarCollapsed: false,
  showProjectModal: false,
  showBaremeEditor: false,
  projectsFolderPath: null,
  showPipVideo: true,
  zoomLevel: 100,
  zoomMode: 'fixed',
  shortcutBindings: { ...DEFAULT_SHORTCUT_BINDINGS },
  isNotesDetached: false,

  switchTab: (tab) => set({ currentTab: tab }),
  switchInterface: (mode) => set({ currentInterface: normalizeInterfaceMode(mode) }),
  toggleFinalScore: () => set((s) => ({ hideFinalScore: !s.hideFinalScore })),
  toggleAverages: () => set((s) => ({ hideAverages: !s.hideAverages })),
  toggleTextNotes: () => set((s) => ({ hideTextNotes: !s.hideTextNotes })),
  toggleAudioDb: () =>
    set((s) => {
      const next = !s.showAudioDb
      writeAudioDbPref(next)
      return { showAudioDb: next }
    }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setShowProjectModal: (show) => set({ showProjectModal: show }),
  setShowBaremeEditor: (show) => set({ showBaremeEditor: show }),
  setProjectsFolderPath: (path) => set({ projectsFolderPath: path }),
  setShowPipVideo: (show) => set({ showPipVideo: show }),
  setZoomLevel: (level) => set({ zoomLevel: level }),
  setZoomMode: (mode) => set({ zoomMode: mode }),
  setShortcut: (action, shortcut) =>
    set((state) => {
      const next = { ...state.shortcutBindings, [action]: shortcut }
      tauri.saveUserSettings({ shortcutBindings: next }).catch(() => {})
      return { shortcutBindings: next }
    }),
  resetShortcuts: () => {
    tauri.saveUserSettings({ shortcutBindings: { ...DEFAULT_SHORTCUT_BINDINGS } }).catch(() => {})
    set({ shortcutBindings: { ...DEFAULT_SHORTCUT_BINDINGS } })
  },
  setNotesDetached: (detached) => set({ isNotesDetached: detached }),
  zoomIn: () => set((s) => ({ zoomLevel: Math.min(200, s.zoomLevel + 10) })),
  zoomOut: () => set((s) => ({ zoomLevel: Math.max(50, s.zoomLevel - 10) })),
  resetZoom: () => set({ zoomLevel: 100 }),
}))
