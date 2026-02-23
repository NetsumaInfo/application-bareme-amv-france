interface BaremeQuickActionsBarProps {
  globalStep: number
  onGlobalStepChange: (value: number) => void
  onApplyGlobalStep: () => void
  onAddCriterion: () => void
}

export function BaremeQuickActionsBar({
  globalStep,
  onGlobalStepChange,
  onApplyGlobalStep,
  onAddCriterion,
}: BaremeQuickActionsBarProps) {
  return (
    <div className="sticky bottom-0 z-10 px-3 py-2.5 border border-gray-700 rounded-lg bg-surface/95 supports-[backdrop-filter]:bg-surface/80">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-gray-400">Actions rapides</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={globalStep}
              onChange={(event) => onGlobalStepChange(Number(event.target.value))}
              className="w-16 px-2 py-1 rounded border border-gray-700 bg-surface text-xs text-white text-center focus:border-primary-500 focus:outline-none"
              title="Pas global"
            />
            <button
              onClick={onApplyGlobalStep}
              className="px-2 py-1 text-xs rounded border border-gray-700 text-gray-300 hover:text-white hover:border-primary-500 transition-colors"
            >
              Appliquer partout
            </button>
          </div>
          <button
            onClick={onAddCriterion}
            className="px-2.5 py-1 text-xs rounded border border-primary-500/40 text-primary-300 hover:text-primary-200 hover:border-primary-400 transition-colors"
          >
            Ajouter un critère
          </button>
        </div>
      </div>
    </div>
  )
}
