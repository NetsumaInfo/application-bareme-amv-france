import { useState, useEffect, useCallback } from 'react'
import { FilePlus, FolderOpen, Folder, Trash2 } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import * as tauri from '@/services/tauri'
import { forgetRecentProjectPath, listRecentProjectPaths, rememberRecentProjectPath, setRecentProjectPaths } from '@/services/recentProjects'
import { loadAndApplyProjectFile } from '@/services/projectSession'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { ProjectDeletionConfirmDialog } from '@/components/project/ProjectDeletionConfirmDialog'
import { useI18n } from '@/i18n'

interface ProjectListItem {
  name: string
  judgeName: string
  updatedAt: string
  filePath: string
}

interface WelcomeScreenState {
  projects: ProjectListItem[]
  folderPath: string
  loading: boolean
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
  const configuredProjectsFolderPath = useUIStore((state) => state.projectsFolderPath)
  const { t, formatDate } = useI18n()
  const [{ projects, folderPath, loading }, setScreenState] = useState<WelcomeScreenState>({
    projects: [],
    folderPath: '',
    loading: true,
  })
  const [projectToDelete, setProjectToDelete] = useState<ProjectListItem | null>(null)
  const [isDeletingProject, setIsDeletingProject] = useState(false)
  const applyLoadedProjects = useCallback((nextFolderPath: string, nextProjects: ProjectListItem[]) => {
    setScreenState({
      projects: nextProjects,
      folderPath: nextFolderPath,
      loading: false,
    })
  }, [])
  const finishLoading = useCallback(() => {
    setScreenState((current) => ({
      ...current,
      loading: false,
    }))
  }, [])

  useEffect(() => {
    if (!folderPath) return
    setProjectsFolderPath(folderPath)
  }, [folderPath, setProjectsFolderPath])

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const folder = await tauri.getDefaultProjectsFolder()

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
        applyLoadedProjects(folder, mergedProjects)
      } catch (error) {
        console.error('Failed to load projects:', error)
        finishLoading()
      }
    }
    loadProjects()
  }, [applyLoadedProjects, configuredProjectsFolderPath, finishLoading, t])

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

  const handleRequestProjectDeletion = useCallback((project: ProjectListItem) => {
    setProjectToDelete(project)
  }, [])

  const handleCancelProjectDeletion = useCallback(() => {
    if (isDeletingProject) return
    setProjectToDelete(null)
  }, [isDeletingProject])

  const handleConfirmProjectDeletion = useCallback(async () => {
    if (!projectToDelete || isDeletingProject) return

    const filePath = projectToDelete.filePath
    setIsDeletingProject(true)

    try {
      await tauri.deleteProjectFile(filePath)
      setScreenState((current) => ({
        ...current,
        projects: current.projects.filter((project) => project.filePath !== filePath),
      }))
      setProjectToDelete(null)
      void forgetRecentProjectPath(filePath).catch((recentError) => {
        console.error('Failed to update recent projects after deletion:', recentError)
      })
    } catch (error) {
      console.error('Failed to delete project:', error)
      alert(t('Impossible de supprimer ce projet: {error}', { error: String(error) }))
    } finally {
      setIsDeletingProject(false)
    }
  }, [isDeletingProject, projectToDelete, t])

  return (
    <div className="relative flex-1 flex items-center justify-center" data-context-scope="welcome">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <p className="text-gray-500 text-sm">{t('Outil de notation pour compétitions AMV')}</p>
        </div>

        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setShowProjectModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
          >
            <FilePlus size={16} />
            {t('Nouveau projet')}
          </button>
          <button
            onClick={handleOpenProject}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-surface hover:bg-surface-light text-gray-300 hover:text-white text-sm font-medium transition-colors border border-gray-700"
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
                <div
                  key={project.filePath}
                  className="flex items-stretch gap-2 rounded-lg border border-gray-800 bg-surface/50 p-0.5 transition-colors hover:border-gray-700 hover:bg-surface-light"
                >
                  <button
                    type="button"
                    onClick={() => openProjectFromFile(project.filePath)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-black/10"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-white truncate">{project.name}</div>
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
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleRequestProjectDeletion(project)
                    }}
                    aria-label={t('Supprimer ce projet')}
                    className="flex w-9 shrink-0 items-center justify-center rounded-md bg-transparent text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {folderPath && (
          <div className="mt-6 text-center">
            <HoverTextTooltip text={folderPath}>
              <p className="text-[9px] text-gray-600 truncate">
                {t('Dossier : {path}', { path: folderPath })}
              </p>
            </HoverTextTooltip>
          </div>
        )}
      </div>

      {projectToDelete ? (
        <ProjectDeletionConfirmDialog
          projectName={projectToDelete.name}
          projectDetails={[
            projectToDelete.judgeName.trim(),
            formatDate(projectToDelete.updatedAt, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
          ].filter(Boolean).join(' — ')}
          isDeleting={isDeletingProject}
          onCancel={handleCancelProjectDeletion}
          onConfirm={handleConfirmProjectDeletion}
        />
      ) : null}
    </div>
  )
}
