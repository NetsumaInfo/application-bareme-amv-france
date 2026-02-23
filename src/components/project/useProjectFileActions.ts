import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import * as tauri from '@/services/tauri'

export function useProjectFileActions() {
  const {
    currentProject,
    clips,
    setProjectFromData,
    setFilePath,
    markClean,
    getProjectData,
  } = useProjectStore()
  const { getNotesData, loadNotes } = useNotationStore()
  const { setShowProjectModal } = useUIStore()

  const handleNewProject = () => {
    setShowProjectModal(true)
  }

  const handleOpenProject = async () => {
    try {
      const filePath = await tauri.openProjectDialog()
      if (!filePath) return

      const data = (await tauri.loadProjectFile(filePath)) as {
        version?: string
        project: Parameters<typeof setProjectFromData>[0]['project']
        clips: Parameters<typeof setProjectFromData>[0]['clips']
        notes: Record<string, Parameters<typeof loadNotes>[0][string]>
        baremeId: string
        importedJudges?: Parameters<typeof setProjectFromData>[0]['importedJudges']
      }

      setProjectFromData({
        ...data,
        version: typeof data.version === 'string' ? data.version : '1.0',
        project: { ...data.project, filePath },
        baremeId: data.baremeId ?? data.project.baremeId,
        clips: Array.isArray(data.clips) ? data.clips : [],
        notes: data.notes ?? {},
      })

      if (data.notes) {
        loadNotes(data.notes)
      }
    } catch (errorValue) {
      console.error('Failed to open project:', errorValue)
      alert(`Erreur lors de l'ouverture: ${errorValue}`)
    }
  }

  const saveProjectTo = async (filePath: string) => {
    const notesData = getNotesData()
    const projectData = getProjectData(notesData)
    if (!projectData) return
    await tauri.saveProjectFile(projectData, filePath)
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
      const filePath = await tauri.saveJsonDialog(`${currentProject.name}_projet.json`)
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
      const defaultName = `${currentProject.name}_${currentProject.judgeName || 'juge'}_JE.json`
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
