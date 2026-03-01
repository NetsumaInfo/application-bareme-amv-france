import { useState, useEffect, useCallback } from 'react'
import { FilePlus, FolderOpen, Folder } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import * as tauri from '@/services/tauri'
import { listRecentProjectPaths, rememberRecentProjectPath, setRecentProjectPaths } from '@/services/recentProjects'
import { loadAndApplyProjectFile } from '@/services/projectSession'
import { useI18n } from '@/i18n'

interface ProjectListItem {
  name: string
  judgeName: string
  updatedAt: string
  filePath: string
}

function mapSummaryToProjectListItem(project: tauri.ProjectSummary): ProjectListItem {
  return {
    name: project.name,
    judgeName: project.judge_name,
    updatedAt: project.updated_at,
    filePath: project.file_path,
  }
}

function parseIsoDate(value: string): number {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function WelcomeScreen() {
  const { setShowProjectModal, setProjectsFolderPath } = useUIStore()
  const { t, formatDate } = useI18n()
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
        const byPath = new Map<string, ProjectListItem>(
          list.map((project) => {
            const mapped = mapSummaryToProjectListItem(project)
            return [mapped.filePath, mapped] as const
          }),
        )

        const recentPaths = await listRecentProjectPaths()
        const missingPaths = recentPaths.filter((path) => !byPath.has(path))

        const loadedRecent = await Promise.all(
          missingPaths.map(async (path) => {
            try {
              const data = await tauri.loadProjectFile(path) as {
                project?: {
                  name?: string
                  judgeName?: string
                  judge_name?: string
                  updatedAt?: string
                  updated_at?: string
                }
              }
              return {
                name: data.project?.name?.trim() || t('Sans nom'),
                judgeName: data.project?.judgeName || data.project?.judge_name || '',
                updatedAt: data.project?.updatedAt || data.project?.updated_at || '',
                filePath: path,
              } satisfies ProjectListItem
            } catch {
              return null
            }
          }),
        )

        for (const recentProject of loadedRecent) {
          if (!recentProject) continue
          byPath.set(recentProject.filePath, recentProject)
        }

        const mergedProjects = Array.from(byPath.values()).sort(
          (a, b) => parseIsoDate(b.updatedAt) - parseIsoDate(a.updatedAt),
        )
        const validRecentPaths = recentPaths.filter((path) => byPath.has(path))
        if (validRecentPaths.length !== recentPaths.length) {
          await setRecentProjectPaths(validRecentPaths)
        }
        setProjects(mergedProjects)
      } catch (error) {
        console.error('Failed to load projects:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProjects()
  }, [setProjectsFolderPath, t])

  const openProjectFromFile = useCallback(async (filePath: string) => {
    try {
      await loadAndApplyProjectFile(filePath)
      await rememberRecentProjectPath(filePath)
    } catch (error) {
      console.error('Failed to open project:', error)
      alert(t("Impossible d'ouvrir ce projet. Il a peut-être été déplacé ou supprimé."))
    }
  }, [t])

  const handleOpenProject = async () => {
    try {
      const filePath = await tauri.openProjectDialog()
      if (!filePath) return
      await openProjectFromFile(filePath)
    } catch (error) {
      console.error('Failed to open project:', error)
      alert(t("Erreur lors de l'ouverture: {error}", { error: String(error) }))
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center" data-context-scope="welcome">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-white mb-1">AMV Notation</h2>
          <p className="text-gray-500 text-sm">{t('Outil de notation pour compétitions AMV')}</p>
        </div>

        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setShowProjectModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
          >
            <FilePlus size={16} />
            {t('Nouveau projet')}
          </button>
          <button
            onClick={handleOpenProject}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface hover:bg-surface-light text-gray-300 hover:text-white text-sm font-medium transition-colors border border-gray-700"
          >
            <FolderOpen size={16} />
            {t('Ouvrir un projet')}
          </button>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 text-sm py-4">{t('Chargement des projets...')}</div>
        ) : projects.length > 0 ? (
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">
              <Folder size={12} />
              {t('Projets')}
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
                      {formatDate(project.updatedAt, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
              {t('Dossier : {path}', { path: folderPath })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
