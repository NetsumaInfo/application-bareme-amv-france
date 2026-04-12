import { useEffect, useState } from 'react'
import { getDefaultBaremesFolder } from '@/services/tauri'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import { duplicateBareme } from '@/components/scoring/bareme/baremeEditorStateUtils'
import { useBaremeEditorEvents } from '@/components/scoring/bareme/useBaremeEditorEvents'
import { useBaremeEditorForm } from '@/components/scoring/bareme/useBaremeEditorForm'
import { useBaremeJsonTransfer } from '@/components/scoring/bareme/useBaremeJsonTransfer'
import { useI18n } from '@/i18n'
import type { Bareme } from '@/types/bareme'

type BaremeEditorMode = 'list' | 'edit'

export function useBaremeEditorState() {
  const { t } = useI18n()
  const {
    showBaremeEditor,
    setShowBaremeEditor,
    requestedBaremeEditorId,
    setRequestedBaremeEditorId,
    baremesFolderPath,
    setBaremesFolderPath,
  } = useUIStore()
  const { addBareme, availableBaremes, removeBareme } = useNotationStore()

  const [mode, setMode] = useState<BaremeEditorMode>('list')
  const {
    editingBareme,
    readOnly,
    name,
    description,
    criteria,
    categoryStats,
    categoryOrder,
    categoryColors,
    globalStep,
    hideTotalsUntilAllScored,
    spotlightCriterionId,
    error,
    getCategoryColor,
    startEdit: startEditForm,
    setName,
    setDescription,
    setGlobalStep,
    setHideTotalsUntilAllScored,
    moveCategory,
    moveCriterion,
    removeCriterion,
    updateCriterion,
    updateCategoryForCriterion,
    commitCategoryColor,
    setCategoryColor,
    applyGlobalStep,
    addCriterion,
    saveBareme,
    resetForm,
  } = useBaremeEditorForm({ addBareme })

  const { handleImportBaremeJson, handleExportBaremeJson } = useBaremeJsonTransfer({
    availableBaremes,
    addBareme,
    onDropImportSuccess: () => {
      setMode('list')
    },
  })

  useBaremeEditorEvents({
    setShowBaremeEditor,
    resetForm,
    setMode,
  })

  useEffect(() => {
    if (!showBaremeEditor || !requestedBaremeEditorId) return
    const targetBareme = availableBaremes.find((bareme) => bareme.id === requestedBaremeEditorId)
    if (!targetBareme) return
    queueMicrotask(() => {
      startEditForm(targetBareme)
      setMode('edit')
      setRequestedBaremeEditorId(null)
    })
  }, [
    availableBaremes,
    requestedBaremeEditorId,
    setRequestedBaremeEditorId,
    showBaremeEditor,
    startEditForm,
  ])

  useEffect(() => {
    getDefaultBaremesFolder()
      .then((path) => {
        setBaremesFolderPath(path)
      })
      .catch((errorValue) => {
        console.error('Failed to load baremes folder path:', errorValue)
      })
  }, [setBaremesFolderPath])

  const onClose = () => {
    setShowBaremeEditor(false)
    setRequestedBaremeEditorId(null)
    setMode('list')
    resetForm()
  }

  const startNew = () => {
    resetForm()
    setMode('edit')
  }

  const startEdit = (bareme: Bareme) => {
    startEditForm(bareme)
    setMode('edit')
  }

  const handleDelete = (baremeId: string) => {
    if (confirm(t('Supprimer ce barème ?'))) {
      removeBareme(baremeId)
    }
  }

  const handleDuplicate = (bareme: Bareme) => {
    addBareme(duplicateBareme(bareme))
  }
  const handleSave = () => {
    const saved = saveBareme()
    if (!saved) return
    setMode('list')
    resetForm()
  }

  return {
    showBaremeEditor,
    availableBaremes,
    baremesFolderPath,
    mode,
    setMode,
    editingBareme,
    readOnly,
    name,
    description,
    criteria,
    categoryStats,
    categoryOrder,
    categoryColors,
    globalStep,
    hideTotalsUntilAllScored,
    spotlightCriterionId,
    error,
    getCategoryColor,
    onClose,
    startNew,
    startEdit,
    handleDelete,
    handleDuplicate,
    handleImportBaremeJson,
    handleExportBaremeJson,
    setName,
    setDescription,
    setGlobalStep,
    setHideTotalsUntilAllScored,
    moveCategory,
    moveCriterion,
    removeCriterion,
    updateCriterion,
    updateCategoryForCriterion,
    commitCategoryColor,
    setCategoryColor,
    applyGlobalStep,
    addCriterion,
    handleSave,
    resetForm,
  }
}
