import { FolderOpen, Save, FilePlus, FileDown, SaveAll } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import * as tauri from '@/services/tauri'

export default function ProjectManager() {
  const { currentProject, setProjectFromData, setFilePath, markClean, getProjectData } =
    useProjectStore()
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
        project: Parameters<typeof setProjectFromData>[0]['project']
        clips: Parameters<typeof setProjectFromData>[0]['clips']
        notes: Record<string, Parameters<typeof loadNotes>[0][string]>
        baremeId: string
      }

      setProjectFromData({
        version: '1.0',
        project: { ...data.project, filePath },
        baremeId: data.baremeId,
        clips: data.clips,
        notes: data.notes,
      })

      if (data.notes) {
        loadNotes(data.notes)
      }
    } catch (e) {
      console.error('Failed to open project:', e)
      alert(`Erreur lors de l'ouverture: ${e}`)
    }
  }

  const handleSave = async () => {
    if (!currentProject) return

    try {
      let filePath = currentProject.filePath
      if (!filePath) {
        filePath = await tauri.saveProjectDialog(currentProject.name) ?? undefined
        if (!filePath) return
        setFilePath(filePath)
      }

      const notesData = getNotesData()
      const projectData = getProjectData(notesData)
      if (!projectData) return

      await tauri.saveProjectFile(projectData, filePath)
      markClean()
    } catch (e) {
      console.error('Failed to save:', e)
      alert(`Erreur lors de la sauvegarde: ${e}`)
    }
  }

  const handleSaveAs = async () => {
    if (!currentProject) return

    try {
      const filePath = await tauri.saveProjectDialog(currentProject.name)
      if (!filePath) return

      setFilePath(filePath)
      const notesData = getNotesData()
      const projectData = getProjectData(notesData)
      if (!projectData) return

      await tauri.saveProjectFile(projectData, filePath)
      markClean()
    } catch (e) {
      console.error('Failed to save as:', e)
      alert(`Erreur lors de la sauvegarde: ${e}`)
    }
  }

  const handleExport = async () => {
    if (!currentProject) return

    try {
      const filePath = await tauri.saveJsonDialog(`${currentProject.name}_resultats.json`)
      if (!filePath) return

      const notesData = getNotesData()
      const projectData = getProjectData(notesData)
      await tauri.exportJsonFile(projectData, filePath)
    } catch (e) {
      console.error('Failed to export:', e)
      alert(`Erreur lors de l'export: ${e}`)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleNewProject}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded hover:bg-surface-light text-gray-300 hover:text-white transition-colors"
        title="Nouveau projet (Ctrl+N)"
      >
        <FilePlus size={14} />
        <span className="hidden sm:inline">Nouveau</span>
      </button>
      <button
        onClick={handleOpenProject}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded hover:bg-surface-light text-gray-300 hover:text-white transition-colors"
        title="Ouvrir un projet JSON (Ctrl+O)"
      >
        <FolderOpen size={14} />
        <span className="hidden sm:inline">Ouvrir</span>
      </button>
      {currentProject && (
        <>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded hover:bg-surface-light text-gray-300 hover:text-white transition-colors"
            title="Sauvegarder (Ctrl+S)"
          >
            <Save size={14} />
            <span className="hidden sm:inline">Sauver</span>
          </button>
          <button
            onClick={handleSaveAs}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded hover:bg-surface-light text-gray-300 hover:text-white transition-colors"
            title="Sauvegarder sous..."
          >
            <SaveAll size={14} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded hover:bg-surface-light text-gray-300 hover:text-white transition-colors"
            title="Exporter les résultats en JSON"
          >
            <FileDown size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </>
      )}
    </div>
  )
}
