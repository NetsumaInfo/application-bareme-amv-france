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

  const handleImportFiles = async () => {
    setOpen(false)
    if (!currentProject) return

    try {
      const filePaths = await tauri.openVideoFilesDialog()
      if (!filePaths || filePaths.length === 0) return

      const newClips: Clip[] = filePaths.map((filePath, i) => {
        const fileName = filePath.split(/[\\/]/).pop() || filePath
        const parsed = parseClipName(fileName)
        return {
          id: generateId(),
          fileName,
          filePath,
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
    } catch (e) {
      console.error('Failed to import files:', e)
      alert(`Erreur lors de l'import: ${e}`)
    }
  }

  const handleRelocateVideos = async () => {
    setOpen(false)
    if (!currentProject || clips.length === 0) return

    try {
      const folderPath = await tauri.openFolderDialog()
      if (!folderPath) return

      const videos = await tauri.scanVideoFolder(folderPath)
      if (videos.length === 0) {
        alert('Aucune vidéo trouvée dans ce dossier.')
        return
      }

      const pathByFileName = new Map<string, string>()
      for (const video of videos) {
        const key = video.file_name.trim().toLowerCase()
        if (!pathByFileName.has(key)) {
          pathByFileName.set(key, video.file_path)
        }
      }

      let matched = 0
      const updatedClips = clips.map((clip) => {
        const key = clip.fileName.trim().toLowerCase()
        const nextPath = pathByFileName.get(key)
        if (!nextPath || nextPath === clip.filePath) return clip
        matched += 1
        return { ...clip, filePath: nextPath }
      })

      if (matched === 0) {
        alert('Aucun fichier correspondant trouvé pour relocaliser les vidéos.')
        return
      }

      setClips(updatedClips)
      updateProject({ clipsFolderPath: folderPath })
      alert(`Relocalisation terminée: ${matched}/${clips.length} vidéo(s) mises à jour.`)
    } catch (e) {
      console.error('Failed to relocate videos:', e)
      alert(`Erreur lors de la relocalisation: ${e}`)
    }
  }

  const handleExport = async () => {
    setOpen(false)
    if (!currentProject) return

    try {
      const filePath = await tauri.saveJsonDialog(
        `${currentProject.name}_projet.json`,
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

  const handleExportJudgeNotes = async () => {
    setOpen(false)
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
    } catch (e) {
      console.error('Failed to export judge notes:', e)
      alert(`Erreur lors de l'export notation: ${e}`)
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
                label="Importer un dossier..."
                onClick={handleImportFolder}
              />
              <MenuItem
                icon={<FilePlus size={13} />}
                label="Importer des fichiers..."
                onClick={handleImportFiles}
              />
              <MenuItem
                icon={<FolderOpen size={13} />}
                label="Relocaliser les vidéos..."
                onClick={handleRelocateVideos}
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
                label="Exporter projet (JSON)"
                onClick={handleExport}
              />
              <MenuItem
                icon={<FileDown size={13} />}
                label="Exporter notation (JE.json)"
                onClick={handleExportJudgeNotes}
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
