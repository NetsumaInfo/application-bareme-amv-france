import type { ReactNode } from 'react'
import { useI18n } from '@/i18n'
import type { ExportLayout } from '@/components/interfaces/export/types'

function SegmentedButton({
  active,
  children,
  onClick,
  ariaLabel,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex h-6 items-center rounded-md px-2 text-[11px] transition-colors ${
        active
          ? 'bg-surface-dark/80 text-white'
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {children}
    </button>
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
        active={layoutMode === 'discord'}
        onClick={() => onSetLayoutMode('discord')}
        ariaLabel={t('Discord')}
      >
        {t('Discord')}
      </SegmentedButton>
      <SegmentedButton
        active={layoutMode === 'poster'}
        onClick={() => onSetLayoutMode('poster')}
        ariaLabel={t('Affiche créative')}
      >
        {t('Affiche créative')}
      </SegmentedButton>
      <SegmentedButton
        active={layoutMode === 'table'}
        onClick={() => onSetLayoutMode('table')}
        ariaLabel={t('Tableau complet')}
      >
        {t('Tableau complet')}
      </SegmentedButton>
    </div>
  )
}
