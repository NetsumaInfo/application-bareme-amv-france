import type {
  Clip,
  ImportedJudgeData,
  NoteData,
  Project,
  ProjectData,
  ProjectSettings,
} from '@/types/project'
import { DEFAULT_PROJECT_SETTINGS } from '@/types/project'
import { generateId } from '@/utils/formatters'

export function createProjectEntity(name: string, judgeName: string, baremeId: string): Project {
  const now = new Date().toISOString()
  return {
    id: generateId(),
    name,
    judgeName,
    createdAt: now,
    updatedAt: now,
    baremeId,
    clipsFolderPath: '',
    settings: { ...DEFAULT_PROJECT_SETTINGS },
  }
}

export function mergeProjectUpdates(current: Project, updates: Partial<Project>): Project {
  return {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  }
}

export function mergeProjectSettings(current: Project, settings: Partial<ProjectSettings>): Project {
  return {
    ...current,
    settings: { ...current.settings, ...settings },
    updatedAt: new Date().toISOString(),
  }
}

export function buildProjectDataPayload(
  currentProject: Project,
  clips: Clip[],
  notes: Record<string, NoteData>,
  importedJudges: ImportedJudgeData[],
): ProjectData {
  return {
    version: '1.0',
    project: currentProject,
    baremeId: currentProject.baremeId,
    clips,
    notes,
    importedJudges,
  }
}
