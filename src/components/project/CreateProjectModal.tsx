import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { join } from '@tauri-apps/api/path'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronDown, Plus, Settings2, X } from 'lucide-react'
import { createCreateProjectSchema, type CreateProjectFormData } from '@/schemas/projectSchema'
import { SettingsToggle } from '@/components/settings/SettingsToggle'
import { ContestCategoriesEditor } from '@/components/project/ContestCategoriesEditor'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import * as tauri from '@/services/tauri'
import { useI18n } from '@/i18n'
import { rememberRecentProjectPath } from '@/services/recentProjects'
import type { Bareme } from '@/types/bareme'
import type { ClipNamePattern } from '@/types/project'
import { normalizeContestCategoryEditorItems, type ContestCategoryEditorItem } from '@/utils/contestCategory'

const DEFAULT_CLIP_NAME_PATTERN: ClipNamePattern = 'pseudo_clip'

interface ClipNamePatternFieldProps {
  selectedPattern: ClipNamePattern
  errorMessage?: string
  onSelect: (pattern: ClipNamePattern) => void
}

function ClipNamePatternField({
  selectedPattern,
  errorMessage,
  onSelect,
}: ClipNamePatternFieldProps) {
  const { t } = useI18n()
  const options = useMemo<Array<{
    value: ClipNamePattern
    label: string
    example: string
  }>>(() => [
    { value: 'pseudo_clip', label: t('Pseudo - Clip'), example: t('Pseudo - Titre.mp4') },
    { value: 'clip_pseudo', label: t('Clip - Pseudo'), example: t('Titre - Pseudo.mp4') },
  ], [t])

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-300">
        {t('Convention des noms de clips')}
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = selectedPattern === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                isSelected
                  ? 'border-primary-500 bg-primary-600/10 text-primary-200'
                  : 'border-gray-700 bg-surface-dark text-gray-300 hover:border-gray-600 hover:text-white'
              }`}
            >
              <span className="block text-sm font-medium">{option.label}</span>
              <span className="mt-1 block truncate text-[10px] text-gray-500">{option.example}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-1.5 text-[10px] text-gray-500">
        {t("Utilisé pour séparer automatiquement le pseudo et le titre lors de l'import vidéo.")}
      </p>
      {errorMessage ? (
        <p className="mt-1 text-xs text-accent">{errorMessage}</p>
      ) : null}
    </div>
  )
}

interface BaremeFieldProps {
  availableBaremes: Bareme[]
  selectedBareme: Bareme | null
  baremeMenuOpen: boolean
  baremeMenuRef: RefObject<HTMLDivElement | null>
  errorMessage?: string
  onToggleMenu: () => void
  onSelectBareme: (baremeId: string) => void
  onOpenBaremeList: () => void
  onOpenBaremeCreate: () => void
}

function BaremeField({
  availableBaremes,
  selectedBareme,
  baremeMenuOpen,
  baremeMenuRef,
  errorMessage,
  onToggleMenu,
  onSelectBareme,
  onOpenBaremeList,
  onOpenBaremeCreate,
}: BaremeFieldProps) {
  const { t } = useI18n()

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-gray-300">{t('Barème')}</label>
        <div className="flex items-center gap-1">
          <HoverTextTooltip text={t('Gérer les annotations')} className="inline-flex">
            <button
              type="button"
              onClick={onOpenBaremeList}
              aria-label={t('Gérer les annotations')}
              title={t('Gérer les annotations')}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary-400 transition-colors hover:bg-surface-light hover:text-primary-300"
            >
              <Settings2 size={13} />
            </button>
          </HoverTextTooltip>
          <HoverTextTooltip
            text={t('Créer un barème')}
            className="inline-flex"
          >
            <button
              type="button"
              onClick={onOpenBaremeCreate}
              aria-label={t('Créer un barème')}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary-400 transition-colors hover:bg-surface-light hover:text-primary-300"
            >
              <Plus size={14} />
            </button>
          </HoverTextTooltip>
        </div>
      </div>

      <div className="relative" ref={baremeMenuRef}>
        <button
          type="button"
          onClick={onToggleMenu}
          aria-haspopup="listbox"
          aria-expanded={baremeMenuOpen}
          className="flex w-full items-center justify-between rounded-[10px] border border-gray-700 bg-surface-dark px-3 py-2 text-left text-sm text-white transition-colors hover:border-gray-600 focus:border-primary-500 focus:outline-hidden"
        >
          <span className="truncate">
            {selectedBareme
              ? t('{name} ({count} critères, {points} pts)', {
                name: selectedBareme.name,
                count: selectedBareme.criteria.length,
                points: selectedBareme.totalPoints,
              })
              : t('Barème')}
          </span>
          <ChevronDown size={16} className={`ml-3 shrink-0 transition-transform ${baremeMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {baremeMenuOpen ? (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[10px] border border-gray-700 bg-surface shadow-xl">
            <div className="max-h-60 overflow-y-auto py-1">
              {availableBaremes.map((bareme) => {
                const isSelected = bareme.id === selectedBareme?.id

                return (
                  <button
                    key={bareme.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => onSelectBareme(bareme.id)}
                    className={`relative flex w-full items-start justify-between gap-3 px-3 py-2 text-left transition-colors ${
                      isSelected
                        ? 'bg-primary-600/10 text-white'
                        : 'text-gray-300 hover:bg-surface-light'
                    }`}
                  >
                    <span
                      className={`absolute inset-y-1 left-0 w-[2px] rounded-r ${
                        isSelected ? 'bg-primary-500' : 'bg-transparent'
                      }`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 pl-1">
                      <div className="truncate text-sm font-medium">{bareme.name}</div>
                      <div className="mt-0.5 text-[11px] text-gray-500">
                        {t('{count} critères, {points} pts', {
                          count: bareme.criteria.length,
                          points: bareme.totalPoints,
                        })}
                      </div>
                    </div>
                    <span className={`mt-0.5 ${isSelected ? 'text-primary-400' : 'text-transparent'}`}>
                      <Check size={14} />
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>

      {errorMessage ? (
        <p className="mt-1 text-xs text-accent">{errorMessage}</p>
      ) : null}
    </div>
  )
}

function CreateProjectModalContent() {
  const {
    setShowProjectModal,
    setShowBaremeEditor,
    setRequestedBaremeEditorId,
  } = useUIStore()
  const { createProject, updateSettings, setClips } = useProjectStore()
  const { availableBaremes, setBareme } = useNotationStore()
  const { t } = useI18n()
  const createProjectSchema = createCreateProjectSchema(t)
  const [baremeMenuOpen, setBaremeMenuOpen] = useState(false)
  const [contestCategoriesEnabled, setContestCategoriesEnabled] = useState(false)
  const [contestCategoryItems, setContestCategoryItems] = useState<ContestCategoryEditorItem[]>([])
  const baremeMenuRef = useRef<HTMLDivElement>(null)

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      judgeName: '',
      baremeId: availableBaremes[0]?.id || '',
      clipNamePattern: DEFAULT_CLIP_NAME_PATTERN,
    },
  })

  useEffect(() => {
    if (!baremeMenuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (baremeMenuRef.current && !baremeMenuRef.current.contains(event.target as Node)) {
        setBaremeMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [baremeMenuOpen])

  const selectedBaremeId = useWatch({ control, name: 'baremeId' })
  const selectedClipNamePattern = useWatch({ control, name: 'clipNamePattern' }) ?? DEFAULT_CLIP_NAME_PATTERN
  const selectedBareme = useMemo(
    () => availableBaremes.find((bareme) => bareme.id === selectedBaremeId) ?? availableBaremes[0] ?? null,
    [availableBaremes, selectedBaremeId],
  )

  const onSubmit = async (data: CreateProjectFormData) => {
    const selected = availableBaremes.find((entry) => entry.id === data.baremeId)
    if (!selected) return

    createProject(data.name, data.judgeName, data.baremeId)
    setClips([])
    setBareme(selected)
    const normalizedContestCategories = normalizeContestCategoryEditorItems(contestCategoryItems)
    updateSettings({
      hideFinalScoreUntilEnd: Boolean(selected.hideTotalsUntilAllScored),
      clipNamePattern: data.clipNamePattern,
      contestCategoriesEnabled,
      contestCategoryPresets: contestCategoriesEnabled
        ? normalizedContestCategories.presets
        : [],
      contestCategoryColors: contestCategoriesEnabled
        ? normalizedContestCategories.colors
        : {},
    })

    reset()
    setBaremeMenuOpen(false)
    setShowProjectModal(false)

    try {
      const folder = await tauri.getDefaultProjectsFolder()
      const sanitized = data.name.replace(/[<>:"/\\|?*]/g, '_')
      const filePath = await join(folder, `${sanitized}.json`)

      const projectState = useProjectStore.getState()
      projectState.setFilePath(filePath)

      const notationState = useNotationStore.getState()
      const notesData = notationState.getNotesData()
      const projectData = projectState.getProjectData(notesData, notationState.currentBareme)
      if (projectData) {
        await tauri.saveProjectFile(projectData, filePath)
        await rememberRecentProjectPath(filePath)
        projectState.markClean()
      }
    } catch (e) {
      console.error('Failed to auto-save new project:', e)
    }
  }

  const onClose = () => {
    reset()
    setBaremeMenuOpen(false)
    setShowProjectModal(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3" data-context-scope="create-project">
      <div className="w-full max-w-md rounded-xl border border-gray-700 bg-surface p-6 shadow-2xl" data-context-scope="create-project">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{t('Nouveau concours')}</h2>
          <HoverTextTooltip text={t('Fermer')}>
            <button
              onClick={onClose}
              aria-label={t('Fermer')}
              className="rounded-sm p-1 text-gray-400 transition-colors hover:bg-surface-light hover:text-white"
            >
              <X size={18} />
            </button>
          </HoverTextTooltip>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <input type="hidden" {...register('baremeId')} />
          <input type="hidden" {...register('clipNamePattern')} />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              {t('Nom du concours')}
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder={t('ex: Concours Japan Expo')}
              className="w-full rounded-lg border border-gray-700 bg-surface-dark px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-hidden"
            />
            {errors.name ? (
              <p className="mt-1 text-xs text-accent">{errors.name.message}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              {t('Nom du juge')}
            </label>
            <input
              {...register('judgeName')}
              type="text"
              placeholder={t('ex: Netsuma')}
              className="w-full rounded-lg border border-gray-700 bg-surface-dark px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-hidden"
            />
            {errors.judgeName ? (
              <p className="mt-1 text-xs text-accent">{errors.judgeName.message}</p>
            ) : null}
          </div>

          <ClipNamePatternField
            selectedPattern={selectedClipNamePattern}
            errorMessage={errors.clipNamePattern?.message}
            onSelect={(pattern) => setValue('clipNamePattern', pattern, { shouldDirty: true, shouldValidate: true })}
          />

          <div className="rounded-lg border border-gray-700 bg-surface-dark/40 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-200">{t('Activer les catégories concours rapides')}</p>
                <p className="text-[10px] text-gray-500">{t('Ajoute des boutons de catégories au centre de la barre d’actions')}</p>
              </div>
              <SettingsToggle
                checked={contestCategoriesEnabled}
                onChange={() => setContestCategoriesEnabled((current) => !current)}
              />
            </div>
            {contestCategoriesEnabled ? (
              <div className="mt-2.5">
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  {t('Catégories et couleurs')}
                </label>
                <ContestCategoriesEditor
                  items={contestCategoryItems}
                  onChange={setContestCategoryItems}
                />
              </div>
            ) : null}
          </div>

          <BaremeField
            availableBaremes={availableBaremes}
            selectedBareme={selectedBareme}
            baremeMenuOpen={baremeMenuOpen}
            baremeMenuRef={baremeMenuRef}
            errorMessage={errors.baremeId?.message}
            onToggleMenu={() => setBaremeMenuOpen((open) => !open)}
            onSelectBareme={(baremeId) => {
              setValue('baremeId', baremeId, { shouldDirty: true, shouldValidate: true })
              setBaremeMenuOpen(false)
            }}
            onOpenBaremeList={() => {
              setRequestedBaremeEditorId(null)
              setShowBaremeEditor(true)
              window.dispatchEvent(new CustomEvent('amv:bareme-open-list'))
            }}
            onOpenBaremeCreate={() => {
              setRequestedBaremeEditorId(null)
              setShowBaremeEditor(true)
              window.dispatchEvent(new CustomEvent('amv:bareme-open-create'))
            }}
          />

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-surface-light px-4 py-2 text-sm text-gray-300 transition-colors hover:text-white"
            >
              {t('Annuler')}
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-500"
            >
              {t('Créer le concours')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CreateProjectModal() {
  const showProjectModal = useUIStore((state) => state.showProjectModal)
  if (!showProjectModal) return null
  return <CreateProjectModalContent />
}
