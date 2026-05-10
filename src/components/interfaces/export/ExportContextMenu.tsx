import {
  Code2,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  MessageSquareText,
  Rows3,
  Table,
  Table2,
} from 'lucide-react'
import type { RefObject } from 'react'
import {
  AppContextMenuItem,
  AppContextMenuPanel,
  AppContextMenuSeparator,
} from '@/components/ui/AppContextMenu'
import { useI18n } from '@/i18n'
import type {
  ExportCaptureOptions,
} from '@/components/interfaces/export/exportInterfaceUtils'
import type {
  ExportLayout,
  ExportMode,
  ExportTableView,
} from '@/components/interfaces/export/types'
import type {
  ResultatsGlobalVariant,
  ResultatsMainView,
} from '@/components/interfaces/resultats/types'

type ExportContainer = (format: 'png' | 'pdf', options: ExportCaptureOptions) => Promise<void>
type ExportTask = () => Promise<void>

interface ExportContextMenuProps {
  panelRef: RefObject<HTMLDivElement | null>
  position: { x: number; y: number }
  layoutMode: ExportLayout
  resultatsMainView: ResultatsMainView
  resultatsGlobalVariant: ResultatsGlobalVariant
  exportCaptureOptions: ExportCaptureOptions
  onSetLayoutMode: (mode: ExportLayout) => void
  onSetExportMode: (mode: ExportMode) => void
  onSetTableView: (view: ExportTableView) => void
  onSetResultatsMainView: (view: ResultatsMainView) => void
  onSetResultatsGlobalVariant: (variant: ResultatsGlobalVariant) => void
  onClose: () => void
  exportContainer: ExportContainer
  exportSpreadsheet: ExportTask
  exportHtml: ExportTask
  exportNotesPdf: ExportTask
  exportJson: ExportTask
}

export function ExportContextMenu({
  panelRef,
  position,
  layoutMode,
  resultatsMainView,
  resultatsGlobalVariant,
  exportCaptureOptions,
  onSetLayoutMode,
  onSetExportMode,
  onSetTableView,
  onSetResultatsMainView,
  onSetResultatsGlobalVariant,
  onClose,
  exportContainer,
  exportSpreadsheet,
  exportHtml,
  exportNotesPdf,
  exportJson,
}: ExportContextMenuProps) {
  const { t } = useI18n()

  const exportAndClose = (task: () => void) => {
    task()
    onClose()
  }

  return (
    <AppContextMenuPanel
      ref={panelRef}
      x={position.x}
      y={position.y}
      minWidthClassName="min-w-[220px]"
    >
      <AppContextMenuItem
        label={t('Discord')}
        icon={MessageSquareText}
        active={layoutMode === 'discord'}
        onClick={() => {
          onSetLayoutMode('discord')
          onClose()
        }}
      />
      <AppContextMenuItem
        label={t('Tableau complet')}
        icon={Table}
        active={layoutMode === 'table'}
        onClick={() => {
          onSetLayoutMode('table')
          onClose()
        }}
      />
      <AppContextMenuItem
        label={t('Affiche créative')}
        icon={Rows3}
        active={layoutMode === 'poster'}
        onClick={() => {
          onSetLayoutMode('poster')
          onClose()
        }}
      />

      {layoutMode === 'table' ? (
        <>
          <AppContextMenuSeparator />
          <AppContextMenuItem
            label={t('Tableau par juge')}
            icon={Table2}
            active={resultatsMainView === 'judge'}
            onClick={() => {
              onSetResultatsMainView('judge')
              onSetExportMode('individual')
              onClose()
            }}
          />
          <AppContextMenuItem
            label={t('Tableau global')}
            icon={Table}
            active={resultatsMainView === 'global'}
            onClick={() => {
              onSetResultatsMainView('global')
              onSetExportMode('grouped')
              onClose()
            }}
          />
          <AppContextMenuItem
            label={t('Liste Top')}
            icon={Rows3}
            active={resultatsMainView === 'top'}
            onClick={() => {
              onSetResultatsMainView('top')
              onSetExportMode('grouped')
              onClose()
            }}
          />
          {resultatsMainView === 'global' ? (
            <>
              <AppContextMenuSeparator />
              <AppContextMenuItem
                label={t('Détaillé')}
                icon={Table}
                active={resultatsGlobalVariant === 'detailed'}
                onClick={() => {
                  onSetResultatsGlobalVariant('detailed')
                  onSetTableView('detailed')
                  onClose()
                }}
              />
              <AppContextMenuItem
                label={t('Par catégorie')}
                icon={Table2}
                active={resultatsGlobalVariant === 'category'}
                onClick={() => {
                  onSetResultatsGlobalVariant('category')
                  onSetTableView('summary')
                  onClose()
                }}
              />
            </>
          ) : null}
        </>
      ) : null}

      {layoutMode === 'discord' ? (
        <>
          <AppContextMenuSeparator />
          <AppContextMenuItem
            label={t('Utilisez les boutons de copie Discord')}
            icon={MessageSquareText}
            disabled
          />
        </>
      ) : (
        <>
          <AppContextMenuSeparator />
          <AppContextMenuItem
            label={t('Exporter PNG')}
            icon={FileImage}
            onClick={() => exportAndClose(() => { exportContainer('png', exportCaptureOptions).catch(() => {}) })}
          />
          <AppContextMenuItem
            label={t('Exporter PDF')}
            icon={FileText}
            onClick={() => exportAndClose(() => { exportContainer('pdf', exportCaptureOptions).catch(() => {}) })}
          />
          {layoutMode === 'table' ? (
            <>
              <AppContextMenuItem
                label={t('Exporter Excel')}
                icon={FileSpreadsheet}
                onClick={() => exportAndClose(() => { exportSpreadsheet().catch(() => {}) })}
              />
              <AppContextMenuItem
                label={t('Exporter HTML/CSS')}
                icon={Code2}
                onClick={() => exportAndClose(() => { exportHtml().catch(() => {}) })}
              />
            </>
          ) : null}
          <AppContextMenuItem
            label={t('Exporter PDF notes')}
            icon={FileText}
            onClick={() => exportAndClose(() => { exportNotesPdf().catch(() => {}) })}
          />
          <AppContextMenuItem
            label={t('Exporter JSON')}
            icon={FileJson}
            onClick={() => exportAndClose(() => { exportJson().catch(() => {}) })}
          />
        </>
      )}
    </AppContextMenuPanel>
  )
}
