import { useState } from 'react'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import { duplicateBareme } from '@/components/scoring/bareme/baremeEditorStateUtils'
import { useBaremeEditorEvents } from '@/components/scoring/bareme/useBaremeEditorEvents'
import { useBaremeEditorForm } from '@/components/scoring/bareme/useBaremeEditorForm'
import { useBaremeJsonTransfer } from '@/components/scoring/bareme/useBaremeJsonTransfer'
import type { Bareme } from '@/types/bareme'

type BaremeEditorMode = 'list' | 'edit'

export function useBaremeEditorState() {
  const { showBaremeEditor, setShowBaremeEditor } = useUIStore()
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
  })

  useBaremeEditorEvents({
    setShowBaremeEditor,
    resetForm,
    setMode,
  })

  const onClose = () => {
    setShowBaremeEditor(false)
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
    if (confirm('Supprimer ce bareme ?')) {
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
