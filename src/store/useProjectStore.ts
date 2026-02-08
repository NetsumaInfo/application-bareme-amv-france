import { create } from 'zustand'
import type { Project, Clip, ProjectSettings, ProjectData, NoteData } from '@/types/project'
import { DEFAULT_PROJECT_SETTINGS } from '@/types/project'
import { generateId, parseClipName } from '@/utils/formatters'

interface ProjectStore {
  currentProject: Project | null
  clips: Clip[]
  currentClipIndex: number
  isDirty: boolean

  createProject: (name: string, baremeId: string) => void
  setProjectFromData: (data: ProjectData) => void
  updateProject: (updates: Partial<Project>) => void
  updateSettings: (settings: Partial<ProjectSettings>) => void
  setClips: (clips: Clip[]) => void
  setCurrentClip: (index: number) => void
  nextClip: () => void
  previousClip: () => void
  markClipScored: (clipId: string) => void
  markDirty: () => void
  markClean: () => void
  setFilePath: (path: string) => void
  getProjectData: (notes: Record<string, NoteData>) => ProjectData | null
  reset: () => void
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  currentProject: null,
  clips: [],
  currentClipIndex: 0,
  isDirty: false,

  createProject: (name: string, baremeId: string) => {
    const now = new Date().toISOString()
    const project: Project = {
      id: generateId(),
      name,
      createdAt: now,
      updatedAt: now,
      baremeId,
      clipsFolderPath: '',
      settings: { ...DEFAULT_PROJECT_SETTINGS },
    }
    set({
      currentProject: project,
      clips: [],
      currentClipIndex: 0,
      isDirty: true,
    })
  },

  setProjectFromData: (data: ProjectData) => {
    // Ensure backward compatibility: add displayName if missing
    const clips = data.clips.map((c) => {
      if (c.displayName) return c
      const parsed = parseClipName(c.fileName)
      return { ...c, displayName: parsed.displayName, author: parsed.author }
    })
    set({
      currentProject: data.project,
      clips,
      currentClipIndex: 0,
      isDirty: false,
    })
  },

  updateProject: (updates: Partial<Project>) => {
    const current = get().currentProject
    if (!current) return
    set({
      currentProject: {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    })
  },

  updateSettings: (settings: Partial<ProjectSettings>) => {
    const current = get().currentProject
    if (!current) return
    set({
      currentProject: {
        ...current,
        settings: { ...current.settings, ...settings },
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    })
  },

  setClips: (clips: Clip[]) => {
    set({ clips, isDirty: true })
  },

  setCurrentClip: (index: number) => {
    const { clips } = get()
    if (index >= 0 && index < clips.length) {
      set({ currentClipIndex: index })
    }
  },

  nextClip: () => {
    const { currentClipIndex, clips } = get()
    if (currentClipIndex < clips.length - 1) {
      set({ currentClipIndex: currentClipIndex + 1 })
    }
  },

  previousClip: () => {
    const { currentClipIndex } = get()
    if (currentClipIndex > 0) {
      set({ currentClipIndex: currentClipIndex - 1 })
    }
  },

  markClipScored: (clipId: string) => {
    const { clips } = get()
    set({
      clips: clips.map((c) => (c.id === clipId ? { ...c, scored: true } : c)),
      isDirty: true,
    })
  },

  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),

  setFilePath: (path: string) => {
    const current = get().currentProject
    if (!current) return
    set({
      currentProject: { ...current, filePath: path },
    })
  },

  getProjectData: (notes: Record<string, NoteData>): ProjectData | null => {
    const { currentProject, clips } = get()
    if (!currentProject) return null
    return {
      version: '1.0',
      project: currentProject,
      baremeId: currentProject.baremeId,
      clips,
      notes,
    }
  },

  reset: () => {
    set({
      currentProject: null,
      clips: [],
      currentClipIndex: 0,
      isDirty: false,
    })
  },
}))
