import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import * as tauri from '@/services/tauri'
import { rememberRecentProjectPath } from '@/services/recentProjects'
import { loadAndApplyProjectFile } from '@/services/projectSession'
import { useI18n } from '@/i18n'

export function useProjectFileActions() {
  const { t } = useI18n()
  const {
    currentProject,
    clips,
    setFilePath,
    markClean,
    getProjectData,
  } = useProjectStore()
  const { setShowProjectModal } = useUIStore()
  const projectsFolderPath = useUIStore((state) => state.projectsFolderPath)

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
      alert(t("Erreur lors de l'ouverture: {error}", { error: String(errorValue) }))
    }
  }

  const saveProjectTo = async (filePath: string) => {
    const notationState = useNotationStore.getState()
    const notesData = notationState.getNotesData()
    const activeBareme = notationState.currentBareme
    const projectData = getProjectData(notesData, activeBareme)
    if (!projectData) return

    const activeBaremeId = activeBareme?.id
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
        filePath = (await tauri.saveProjectDialog(currentProject.name, projectsFolderPath ?? undefined)) ?? undefined
        if (!filePath) return
        setFilePath(filePath)
      }

      await saveProjectTo(filePath)
    } catch (errorValue) {
      console.error('Failed to save:', errorValue)
      alert(t('Erreur lors de la sauvegarde: {error}', { error: String(errorValue) }))
    }
  }

  const handleSaveAs = async () => {
    if (!currentProject) return

    try {
      const filePath = await tauri.saveProjectDialog(currentProject.name, projectsFolderPath ?? undefined)
      if (!filePath) return

      setFilePath(filePath)
      await saveProjectTo(filePath)
    } catch (errorValue) {
      console.error('Failed to save as:', errorValue)
      alert(t('Erreur lors de la sauvegarde: {error}', { error: String(errorValue) }))
    }
  }

  const handleExport = async () => {
    if (!currentProject) return

    try {
      const filePath = await tauri.saveJsonDialog(`${currentProject.name}.json`)
      if (!filePath) return

      const notationState = useNotationStore.getState()
      const notesData = notationState.getNotesData()
      const projectData = getProjectData(notesData, notationState.currentBareme)
      if (!projectData) return
      await tauri.exportJsonFile(projectData, filePath)
    } catch (errorValue) {
      console.error('Failed to export:', errorValue)
      alert(t("Erreur lors de l'export: {error}", { error: String(errorValue) }))
    }
  }

  const handleExportJudgeNotes = async () => {
    if (!currentProject) return

    try {
      const sanitizedJudge = (currentProject.judgeName || 'juge').trim() || 'juge'
      const defaultName = `${currentProject.name}_${sanitizedJudge}.json`
      const filePath = await tauri.saveJsonDialog(defaultName)
      if (!filePath) return

      const notationState = useNotationStore.getState()
      const notesData = notationState.getNotesData()
      const activeBareme = notationState.currentBareme
      const activeBaremeId = activeBareme?.id ?? currentProject.baremeId
      await tauri.exportJsonFile(
        {
          version: '1.0',
          type: 'judge-notes',
          exportedAt: new Date().toISOString(),
          projectName: currentProject.name,
          judgeName: currentProject.judgeName,
          baremeId: activeBaremeId,
          bareme: activeBareme ?? null,
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
      alert(t("Erreur lors de l'export notation: {error}", { error: String(errorValue) }))
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
