import { create } from 'zustand'
import type { InterfaceMode, AppTab } from '@/types/notation'

type ZoomMode = 'fixed' | 'navigable'

interface UIStore {
  currentTab: AppTab
  currentInterface: InterfaceMode
  hideFinalScore: boolean
  hideAverages: boolean
  sidebarCollapsed: boolean
  showProjectModal: boolean
  showBaremeEditor: boolean
  projectsFolderPath: string | null
  showPipVideo: boolean
  zoomLevel: number
  zoomMode: ZoomMode

  switchTab: (tab: AppTab) => void
  switchInterface: (mode: InterfaceMode) => void
  toggleFinalScore: () => void
  toggleAverages: () => void
  toggleSidebar: () => void
  setShowProjectModal: (show: boolean) => void
  setShowBaremeEditor: (show: boolean) => void
  setProjectsFolderPath: (path: string) => void
  setShowPipVideo: (show: boolean) => void
  setZoomLevel: (level: number) => void
  setZoomMode: (mode: ZoomMode) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  currentTab: 'notation',
  currentInterface: 'spreadsheet',
  hideFinalScore: false,
  hideAverages: false,
  sidebarCollapsed: false,
  showProjectModal: false,
  showBaremeEditor: false,
  projectsFolderPath: null,
  showPipVideo: true,
  zoomLevel: 100,
  zoomMode: 'fixed',

  switchTab: (tab) => set({ currentTab: tab }),
  switchInterface: (mode) => set({ currentInterface: mode }),
  toggleFinalScore: () => set((s) => ({ hideFinalScore: !s.hideFinalScore })),
  toggleAverages: () => set((s) => ({ hideAverages: !s.hideAverages })),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setShowProjectModal: (show) => set({ showProjectModal: show }),
  setShowBaremeEditor: (show) => set({ showBaremeEditor: show }),
  setProjectsFolderPath: (path) => set({ projectsFolderPath: path }),
  setShowPipVideo: (show) => set({ showPipVideo: show }),
  setZoomLevel: (level) => set({ zoomLevel: level }),
  setZoomMode: (mode) => set({ zoomMode: mode }),
  zoomIn: () => set((s) => ({ zoomLevel: Math.min(200, s.zoomLevel + 10) })),
  zoomOut: () => set((s) => ({ zoomLevel: Math.max(50, s.zoomLevel - 10) })),
  resetZoom: () => set({ zoomLevel: 100 }),
}))
