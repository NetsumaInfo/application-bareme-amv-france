import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import * as tauri from '@/services/tauri'
import { rememberRecentProjectPath } from '@/services/recentProjects'
import { loadAndApplyProjectFile } from '@/services/projectSession'

export function useProjectFileActions() {
  const {
    currentProject,
    clips,
    setFilePath,
    markClean,
    getProjectData,
  } = useProjectStore()
  const { getNotesData } = useNotationStore()
  const { setShowProjectModal } = useUIStore()

  const handleNewProject = () => {
    setShowProjectModal(true)
  }

  const handleOpenProject = async () => {
    try {
      const filePath = await tauri.openProjectDialog()
      if (!filePath) return

      await loadAndApplyProjectFile(filePath)
      await rememberRecentProjectPath(filePath)
    } catch (errorValue) {
      console.error('Failed to open project:', errorValue)
      alert(`Erreur lors de l'ouverture: ${errorValue}`)
    }
  }

  const saveProjectTo = async (filePath: string) => {
    const notesData = getNotesData()
    const projectData = getProjectData(notesData)
    if (!projectData) return

    const activeBaremeId = useNotationStore.getState().currentBareme?.id
    if (activeBaremeId) {
      projectData.baremeId = activeBaremeId
      projectData.project.baremeId = activeBaremeId
    }

    await tauri.saveProjectFile(projectData, filePath)
    await rememberRecentProjectPath(filePath)
    markClean()
  }

  const handleSave = async () => {
    if (!currentProject) return

    try {
      let filePath = currentProject.filePath
      if (!filePath) {
        filePath = (await tauri.saveProjectDialog(currentProject.name)) ?? undefined
        if (!filePath) return
        setFilePath(filePath)
      }

      await saveProjectTo(filePath)
    } catch (errorValue) {
      console.error('Failed to save:', errorValue)
      alert(`Erreur lors de la sauvegarde: ${errorValue}`)
    }
  }

  const handleSaveAs = async () => {
    if (!currentProject) return

    try {
      const filePath = await tauri.saveProjectDialog(currentProject.name)
      if (!filePath) return

      setFilePath(filePath)
      await saveProjectTo(filePath)
    } catch (errorValue) {
      console.error('Failed to save as:', errorValue)
      alert(`Erreur lors de la sauvegarde: ${errorValue}`)
    }
  }

  const handleExport = async () => {
    if (!currentProject) return

    try {
      const filePath = await tauri.saveJsonDialog(`${currentProject.name}.json`)
      if (!filePath) return

      const notesData = getNotesData()
      const projectData = getProjectData(notesData)
      await tauri.exportJsonFile(projectData, filePath)
    } catch (errorValue) {
      console.error('Failed to export:', errorValue)
      alert(`Erreur lors de l'export: ${errorValue}`)
    }
  }

  const handleExportJudgeNotes = async () => {
    if (!currentProject) return

    try {
      const sanitizedJudge = (currentProject.judgeName || 'juge').trim() || 'juge'
      const defaultName = `${currentProject.name}_${sanitizedJudge}.json`
      const filePath = await tauri.saveJsonDialog(defaultName)
      if (!filePath) return

      const notesData = getNotesData()
      await tauri.exportJsonFile(
        {
          version: '1.0',
          type: 'judge-notes',
          exportedAt: new Date().toISOString(),
          projectName: currentProject.name,
          judgeName: currentProject.judgeName,
          baremeId: currentProject.baremeId,
          clips: clips.map((clip) => ({
            id: clip.id,
            fileName: clip.fileName,
            displayName: clip.displayName,
            author: clip.author,
          })),
          notes: notesData,
        },
        filePath,
      )
    } catch (errorValue) {
      console.error('Failed to export judge notes:', errorValue)
      alert(`Erreur lors de l'export notation: ${errorValue}`)
    }
  }

  return {
    currentProject,
    handleNewProject,
    handleOpenProject,
    handleSave,
    handleSaveAs,
    handleExport,
    handleExportJudgeNotes,
  }
}
