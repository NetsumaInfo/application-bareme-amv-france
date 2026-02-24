import type { ReactNode } from 'react'
import type {
  ResultatsGlobalVariant,
  ResultatsMainView,
} from '@/components/interfaces/resultats/types'

interface ResultatsViewModeControlsProps {
  mainView: ResultatsMainView
  onMainViewChange: (view: ResultatsMainView) => void
  globalVariant: ResultatsGlobalVariant
  onGlobalVariantChange: (variant: ResultatsGlobalVariant) => void
}

function SegmentedButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1.5 rounded-md text-xs border transition-colors ${
        active
          ? 'bg-primary-600/18 border-primary-500/55 text-primary-200'
          : 'bg-surface-dark border-gray-700 text-gray-300 hover:text-white hover:border-gray-600'
      }`}
    >
      {children}
    </button>
  )
}

export function ResultatsViewModeControls({
  mainView,
  onMainViewChange,
  globalVariant,
  onGlobalVariantChange,
}: ResultatsViewModeControlsProps) {
  return (
    <div className="rounded-lg border border-gray-700 bg-surface-dark/60 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedButton active={mainView === 'judge'} onClick={() => onMainViewChange('judge')}>
          Tableau par juge
        </SegmentedButton>
        <SegmentedButton active={mainView === 'global'} onClick={() => onMainViewChange('global')}>
          Tableau global
        </SegmentedButton>
        <SegmentedButton active={mainView === 'top'} onClick={() => onMainViewChange('top')}>
          Liste Top
        </SegmentedButton>
      </div>

      {mainView === 'global' && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <SegmentedButton active={globalVariant === 'detailed'} onClick={() => onGlobalVariantChange('detailed')}>
            Detaillé
          </SegmentedButton>
          <SegmentedButton active={globalVariant === 'category'} onClick={() => onGlobalVariantChange('category')}>
            Par categorie
          </SegmentedButton>
        </div>
      )}
    </div>
  )
}
