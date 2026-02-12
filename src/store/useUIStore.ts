import { create } from 'zustand'
import type { InterfaceMode, AppTab } from '@/types/notation'
import type { ShortcutAction } from '@/utils/shortcuts'
import { DEFAULT_SHORTCUT_BINDINGS } from '@/utils/shortcuts'

type ZoomMode = 'fixed' | 'navigable'

interface UIStore {
  currentTab: AppTab
  currentInterface: InterfaceMode
  hideFinalScore: boolean
  hideAverages: boolean
  hideTextNotes: boolean
  sidebarCollapsed: boolean
  showProjectModal: boolean
  showBaremeEditor: boolean
  projectsFolderPath: string | null
  showPipVideo: boolean
  zoomLevel: number
  zoomMode: ZoomMode
  shortcutBindings: Record<ShortcutAction, string>

  switchTab: (tab: AppTab) => void
  switchInterface: (mode: InterfaceMode) => void
  toggleFinalScore: () => void
  toggleAverages: () => void
  toggleTextNotes: () => void
  toggleSidebar: () => void
  setShowProjectModal: (show: boolean) => void
  setShowBaremeEditor: (show: boolean) => void
  setProjectsFolderPath: (path: string) => void
  setShowPipVideo: (show: boolean) => void
  setZoomLevel: (level: number) => void
  setZoomMode: (mode: ZoomMode) => void
  setShortcut: (action: ShortcutAction, shortcut: string) => void
  resetShortcuts: () => void
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
  sidebarCollapsed: false,
  showProjectModal: false,
  showBaremeEditor: false,
  projectsFolderPath: null,
  showPipVideo: true,
  zoomLevel: 100,
  zoomMode: 'fixed',
  shortcutBindings: { ...DEFAULT_SHORTCUT_BINDINGS },

  switchTab: (tab) => set({ currentTab: tab }),
  switchInterface: (mode) => set({ currentInterface: mode }),
  toggleFinalScore: () => set((s) => ({ hideFinalScore: !s.hideFinalScore })),
  toggleAverages: () => set((s) => ({ hideAverages: !s.hideAverages })),
  toggleTextNotes: () => set((s) => ({ hideTextNotes: !s.hideTextNotes })),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setShowProjectModal: (show) => set({ showProjectModal: show }),
  setShowBaremeEditor: (show) => set({ showBaremeEditor: show }),
  setProjectsFolderPath: (path) => set({ projectsFolderPath: path }),
  setShowPipVideo: (show) => set({ showPipVideo: show }),
  setZoomLevel: (level) => set({ zoomLevel: level }),
  setZoomMode: (mode) => set({ zoomMode: mode }),
  setShortcut: (action, shortcut) =>
    set((state) => ({
      shortcutBindings: {
        ...state.shortcutBindings,
        [action]: shortcut,
      },
    })),
  resetShortcuts: () => set({ shortcutBindings: { ...DEFAULT_SHORTCUT_BINDINGS } }),
  zoomIn: () => set((s) => ({ zoomLevel: Math.min(200, s.zoomLevel + 10) })),
  zoomOut: () => set((s) => ({ zoomLevel: Math.max(50, s.zoomLevel - 10) })),
  resetZoom: () => set({ zoomLevel: 100 }),
}))
