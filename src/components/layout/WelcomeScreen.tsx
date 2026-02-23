import { useState, useEffect, useCallback } from 'react'
import { FilePlus, FolderOpen, Folder } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import * as tauri from '@/services/tauri'

interface ProjectListItem {
  name: string
  judgeName: string
  updatedAt: string
  filePath: string
}

export function WelcomeScreen() {
  const { setProjectFromData } = useProjectStore()
  const { loadNotes } = useNotationStore()
  const { setShowProjectModal, setProjectsFolderPath } = useUIStore()
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [folderPath, setFolderPath] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const folder = await tauri.getDefaultProjectsFolder()
        setFolderPath(folder)
        setProjectsFolderPath(folder)

        const list = await tauri.listProjectsInFolder(folder)
        setProjects(
          list.map((project) => ({
            name: project.name,
            judgeName: project.judge_name,
            updatedAt: project.updated_at,
            filePath: project.file_path,
          })),
        )
      } catch (error) {
        console.error('Failed to load projects:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProjects()
  }, [setProjectsFolderPath])

  const openProjectFromFile = useCallback(async (filePath: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await tauri.loadProjectFile(filePath) as any

      setProjectFromData({
        ...data,
        version: typeof data.version === 'string' ? data.version : '1.0',
        project: { ...data.project, filePath },
        baremeId: data.baremeId ?? data.project?.baremeId ?? '',
        clips: Array.isArray(data.clips) ? data.clips : [],
        notes: data.notes ?? {},
      })
      if (data.notes) loadNotes(data.notes)
    } catch (error) {
      console.error('Failed to open project:', error)
      alert("Impossible d'ouvrir ce projet. Il a peut-être été déplacé ou supprimé.")
    }
  }, [setProjectFromData, loadNotes])

  const handleOpenProject = async () => {
    try {
      const filePath = await tauri.openProjectDialog()
      if (!filePath) return
      await openProjectFromFile(filePath)
    } catch (error) {
      console.error('Failed to open project:', error)
      alert(`Erreur lors de l'ouverture: ${error}`)
    }
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-white mb-1">AMV Notation</h2>
          <p className="text-gray-500 text-sm">Outil de notation pour compétitions AMV</p>
        </div>

        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setShowProjectModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
          >
            <FilePlus size={16} />
            Nouveau projet
          </button>
          <button
            onClick={handleOpenProject}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface hover:bg-surface-light text-gray-300 hover:text-white text-sm font-medium transition-colors border border-gray-700"
          >
            <FolderOpen size={16} />
            Ouvrir un projet
          </button>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 text-sm py-4">Chargement des projets...</div>
        ) : projects.length > 0 ? (
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">
              <Folder size={12} />
              Projets
            </h3>
            <div className="space-y-1">
              {projects.map((project) => (
                <button
                  key={project.filePath}
                  onClick={() => openProjectFromFile(project.filePath)}
                  className="w-full text-left px-3 py-2.5 rounded-lg bg-surface/50 hover:bg-surface-light border border-gray-800 hover:border-gray-700 transition-colors group flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{project.name}</div>
                    <div className="text-[10px] text-gray-500 truncate">
                      {project.judgeName && (
                        <span className="text-gray-400">
                          {project.judgeName} —{' '}
                        </span>
                      )}
                      {formatDate(project.updatedAt)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {folderPath && (
          <div className="mt-6 text-center">
            <p className="text-[9px] text-gray-600 truncate" title={folderPath}>
              Dossier : {folderPath}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
