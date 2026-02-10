export interface Project {
  id: string
  name: string
  judgeName: string
  createdAt: string
  updatedAt: string
  baremeId: string
  clipsFolderPath: string
  settings: ProjectSettings
  filePath?: string
}

export interface Clip {
  id: string
  fileName: string
  filePath: string
  displayName: string
  author?: string
  duration: number
  hasInternalSubtitles: boolean
  audioTrackCount: number
  scored: boolean
  order: number
}

export interface ProjectSettings {
  autoSave: boolean
  autoSaveInterval: number
  defaultPlaybackSpeed: number
  defaultVolume: number
  hideFinalScoreUntilEnd: boolean
}

export interface ProjectData {
  version: string
  project: Project
  baremeId: string
  clips: Clip[]
  notes: Record<string, NoteData>
  importedJudges?: ImportedJudgeData[]
}

export interface NoteData {
  clipId: string
  baremeId: string
  scores: Record<string, CriterionScoreData>
  textNotes: string
  finalScore?: number
  scoredAt?: string
}

export interface CriterionScoreData {
  criterionId: string
  value: number | string | boolean
  isValid: boolean
}

export interface ImportedJudgeCriterionScore {
  value: number | string | boolean
  isValid: boolean
}

export interface ImportedJudgeNote {
  scores: Record<string, ImportedJudgeCriterionScore>
  finalScore?: number
}

export interface ImportedJudgeData {
  judgeName: string
  notes: Record<string, ImportedJudgeNote>
}

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  autoSave: true,
  autoSaveInterval: 30,
  defaultPlaybackSpeed: 1,
  defaultVolume: 80,
  hideFinalScoreUntilEnd: false,
}
