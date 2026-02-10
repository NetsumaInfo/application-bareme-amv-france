import { create } from 'zustand'
import type {
  Project,
  Clip,
  ProjectSettings,
  ProjectData,
  NoteData,
  ImportedJudgeData,
  ImportedJudgeNote,
  ImportedJudgeCriterionScore,
} from '@/types/project'
import { DEFAULT_PROJECT_SETTINGS } from '@/types/project'
import { generateId, parseClipName } from '@/utils/formatters'

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
  setCurrentClip: (index: number) => void
  nextClip: () => void
  previousClip: () => void
  markClipScored: (clipId: string) => void
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
    const now = new Date().toISOString()
    const project: Project = {
      id: generateId(),
      name,
      judgeName,
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
      importedJudges: [],
      isDirty: true,
    })
  },

  setProjectFromData: (data: ProjectData) => {
    const now = new Date().toISOString()
    const rawProject = (data.project ?? {}) as unknown as Record<string, unknown>
    const rawSettings = (rawProject.settings ?? {}) as Record<string, unknown>
    const numberOr = (value: unknown, fallback: number) => {
      const n = Number(value)
      return Number.isFinite(n) ? n : fallback
    }

    const normalizedProject: Project = {
      id: (rawProject.id as string) || generateId(),
      name: (rawProject.name as string) || 'Projet AMV',
      judgeName:
        (rawProject.judgeName as string) ||
        (rawProject.judge_name as string) ||
        '',
      createdAt:
        (rawProject.createdAt as string) ||
        (rawProject.created_at as string) ||
        now,
      updatedAt:
        (rawProject.updatedAt as string) ||
        (rawProject.updated_at as string) ||
        now,
      baremeId:
        (rawProject.baremeId as string) ||
        (rawProject.bareme_id as string) ||
        data.baremeId ||
        '',
      clipsFolderPath:
        (rawProject.clipsFolderPath as string) ||
        (rawProject.clips_folder_path as string) ||
        '',
      settings: {
        autoSave:
          typeof rawSettings.autoSave === 'boolean'
            ? rawSettings.autoSave
            : typeof rawSettings.auto_save === 'boolean'
              ? rawSettings.auto_save
              : DEFAULT_PROJECT_SETTINGS.autoSave,
        autoSaveInterval: numberOr(
          rawSettings.autoSaveInterval ?? rawSettings.auto_save_interval,
          DEFAULT_PROJECT_SETTINGS.autoSaveInterval,
        ),
        defaultPlaybackSpeed: numberOr(
          rawSettings.defaultPlaybackSpeed ?? rawSettings.default_playback_speed,
          DEFAULT_PROJECT_SETTINGS.defaultPlaybackSpeed,
        ),
        defaultVolume: numberOr(
          rawSettings.defaultVolume ?? rawSettings.default_volume,
          DEFAULT_PROJECT_SETTINGS.defaultVolume,
        ),
        hideFinalScoreUntilEnd:
          typeof rawSettings.hideFinalScoreUntilEnd === 'boolean'
            ? rawSettings.hideFinalScoreUntilEnd
            : typeof rawSettings.hide_final_score_until_end === 'boolean'
              ? rawSettings.hide_final_score_until_end
              : DEFAULT_PROJECT_SETTINGS.hideFinalScoreUntilEnd,
      },
      filePath:
        (rawProject.filePath as string | undefined) ||
        (rawProject.file_path as string | undefined),
    }

    const rawClips = Array.isArray(data.clips) ? data.clips : []
    const clips = rawClips.map((clip, index) => {
      const rawClip = clip as unknown as Record<string, unknown>
      const fileName =
        (rawClip.fileName as string) ||
        (rawClip.file_name as string) ||
        ''
      const parsed = parseClipName(fileName)

      return {
        id: (rawClip.id as string) || generateId(),
        fileName,
        filePath:
          (rawClip.filePath as string) ||
          (rawClip.file_path as string) ||
          '',
        displayName: (rawClip.displayName as string) || parsed.displayName,
        author: (rawClip.author as string | undefined) || parsed.author,
        duration: numberOr(rawClip.duration, 0),
        hasInternalSubtitles: Boolean(
          rawClip.hasInternalSubtitles ?? rawClip.has_internal_subtitles ?? false,
        ),
        audioTrackCount:
          Math.max(1, Number(rawClip.audioTrackCount ?? rawClip.audio_track_count ?? 1) || 1),
        scored: Boolean(rawClip.scored),
        order: numberOr(rawClip.order, index),
      }
    })

    const rawImportedJudges = Array.isArray((data as unknown as Record<string, unknown>).importedJudges)
      ? (data as unknown as Record<string, unknown>).importedJudges
      : Array.isArray((data as unknown as Record<string, unknown>).imported_judges)
        ? (data as unknown as Record<string, unknown>).imported_judges
        : []

    const toImportedJudges = (input: unknown[]): ImportedJudgeData[] =>
      input
        .map((item) => {
          const row = item as Record<string, unknown>
          const judgeName = typeof row.judgeName === 'string'
            ? row.judgeName
            : typeof row.judge_name === 'string'
              ? row.judge_name
              : ''
          if (!judgeName.trim()) return null

          const notesRaw = (row.notes as Record<string, unknown> | undefined) ?? {}
          const notes: Record<string, ImportedJudgeNote> = {}

          for (const [clipId, noteValue] of Object.entries(notesRaw)) {
            const noteRow = noteValue as Record<string, unknown>
            const scoresRaw = (noteRow.scores as Record<string, unknown> | undefined) ?? {}
            const scores: Record<string, ImportedJudgeCriterionScore> = {}

            for (const [criterionId, scoreValue] of Object.entries(scoresRaw)) {
              const scoreRow = scoreValue as Record<string, unknown>
              scores[criterionId] = {
                value: (scoreRow.value as number | string | boolean) ?? 0,
                isValid: scoreRow.isValid !== false,
              }
            }

            const parsedFinalScore = Number(noteRow.finalScore)
            notes[clipId] = Number.isFinite(parsedFinalScore)
              ? { scores, finalScore: parsedFinalScore }
              : { scores }
          }

          return {
            judgeName: judgeName.trim(),
            notes,
          }
        })
        .filter((judge): judge is ImportedJudgeData => judge !== null)

    set({
      currentProject: normalizedProject,
      clips,
      importedJudges: toImportedJudges(rawImportedJudges as unknown[]),
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
    return {
      version: '1.0',
      project: currentProject,
      baremeId: currentProject.baremeId,
      clips,
      notes,
      importedJudges,
    }
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
