import { create } from 'zustand'
import type { InterfaceMode } from '@/types/notation'

interface UIStore {
  currentInterface: InterfaceMode
  hideFinalScore: boolean
  sidebarCollapsed: boolean
  showProjectModal: boolean
  showBaremeEditor: boolean

  switchInterface: (mode: InterfaceMode) => void
  toggleFinalScore: () => void
  toggleSidebar: () => void
  setShowProjectModal: (show: boolean) => void
  setShowBaremeEditor: (show: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  currentInterface: 'spreadsheet',
  hideFinalScore: false,
  sidebarCollapsed: false,
  showProjectModal: false,
  showBaremeEditor: false,

  switchInterface: (mode) => set({ currentInterface: mode }),
  toggleFinalScore: () => set((s) => ({ hideFinalScore: !s.hideFinalScore })),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setShowProjectModal: (show) => set({ showProjectModal: show }),
  setShowBaremeEditor: (show) => set({ showBaremeEditor: show }),
}))
