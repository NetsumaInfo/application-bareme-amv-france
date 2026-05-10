import type { ComponentProps } from 'react'
import { Download } from 'lucide-react'
import MediaInfoPanel from '@/components/player/MediaInfoPanel'
import { FramePreviewTooltip } from '@/components/interfaces/spreadsheet/FramePreviewTooltip'
import { ClipContextMenu } from '@/components/interfaces/spreadsheet/ClipContextMenu'
import { ContestCategorySelectorDialog } from '@/components/interfaces/spreadsheet/ContestCategorySelectorDialog'
import { SpreadsheetTable } from '@/components/interfaces/spreadsheet/SpreadsheetTable'
import { SpreadsheetNotesPanel } from '@/components/interfaces/spreadsheet/SpreadsheetNotesPanel'
import { SpreadsheetToolbar } from '@/components/interfaces/spreadsheet/SpreadsheetToolbar'
import { ClipFavoriteDialog } from '@/components/project/ClipFavoriteDialog'
import { useI18n } from '@/i18n'

interface SpreadsheetLoadedViewProps {
  isDragOver: boolean
  hasClips: boolean
  showQuickActions: boolean
  toolbarProps: ComponentProps<typeof SpreadsheetToolbar>
  tableProps: ComponentProps<typeof SpreadsheetTable>
  notesPanelProps: ComponentProps<typeof SpreadsheetNotesPanel> | null
  framePreviewProps: ComponentProps<typeof FramePreviewTooltip>
  contextMenuProps: ComponentProps<typeof ClipContextMenu>
  favoriteDialogProps: ComponentProps<typeof ClipFavoriteDialog> | null
  contestCategoryDialogProps: ComponentProps<typeof ContestCategorySelectorDialog> | null
  mediaInfoClip: { name: string; path: string } | null
  onCloseMediaInfo: () => void
}

export function SpreadsheetLoadedView({
  isDragOver,
  hasClips,
  showQuickActions,
  toolbarProps,
  tableProps,
  notesPanelProps,
  framePreviewProps,
  contextMenuProps,
  favoriteDialogProps,
  contestCategoryDialogProps,
  mediaInfoClip,
  onCloseMediaInfo,
}: SpreadsheetLoadedViewProps) {
  const { t } = useI18n()
  return (
    <div className={`flex flex-col h-full ${isDragOver ? 'ring-2 ring-primary-300 ring-inset' : ''}`}>
      {isDragOver && hasClips && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 pointer-events-none">
          <div className="flex flex-col items-center gap-2 p-6 rounded-xl bg-surface border-2 border-dashed border-primary-300">
            <Download size={28} className="text-primary-300" />
            <p className="text-primary-300 text-sm font-medium">{t('Déposez pour ajouter des vidéos')}</p>
          </div>
        </div>
      )}

      {showQuickActions && <SpreadsheetToolbar {...toolbarProps} />}
      <SpreadsheetTable {...tableProps} />

      {notesPanelProps && <SpreadsheetNotesPanel {...notesPanelProps} />}

      <FramePreviewTooltip {...framePreviewProps} />
      <ClipContextMenu {...contextMenuProps} />
      {favoriteDialogProps && <ClipFavoriteDialog {...favoriteDialogProps} />}
      {contestCategoryDialogProps && <ContestCategorySelectorDialog {...contestCategoryDialogProps} />}

      {mediaInfoClip && (
        <MediaInfoPanel
          clipName={mediaInfoClip.name}
          filePath={mediaInfoClip.path}
          onClose={onCloseMediaInfo}
        />
      )}
    </div>
  )
}
