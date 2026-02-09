import { create } from 'zustand'
import type { InterfaceMode } from '@/types/notation'

interface UIStore {
  currentInterface: InterfaceMode
  hideFinalScore: boolean
  sidebarCollapsed: boolean
  showProjectModal: boolean
  showBaremeEditor: boolean
  projectsFolderPath: string | null
  showPipVideo: boolean
  zoomLevel: number

  switchInterface: (mode: InterfaceMode) => void
  toggleFinalScore: () => void
  toggleSidebar: () => void
  setShowProjectModal: (show: boolean) => void
  setShowBaremeEditor: (show: boolean) => void
  setProjectsFolderPath: (path: string) => void
  setShowPipVideo: (show: boolean) => void
  setZoomLevel: (level: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  currentInterface: 'spreadsheet',
  hideFinalScore: false,
  sidebarCollapsed: false,
  showProjectModal: false,
  showBaremeEditor: false,
  projectsFolderPath: null,
  showPipVideo: true,
  zoomLevel: 100,

  switchInterface: (mode) => set({ currentInterface: mode }),
  toggleFinalScore: () => set((s) => ({ hideFinalScore: !s.hideFinalScore })),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setShowProjectModal: (show) => set({ showProjectModal: show }),
  setShowBaremeEditor: (show) => set({ showBaremeEditor: show }),
  setProjectsFolderPath: (path) => set({ projectsFolderPath: path }),
  setShowPipVideo: (show) => set({ showPipVideo: show }),
  setZoomLevel: (level) => set({ zoomLevel: level }),
  zoomIn: () => set((s) => ({ zoomLevel: Math.min(200, s.zoomLevel + 10) })),
  zoomOut: () => set((s) => ({ zoomLevel: Math.max(50, s.zoomLevel - 10) })),
  resetZoom: () => set({ zoomLevel: 100 }),
}))
