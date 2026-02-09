import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Settings2 } from 'lucide-react'
import { createProjectSchema, type CreateProjectFormData } from '@/schemas/projectSchema'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import * as tauri from '@/services/tauri'

export default function CreateProjectModal() {
  const { showProjectModal, setShowProjectModal, setShowBaremeEditor } = useUIStore()
  const { createProject } = useProjectStore()
  const { availableBaremes, setBareme } = useNotationStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      judgeName: '',
      baremeId: availableBaremes[0]?.id || '',
    },
  })

  if (!showProjectModal) return null

  const onSubmit = async (data: CreateProjectFormData) => {
    createProject(data.name, data.judgeName, data.baremeId)
    const bareme = availableBaremes.find((b) => b.id === data.baremeId)
    if (bareme) setBareme(bareme)
    reset()
    setShowProjectModal(false)

    // Auto-save to projects folder
    try {
      const folder = useUIStore.getState().projectsFolderPath
        || await tauri.getDefaultProjectsFolder()
      const sanitized = data.name.replace(/[<>:"/\\|?*]/g, '_')
      const filePath = `${folder}\\${sanitized}.json`

      const projectState = useProjectStore.getState()
      projectState.setFilePath(filePath)

      const notationState = useNotationStore.getState()
      const notesData = notationState.getNotesData()
      const projectData = projectState.getProjectData(notesData)
      if (projectData) {
        await tauri.saveProjectFile(projectData, filePath)
        projectState.markClean()
      }
    } catch (e) {
      console.error('Failed to auto-save new project:', e)
    }
  }

  const onClose = () => {
    reset()
    setShowProjectModal(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Nouveau Projet</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nom du projet
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="ex: Concours AMV 2026"
              className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none text-sm"
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-accent mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nom du juge
            </label>
            <input
              {...register('judgeName')}
              type="text"
              placeholder="ex: Redrum"
              className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none text-sm"
            />
            {errors.judgeName && (
              <p className="text-xs text-accent mt-1">{errors.judgeName.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-300">Barème</label>
              <button
                type="button"
                onClick={() => setShowBaremeEditor(true)}
                className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
              >
                <Settings2 size={12} />
                Gérer les barèmes
              </button>
            </div>
            <select
              {...register('baremeId')}
              className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-white focus:border-primary-500 focus:outline-none text-sm"
            >
              {availableBaremes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.criteria.length} critères, {b.totalPoints} pts)
                  {b.isOfficial ? ' - Officiel' : ''}
                </option>
              ))}
            </select>
            {errors.baremeId && (
              <p className="text-xs text-accent mt-1">{errors.baremeId.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-surface-light text-gray-300 hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors"
            >
              Créer le projet
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
