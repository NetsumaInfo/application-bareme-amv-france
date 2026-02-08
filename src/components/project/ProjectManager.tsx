import { useState, useRef, useEffect } from 'react'
import {
  FolderOpen,
  Save,
  FilePlus,
  FileDown,
  FolderPlus,
  ChevronDown,
  Menu,
} from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import { addRecentProject } from '@/utils/recentProjects'
import { generateId, parseClipName } from '@/utils/formatters'
import type { Clip } from '@/types/project'
import * as tauri from '@/services/tauri'

export default function ProjectManager() {
  const {
    currentProject,
    clips,
    setProjectFromData,
    setFilePath,
    setClips,
    markClean,
    getProjectData,
    updateProject,
  } = useProjectStore()
  const { getNotesData, loadNotes } = useNotationStore()
  const { setShowProjectModal } = useUIStore()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleNewProject = () => {
    setOpen(false)
    setShowProjectModal(true)
  }

  const handleOpenProject = async () => {
    setOpen(false)
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

      addRecentProject(
        data.project.name,
        data.project.judgeName || '',
        filePath,
      )
    } catch (e) {
      console.error('Failed to open project:', e)
      alert(`Erreur lors de l'ouverture: ${e}`)
    }
  }

  const handleSave = async () => {
    setOpen(false)
    if (!currentProject) return

    try {
      let filePath = currentProject.filePath
      if (!filePath) {
        filePath = (await tauri.saveProjectDialog(currentProject.name)) ?? undefined
        if (!filePath) return
        setFilePath(filePath)
      }

      const notesData = getNotesData()
      const projectData = getProjectData(notesData)
      if (!projectData) return

      await tauri.saveProjectFile(projectData, filePath)
      markClean()
      addRecentProject(currentProject.name, currentProject.judgeName, filePath)
    } catch (e) {
      console.error('Failed to save:', e)
      alert(`Erreur lors de la sauvegarde: ${e}`)
    }
  }

  const handleSaveAs = async () => {
    setOpen(false)
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
      addRecentProject(currentProject.name, currentProject.judgeName, filePath)
    } catch (e) {
      console.error('Failed to save as:', e)
      alert(`Erreur lors de la sauvegarde: ${e}`)
    }
  }

  const handleImportFolder = async () => {
    setOpen(false)
    if (!currentProject) return

    try {
      const folderPath = await tauri.openFolderDialog()
      if (!folderPath) return

      const videos = await tauri.scanVideoFolder(folderPath)

      const newClips: Clip[] = videos.map((v, i) => {
        const parsed = parseClipName(v.file_name)
        return {
          id: generateId(),
          fileName: v.file_name,
          filePath: v.file_path,
          displayName: parsed.displayName,
          author: parsed.author,
          duration: 0,
          hasInternalSubtitles: false,
          audioTrackCount: 1,
          scored: false,
          order: clips.length + i,
        }
      })

      setClips([...clips, ...newClips])
      updateProject({ clipsFolderPath: folderPath })
    } catch (e) {
      console.error('Failed to import folder:', e)
      alert(`Erreur lors de l'import: ${e}`)
    }
  }

  const handleExport = async () => {
    setOpen(false)
    if (!currentProject) return

    try {
      const filePath = await tauri.saveJsonDialog(
        `${currentProject.name}_resultats.json`,
      )
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
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1.5 text-xs rounded hover:bg-surface-light text-gray-300 hover:text-white transition-colors"
        title="Menu fichier"
      >
        <Menu size={14} />
        <span className="hidden sm:inline">Fichier</span>
        <ChevronDown
          size={10}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-52 bg-surface border border-gray-700 rounded-lg shadow-xl z-50 py-1">
          <MenuItem
            icon={<FilePlus size={13} />}
            label="Nouveau projet"
            shortcut="Ctrl+N"
            onClick={handleNewProject}
          />
          <MenuItem
            icon={<FolderOpen size={13} />}
            label="Ouvrir..."
            shortcut="Ctrl+O"
            onClick={handleOpenProject}
          />

          {currentProject && (
            <>
              <div className="border-t border-gray-700 my-1" />
              <MenuItem
                icon={<FolderPlus size={13} />}
                label="Importer des vidéos..."
                onClick={handleImportFolder}
              />
              <div className="border-t border-gray-700 my-1" />
              <MenuItem
                icon={<Save size={13} />}
                label="Sauvegarder"
                shortcut="Ctrl+S"
                onClick={handleSave}
              />
              <MenuItem
                icon={<Save size={13} />}
                label="Sauvegarder sous..."
                onClick={handleSaveAs}
              />
              <div className="border-t border-gray-700 my-1" />
              <MenuItem
                icon={<FileDown size={13} />}
                label="Exporter JSON"
                onClick={handleExport}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}

function MenuItem({
  icon,
  label,
  shortcut,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  shortcut?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-surface-light transition-colors flex items-center gap-2"
    >
      <span className="text-gray-500">{icon}</span>
      <span className="flex-1">{label}</span>
      {shortcut && (
        <span className="text-[10px] text-gray-600">{shortcut}</span>
      )}
    </button>
  )
}
