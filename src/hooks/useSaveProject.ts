import { useCallback } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import * as tauri from '@/services/tauri'
import { rememberRecentProjectPath } from '@/services/recentProjects'

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
    const projectData = projectState.getProjectData(notesData)
    if (!projectData) return

    const activeBaremeId = notationState.currentBareme?.id
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
    const projectData = projectState.getProjectData(notesData)
    if (!projectData) return

    const activeBaremeId = notationState.currentBareme?.id
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
