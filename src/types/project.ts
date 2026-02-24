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
  thumbnailTime?: number
}

export interface ProjectSettings {
  autoSave: boolean
  autoSaveInterval: number
  defaultPlaybackSpeed: number
  defaultVolume: number
  judgeColors: Record<string, string>
  hideFinalScoreUntilEnd: boolean
  hideTotals: boolean
  showMiniatures: boolean
  showAddRowButton: boolean
  thumbnailDefaultTimeSec: number
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
  criterionNotes?: Record<string, string>
  categoryNotes?: Record<string, string>
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
  textNotes?: string
  criterionNotes?: Record<string, string>
  categoryNotes?: Record<string, string>
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
  judgeColors: {},
  hideFinalScoreUntilEnd: false,
  hideTotals: false,
  showMiniatures: false,
  showAddRowButton: false,
  thumbnailDefaultTimeSec: 10,
}
