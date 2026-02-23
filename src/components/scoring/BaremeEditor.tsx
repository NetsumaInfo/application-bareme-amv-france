import { X } from 'lucide-react'
import { BaremeEditView } from '@/components/scoring/bareme/BaremeEditView'
import { BaremeListView } from '@/components/scoring/bareme/BaremeListView'
import { useBaremeEditorState } from '@/components/scoring/bareme/useBaremeEditorState'

export default function BaremeEditor() {
  const {
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
  } = useBaremeEditorState()

  if (!showBaremeEditor) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-gray-700">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <h2 className="text-base font-semibold text-white">
            {mode === 'list'
              ? 'Barèmes'
              : readOnly
                ? 'Consultation du barème'
                : editingBareme
                  ? 'Modifier le barème'
                  : 'Nouveau barème'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {mode === 'list' ? (
            <BaremeListView
              availableBaremes={availableBaremes}
              onCreate={startNew}
              onImportJson={handleImportBaremeJson}
              onEdit={startEdit}
              onDuplicate={handleDuplicate}
              onExportJson={handleExportBaremeJson}
              onDelete={handleDelete}
            />
          ) : (
            <BaremeEditView
              readOnly={readOnly}
              name={name}
              description={description}
              criteria={criteria}
              categoryStats={categoryStats}
              categoryOrder={categoryOrder}
              categoryColors={categoryColors}
              globalStep={globalStep}
              hideTotalsUntilAllScored={hideTotalsUntilAllScored}
              error={error}
              getCategoryColor={getCategoryColor}
              onNameChange={setName}
              onDescriptionChange={setDescription}
              onGlobalStepChange={setGlobalStep}
              onHideTotalsChange={setHideTotalsUntilAllScored}
              onMoveCategory={moveCategory}
              onMoveCriterion={moveCriterion}
              onRemoveCriterion={removeCriterion}
              onUpdateCriterion={updateCriterion}
              onUpdateCriterionCategory={updateCategoryForCriterion}
              onCommitCategoryColor={commitCategoryColor}
              onSetCategoryColor={setCategoryColor}
              onApplyGlobalStep={applyGlobalStep}
              onAddCriterion={addCriterion}
            />
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700">
          {mode === 'edit' ? (
            <>
              <button
                onClick={() => {
                  setMode('list')
                  resetForm()
                }}
                className="px-4 py-2 text-sm rounded-lg bg-surface-light text-gray-300 hover:text-white transition-colors"
              >
                Retour
              </button>
              {!readOnly && (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors"
                >
                  {editingBareme ? 'Enregistrer' : 'Créer le barème'}
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-surface-light text-gray-300 hover:text-white transition-colors"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
