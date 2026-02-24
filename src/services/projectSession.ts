import * as tauri from '@/services/tauri'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import type { Clip, ImportedJudgeData, NoteData, Project, ProjectData } from '@/types/project'

interface LoadedProjectFile {
  version?: string
  project?: Partial<Project>
  baremeId?: string
  clips?: Clip[]
  notes?: Record<string, NoteData>
  importedJudges?: ImportedJudgeData[]
}

export async function loadAndApplyProjectFile(filePath: string): Promise<void> {
  const data = (await tauri.loadProjectFile(filePath)) as LoadedProjectFile

  const normalizedData: ProjectData = {
    ...data,
    version: typeof data.version === 'string' ? data.version : '1.0',
    project: { ...(data.project ?? {}), filePath } as Project,
    baremeId: data.baremeId ?? data.project?.baremeId ?? '',
    clips: Array.isArray(data.clips) ? data.clips : [],
    notes: data.notes ?? {},
    importedJudges: Array.isArray(data.importedJudges) ? data.importedJudges : [],
  }

  useProjectStore.getState().setProjectFromData(normalizedData)

  const notationStore = useNotationStore.getState()
  if (normalizedData.notes) {
    notationStore.loadNotes(normalizedData.notes)
  }

  const loadedBaremeId = normalizedData.baremeId
  const loadedBareme = notationStore.availableBaremes.find((item) => item.id === loadedBaremeId)
  if (loadedBareme) {
    notationStore.setBareme(loadedBareme)
  }
}
