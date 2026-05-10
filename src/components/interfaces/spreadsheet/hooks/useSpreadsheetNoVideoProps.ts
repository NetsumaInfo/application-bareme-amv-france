import { useMemo } from 'react'
import type { ComponentProps } from 'react'
import type { NoVideoState } from '@/components/interfaces/spreadsheet/NoVideoState'
import type { ClipNamePattern } from '@/types/project'
import { useI18n } from '@/i18n'
import {
  ALL_CONTEST_CATEGORY_KEY,
  getContestCategoryColor,
  normalizeContestCategoryPresets,
} from '@/utils/contestCategory'

interface UseSpreadsheetNoVideoPropsParams {
  isDragOver: boolean
  clipNamePattern: ClipNamePattern
  contestCategoriesEnabled: boolean
  contestCategoryPresets: string[]
  contestCategoryColors: Record<string, string>
  activeContestCategoryView: string
  onSelectContestCategoryView: (categoryKey: string) => void
  showNoVideoTableModal: boolean
  noVideoTableAccepted: boolean
  noVideoTableInput: string
  noVideoTableError: string | null
  handleImportFolder: () => void
  handleImportFiles: () => void
  setShowNoVideoTableModal: (value: boolean) => void
  setNoVideoTableError: (value: string | null) => void
  resetNoVideoTableModal: () => void
  setNoVideoTableAccepted: (value: boolean) => void
  setNoVideoTableInput: (value: string) => void
  handleCreateNoVideoTable: () => void
}

export function useSpreadsheetNoVideoProps({
  isDragOver,
  clipNamePattern,
  contestCategoriesEnabled,
  contestCategoryPresets,
  contestCategoryColors,
  activeContestCategoryView,
  onSelectContestCategoryView,
  showNoVideoTableModal,
  noVideoTableAccepted,
  noVideoTableInput,
  noVideoTableError,
  handleImportFolder,
  handleImportFiles,
  setShowNoVideoTableModal,
  setNoVideoTableError,
  resetNoVideoTableModal,
  setNoVideoTableAccepted,
  setNoVideoTableInput,
  handleCreateNoVideoTable,
}: UseSpreadsheetNoVideoPropsParams): ComponentProps<typeof NoVideoState> {
  const { t } = useI18n()
  const normalizedContestPresets = useMemo(
    () => normalizeContestCategoryPresets(contestCategoryPresets),
    [contestCategoryPresets],
  )

  const contestCategoryTabs = useMemo(() => {
    if (!contestCategoriesEnabled || normalizedContestPresets.length === 0) return []
    return [
      {
        key: ALL_CONTEST_CATEGORY_KEY,
        label: t('Toutes catégories'),
        color: 'rgb(var(--color-primary-500) / 0.85)',
      },
      ...normalizedContestPresets.map((category, index) => ({
        key: category,
        label: category,
        color: getContestCategoryColor(category, contestCategoryColors, index),
      })),
    ]
  }, [contestCategoriesEnabled, contestCategoryColors, normalizedContestPresets, t])

  return useMemo(() => ({
    isDragOver,
    clipNamePattern,
    contestCategoryTabs,
    activeContestCategoryView,
    showNoVideoTableModal,
    noVideoTableAccepted,
    noVideoTableInput,
    noVideoTableError,
    onSelectContestCategoryView,
    onImportFolder: handleImportFolder,
    onImportFiles: handleImportFiles,
    onOpenNoVideoModal: () => {
      setShowNoVideoTableModal(true)
      setNoVideoTableError(null)
    },
    onCloseNoVideoModal: resetNoVideoTableModal,
    onNoVideoTableAcceptedChange: setNoVideoTableAccepted,
    onNoVideoTableInputChange: (nextValue: string) => {
      setNoVideoTableInput(nextValue)
      if (noVideoTableError) setNoVideoTableError(null)
    },
    onCreateNoVideoTable: handleCreateNoVideoTable,
  }), [
    handleCreateNoVideoTable,
    handleImportFiles,
    handleImportFolder,
    isDragOver,
    activeContestCategoryView,
    clipNamePattern,
    contestCategoryTabs,
    noVideoTableAccepted,
    noVideoTableError,
    noVideoTableInput,
    onSelectContestCategoryView,
    resetNoVideoTableModal,
    setNoVideoTableAccepted,
    setNoVideoTableError,
    setNoVideoTableInput,
    setShowNoVideoTableModal,
    showNoVideoTableModal,
  ])
}
