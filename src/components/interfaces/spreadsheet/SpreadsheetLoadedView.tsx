import type { ComponentProps } from 'react'
import { Download } from 'lucide-react'
import MediaInfoPanel from '@/components/player/MediaInfoPanel'
import { FramePreviewTooltip } from '@/components/interfaces/spreadsheet/FramePreviewTooltip'
import { ClipContextMenu } from '@/components/interfaces/spreadsheet/ClipContextMenu'
import { CategoryScoringModal } from '@/components/interfaces/spreadsheet/CategoryScoringModal'
import { SpreadsheetTable } from '@/components/interfaces/spreadsheet/SpreadsheetTable'
import { SpreadsheetNotesPanel } from '@/components/interfaces/spreadsheet/SpreadsheetNotesPanel'
import { SpreadsheetToolbar } from '@/components/interfaces/spreadsheet/SpreadsheetToolbar'

interface SpreadsheetLoadedViewProps {
  isDragOver: boolean
  hasClips: boolean
  toolbarProps: ComponentProps<typeof SpreadsheetToolbar>
  tableProps: ComponentProps<typeof SpreadsheetTable>
  notesPanelProps: ComponentProps<typeof SpreadsheetNotesPanel> | null
  framePreviewProps: ComponentProps<typeof FramePreviewTooltip>
  contextMenuProps: ComponentProps<typeof ClipContextMenu>
  mediaInfoClip: { name: string; path: string } | null
  onCloseMediaInfo: () => void
  categoryScoringModalProps: ComponentProps<typeof CategoryScoringModal>
}

export function SpreadsheetLoadedView({
  isDragOver,
  hasClips,
  toolbarProps,
  tableProps,
  notesPanelProps,
  framePreviewProps,
  contextMenuProps,
  mediaInfoClip,
  onCloseMediaInfo,
  categoryScoringModalProps,
}: SpreadsheetLoadedViewProps) {
  return (
    <div className={`flex flex-col h-full ${isDragOver ? 'ring-2 ring-primary-400 ring-inset' : ''}`}>
      {isDragOver && hasClips && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 pointer-events-none">
          <div className="flex flex-col items-center gap-2 p-6 rounded-xl bg-surface border-2 border-dashed border-primary-400">
            <Download size={28} className="text-primary-400" />
            <p className="text-primary-400 text-sm font-medium">Déposez pour ajouter des vidéos</p>
          </div>
        </div>
      )}

      <SpreadsheetToolbar {...toolbarProps} />
      <SpreadsheetTable {...tableProps} />

      {notesPanelProps && <SpreadsheetNotesPanel {...notesPanelProps} />}

      <FramePreviewTooltip {...framePreviewProps} />
      <ClipContextMenu {...contextMenuProps} />

      {mediaInfoClip && (
        <MediaInfoPanel
          clipName={mediaInfoClip.name}
          filePath={mediaInfoClip.path}
          onClose={onCloseMediaInfo}
        />
      )}

      <CategoryScoringModal {...categoryScoringModalProps} />
    </div>
  )
}
