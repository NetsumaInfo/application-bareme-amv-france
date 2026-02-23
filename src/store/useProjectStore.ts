import { create } from 'zustand'
import type {
  Project,
  Clip,
  ProjectSettings,
  ProjectData,
  NoteData,
  ImportedJudgeData,
} from '@/types/project'
import { getSortedClipIndices } from '@/utils/clipOrder'
import { normalizeProjectDataInput } from '@/store/projectStoreNormalization'
import {
  normalizeThumbnailTime,
  removeClipAndAdjustSelection,
  updateClipScoredState,
  updateClipThumbnail,
} from '@/store/projectStoreClipActions'
import {
  buildProjectDataPayload,
  createProjectEntity,
  mergeProjectSettings,
  mergeProjectUpdates,
} from '@/store/projectStoreProjectActions'

interface ProjectStore {
  currentProject: Project | null
  clips: Clip[]
  currentClipIndex: number
  importedJudges: ImportedJudgeData[]
  isDirty: boolean

  createProject: (name: string, judgeName: string, baremeId: string) => void
  setProjectFromData: (data: ProjectData) => void
  updateProject: (updates: Partial<Project>) => void
  updateSettings: (settings: Partial<ProjectSettings>) => void
  setClips: (clips: Clip[]) => void
  setClipThumbnailTime: (clipId: string, seconds: number | null) => void
  setCurrentClip: (index: number) => void
  nextClip: () => void
  previousClip: () => void
  markClipScored: (clipId: string) => void
  setClipScored: (clipId: string, scored: boolean) => void
  removeClip: (clipId: string) => void
  addImportedJudge: (judge: ImportedJudgeData) => void
  removeImportedJudge: (index: number) => void
  setImportedJudges: (judges: ImportedJudgeData[]) => void
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
  importedJudges: [],
  isDirty: false,

  createProject: (name: string, judgeName: string, baremeId: string) => {
    const project = createProjectEntity(name, judgeName, baremeId)
    set({
      currentProject: project,
      clips: [],
      currentClipIndex: 0,
      importedJudges: [],
      isDirty: true,
    })
  },

  setProjectFromData: (data: ProjectData) => {
    const { project, clips, importedJudges } = normalizeProjectDataInput(data)
    set({
      currentProject: project,
      clips,
      importedJudges,
      currentClipIndex: 0,
      isDirty: false,
    })
  },

  updateProject: (updates: Partial<Project>) => {
    const current = get().currentProject
    if (!current) return
    set({
      currentProject: mergeProjectUpdates(current, updates),
      isDirty: true,
    })
  },

  updateSettings: (settings: Partial<ProjectSettings>) => {
    const current = get().currentProject
    if (!current) return
    set({
      currentProject: mergeProjectSettings(current, settings),
      isDirty: true,
    })
  },

  setClips: (clips: Clip[]) => {
    set({ clips, isDirty: true })
  },

  setClipThumbnailTime: (clipId: string, seconds: number | null) => {
    const safeSeconds = normalizeThumbnailTime(seconds)

    set((state) => ({
      clips: updateClipThumbnail(state.clips, clipId, safeSeconds),
      isDirty: true,
    }))
  },

  setCurrentClip: (index: number) => {
    const { clips } = get()
    if (index >= 0 && index < clips.length) {
      set({ currentClipIndex: index })
    }
  },

  nextClip: () => {
    const { currentClipIndex, clips } = get()
    if (clips.length <= 1) return
    const sortedIndices = getSortedClipIndices(clips)
    const currentSortedIndex = sortedIndices.indexOf(currentClipIndex)
    if (currentSortedIndex < 0) return

    const nextSortedIndex = Math.min(sortedIndices.length - 1, currentSortedIndex + 1)
    if (nextSortedIndex === currentSortedIndex) return
    const nextIndex = sortedIndices[nextSortedIndex]
    if (nextIndex >= 0 && nextIndex !== currentClipIndex) {
      set({ currentClipIndex: nextIndex })
    }
  },

  previousClip: () => {
    const { currentClipIndex, clips } = get()
    if (clips.length <= 1) return
    const sortedIndices = getSortedClipIndices(clips)
    const currentSortedIndex = sortedIndices.indexOf(currentClipIndex)
    if (currentSortedIndex < 0) return

    const prevSortedIndex = Math.max(0, currentSortedIndex - 1)
    if (prevSortedIndex === currentSortedIndex) return
    const prevIndex = sortedIndices[prevSortedIndex]
    if (prevIndex >= 0 && prevIndex !== currentClipIndex) {
      set({ currentClipIndex: prevIndex })
    }
  },

  markClipScored: (clipId: string) => {
    const { clips } = get()
    set({
      clips: updateClipScoredState(clips, clipId, true),
      isDirty: true,
    })
  },

  setClipScored: (clipId: string, scored: boolean) => {
    const { clips } = get()
    set({
      clips: updateClipScoredState(clips, clipId, scored),
      isDirty: true,
    })
  },

  removeClip: (clipId: string) => {
    const { clips, currentClipIndex } = get()
    const nextState = removeClipAndAdjustSelection(clips, currentClipIndex, clipId)
    set({ ...nextState, isDirty: true })
  },

  addImportedJudge: (judge) =>
    set((state) => ({
      importedJudges: [...state.importedJudges, judge],
      isDirty: true,
    })),

  removeImportedJudge: (index) =>
    set((state) => ({
      importedJudges: state.importedJudges.filter((_, i) => i !== index),
      isDirty: true,
    })),

  setImportedJudges: (judges) =>
    set({
      importedJudges: judges,
      isDirty: true,
    }),

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
    const { currentProject, clips, importedJudges } = get()
    if (!currentProject) return null
    return buildProjectDataPayload(currentProject, clips, notes, importedJudges)
  },

  reset: () => {
    set({
      currentProject: null,
      clips: [],
      currentClipIndex: 0,
      importedJudges: [],
      isDirty: false,
    })
  },
}))
