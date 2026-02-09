import { useCallback } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import * as tauri from '@/services/tauri'

export function useSaveProject() {
  const save = useCallback(async () => {
    const projectState = useProjectStore.getState()
    const notationState = useNotationStore.getState()

    const { currentProject } = projectState
    if (!currentProject) return

    let filePath = currentProject.filePath
    if (!filePath) {
      filePath = (await tauri.saveProjectDialog(currentProject.name)) ?? undefined
      if (!filePath) return
      projectState.setFilePath(filePath)
    }

    const notesData = notationState.getNotesData()
    const projectData = projectState.getProjectData(notesData)
    if (!projectData) return

    await tauri.saveProjectFile(projectData, filePath)
    projectState.markClean()
  }, [])

  const saveAs = useCallback(async () => {
    const projectState = useProjectStore.getState()
    const notationState = useNotationStore.getState()

    const { currentProject } = projectState
    if (!currentProject) return

    const filePath = await tauri.saveProjectDialog(currentProject.name)
    if (!filePath) return

    projectState.setFilePath(filePath)
    const notesData = notationState.getNotesData()
    const projectData = projectState.getProjectData(notesData)
    if (!projectData) return

    await tauri.saveProjectFile(projectData, filePath)
    projectState.markClean()
  }, [])

  return { save, saveAs }
}
