import * as tauri from '@/services/tauri'
import { extractEmbeddedBaremes } from '@/store/embeddedBaremes'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { OFFICIAL_BAREME } from '@/types/bareme'
import type { Bareme } from '@/types/bareme'
import type { Clip, ImportedJudgeData, NoteData, Project, ProjectData } from '@/types/project'

interface LoadedProjectFile {
  version?: string
  project?: Partial<Project>
  projectData?: LoadedProjectFile
  baremeId?: string
  bareme?: Bareme | null
  baremes?: Bareme[]
  clips?: Clip[]
  notes?: Record<string, NoteData>
  importedJudges?: ImportedJudgeData[]
}

export async function loadAndApplyProjectFile(filePath: string): Promise<void> {
  const rawData = (await tauri.loadProjectFile(filePath)) as LoadedProjectFile
  const data = rawData.projectData && typeof rawData.projectData === 'object'
    ? rawData.projectData
    : rawData

  const normalizedData: ProjectData = {
    ...data,
    version: typeof data.version === 'string' ? data.version : '1.0',
    project: { ...(data.project ?? {}), filePath } as Project,
    baremeId: data.baremeId ?? data.project?.baremeId ?? '',
    bareme: data.bareme ?? rawData.bareme ?? null,
    baremes: Array.isArray(data.baremes)
      ? data.baremes
      : Array.isArray(rawData.baremes)
        ? rawData.baremes
        : undefined,
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
  let loadedBareme = notationStore.availableBaremes.find((item) => item.id === loadedBaremeId)
  const embeddedBareme = extractEmbeddedBaremes(rawData).find((bareme) => (
    loadedBaremeId ? bareme.id === loadedBaremeId : true
  ))

  if (embeddedBareme && embeddedBareme.id !== OFFICIAL_BAREME.id) {
    loadedBareme = notationStore.addBareme({
      ...embeddedBareme,
      isOfficial: false,
    })
  } else if (!loadedBareme && embeddedBareme) {
    loadedBareme = embeddedBareme
  }

  if (loadedBareme) {
    notationStore.setBareme(loadedBareme)
  }
}
