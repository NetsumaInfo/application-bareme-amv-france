import { useCallback } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import * as tauri from '@/services/tauri'
import { rememberRecentProjectPath } from '@/services/recentProjects'
import { resolveProjectBareme } from '@/store/projectStoreProjectActions'

export function useSaveProject() {
  const save = useCallback(async () => {
    const projectState = useProjectStore.getState()
    const notationState = useNotationStore.getState()

    const { currentProject } = projectState
    if (!currentProject) return

    let filePath = currentProject.filePath
    if (!filePath) {
      const projectsFolderPath = useUIStore.getState().projectsFolderPath
      filePath = (await tauri.saveProjectDialog(currentProject.name, projectsFolderPath ?? undefined)) ?? undefined
      if (!filePath) return
      projectState.setFilePath(filePath)
    }

    const notesData = notationState.getNotesData()
    const activeBareme = resolveProjectBareme(
      currentProject.baremeId,
      notationState.currentBareme,
      notationState.availableBaremes,
    )
    const projectData = projectState.getProjectData(notesData, activeBareme)
    if (!projectData) return

    const activeBaremeId = activeBareme?.id
    if (activeBaremeId) {
      projectData.baremeId = activeBaremeId
      projectData.project.baremeId = activeBaremeId
    }

    await tauri.saveProjectFile(projectData, filePath)
    await rememberRecentProjectPath(filePath)
    projectState.markClean()
  }, [])

  const saveAs = useCallback(async () => {
    const projectState = useProjectStore.getState()
    const notationState = useNotationStore.getState()

    const { currentProject } = projectState
    if (!currentProject) return

    const projectsFolderPath = useUIStore.getState().projectsFolderPath
    const filePath = await tauri.saveProjectDialog(currentProject.name, projectsFolderPath ?? undefined)
    if (!filePath) return

    projectState.setFilePath(filePath)
    const notesData = notationState.getNotesData()
    const activeBareme = resolveProjectBareme(
      currentProject.baremeId,
      notationState.currentBareme,
      notationState.availableBaremes,
    )
    const projectData = projectState.getProjectData(notesData, activeBareme)
    if (!projectData) return

    const activeBaremeId = activeBareme?.id
    if (activeBaremeId) {
      projectData.baremeId = activeBaremeId
      projectData.project.baremeId = activeBaremeId
    }

    await tauri.saveProjectFile(projectData, filePath)
    await rememberRecentProjectPath(filePath)
    projectState.markClean()
  }, [])

  return { save, saveAs }
}
