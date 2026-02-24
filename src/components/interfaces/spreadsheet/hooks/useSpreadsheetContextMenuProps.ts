import type { ComponentProps, MutableRefObject } from 'react'
import type { ClipContextMenu } from '@/components/interfaces/spreadsheet/ClipContextMenu'
import type { Clip } from '@/types/project'
import type { ShortcutAction } from '@/utils/shortcuts'

interface UseSpreadsheetContextMenuPropsParams {
  contextMenu: { clipId: string; x: number; y: number } | null
  contextClip: Clip | null
  currentClip: Clip | undefined
  showMiniatures: boolean
  shortcutBindings: Record<ShortcutAction, string>
  contextMenuRef: MutableRefObject<HTMLDivElement | null>
  handleToggleScored: (clip: Clip) => void
  handleOpenNotes: (clip: Clip) => void
  handleAttachVideo: (clip: Clip) => void
  handleSetMiniatureFromCurrentFrame: (clip: Clip) => void
  handleResetMiniature: (clip: Clip) => void
  handleToggleMiniatures: () => void
  handleShowMediaInfo: (clip: Clip) => void
  handleRemoveClip: (clip: Clip) => void
}

export function buildSpreadsheetContextMenuProps({
  contextMenu,
  contextClip,
  currentClip,
  showMiniatures,
  shortcutBindings,
  contextMenuRef,
  handleToggleScored,
  handleOpenNotes,
  handleAttachVideo,
  handleSetMiniatureFromCurrentFrame,
  handleResetMiniature,
  handleToggleMiniatures,
  handleShowMediaInfo,
  handleRemoveClip,
}: UseSpreadsheetContextMenuPropsParams): ComponentProps<typeof ClipContextMenu> {
  return {
    contextMenu,
    contextClip,
    currentClipId: currentClip?.id,
    showMiniatures,
    shortcutBindings,
    contextMenuRef,
    onToggleScored: handleToggleScored,
    onOpenNotes: handleOpenNotes,
    onAttachVideo: handleAttachVideo,
    onSetMiniatureFromCurrentFrame: handleSetMiniatureFromCurrentFrame,
    onResetMiniature: handleResetMiniature,
    onToggleMiniatures: handleToggleMiniatures,
    onShowMediaInfo: handleShowMediaInfo,
    onRemoveClip: handleRemoveClip,
  }
}
