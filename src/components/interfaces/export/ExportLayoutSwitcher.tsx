import type { ReactNode } from 'react'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'
import type { ExportLayout } from '@/components/interfaces/export/types'

function SegmentedButton({
  active,
  children,
  onClick,
  tooltip,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
  tooltip: string
}) {
  return (
    <HoverTextTooltip text={tooltip} className="inline-flex">
      <button
        type="button"
        onClick={onClick}
        aria-label={tooltip}
        className={`inline-flex h-6 items-center rounded-md px-2 text-[11px] transition-colors ${
          active
            ? 'bg-surface-dark/80 text-white'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        {children}
      </button>
    </HoverTextTooltip>
  )
}

export function ExportLayoutSwitcher({
  layoutMode,
  onSetLayoutMode,
}: {
  layoutMode: ExportLayout
  onSetLayoutMode: (mode: ExportLayout) => void
}) {
  const { t } = useI18n()

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-0.5">
      <SegmentedButton
        active={layoutMode === 'poster'}
        onClick={() => onSetLayoutMode('poster')}
        tooltip={t('Préparer une affiche visuelle à exporter')}
      >
        {t('Affiche créative')}
      </SegmentedButton>
      <SegmentedButton
        active={layoutMode === 'table'}
        onClick={() => onSetLayoutMode('table')}
        tooltip={t('Exporter les résultats sous forme de tableau')}
      >
        {t('Tableau complet')}
      </SegmentedButton>
    </div>
  )
}
