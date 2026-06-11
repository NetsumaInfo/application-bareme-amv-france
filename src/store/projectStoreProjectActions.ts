import type {
  Clip,
  ImportedJudgeData,
  NoteData,
  Project,
  ProjectData,
  ProjectSettings,
} from '@/types/project'
import type { Bareme } from '@/types/bareme'
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
    resultNotes: {},
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

/**
 * Resolve the bareme that should be persisted/exported for a project.
 *
 * `currentBareme` (notation store) is mutable and can drift away from the
 * project's actual selection (e.g. a baremes-folder reload falling back to the
 * official bareme). The project's `baremeId` is the reliable anchor, so prefer
 * the matching bareme from `availableBaremes` whenever `currentBareme` does not
 * match it. This prevents exporting/saving the wrong (often official) bareme.
 */
export function resolveProjectBareme(
  baremeId: string | undefined,
  currentBareme: Bareme | null | undefined,
  availableBaremes: Bareme[],
): Bareme | null {
  if (currentBareme && (!baremeId || currentBareme.id === baremeId)) {
    return currentBareme
  }
  if (baremeId) {
    const match = availableBaremes.find((item) => item.id === baremeId)
    if (match) return match
  }
  return currentBareme ?? null
}

export function buildProjectDataPayload(
  currentProject: Project,
  clips: Clip[],
  notes: Record<string, NoteData>,
  importedJudges: ImportedJudgeData[],
  currentBareme?: Bareme | null,
): ProjectData {
  const project = currentBareme?.id && currentProject.baremeId !== currentBareme.id
    ? { ...currentProject, baremeId: currentBareme.id }
    : currentProject

  return {
    version: '1.0',
    project,
    baremeId: project.baremeId,
    bareme: currentBareme ?? null,
    clips,
    notes,
    importedJudges,
  }
}
