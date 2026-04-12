import type { ComponentProps, MutableRefObject } from 'react'
import type { ClipContextMenu } from '@/components/interfaces/spreadsheet/ClipContextMenu'
import type { Clip } from '@/types/project'
import type { ShortcutAction } from '@/utils/shortcuts'

interface UseSpreadsheetContextMenuPropsParams {
  contextMenu: { clipId: string; x: number; y: number } | null
  contextClip: Clip | null
  currentClip: Clip | undefined
  showMiniatures: boolean
  showQuickActions: boolean
  hasAnyLinkedVideo: boolean
  shortcutBindings: Record<ShortcutAction, string>
  contextMenuRef: MutableRefObject<HTMLDivElement | null>
  handleToggleScored: (clip: Clip) => void
  handleOpenNotes: (clip: Clip) => void
  handleAttachVideo: (clip: Clip) => void
  handleRenameClip: (clip: Clip) => void
  handleSwapPseudoAndClipName: (clip: Clip) => void
  handleSetMiniatureFromCurrentFrame: (clip: Clip) => void
  handleResetMiniature: (clip: Clip) => void
  handleToggleMiniatures: () => void
  handleToggleQuickActions: () => void
  handleShowMediaInfo: (clip: Clip) => void
  handleRemoveClip: (clip: Clip) => void
}

export function buildSpreadsheetContextMenuProps({
  contextMenu,
  contextClip,
  currentClip,
  showMiniatures,
  showQuickActions,
  hasAnyLinkedVideo,
  shortcutBindings,
  contextMenuRef,
  handleToggleScored,
  handleOpenNotes,
  handleAttachVideo,
  handleRenameClip,
  handleSwapPseudoAndClipName,
  handleSetMiniatureFromCurrentFrame,
  handleResetMiniature,
  handleToggleMiniatures,
  handleToggleQuickActions,
  handleShowMediaInfo,
  handleRemoveClip,
}: UseSpreadsheetContextMenuPropsParams): ComponentProps<typeof ClipContextMenu> {
  return {
    contextMenu,
    contextClip,
    currentClipId: currentClip?.id,
    showMiniatures,
    showQuickActions,
    hasAnyLinkedVideo,
    shortcutBindings,
    contextMenuRef,
    onToggleScored: handleToggleScored,
    onOpenNotes: handleOpenNotes,
    onAttachVideo: handleAttachVideo,
    onRenameClip: handleRenameClip,
    onSwapPseudoAndClipName: handleSwapPseudoAndClipName,
    onSetMiniatureFromCurrentFrame: handleSetMiniatureFromCurrentFrame,
    onResetMiniature: handleResetMiniature,
    onToggleMiniatures: handleToggleMiniatures,
    onToggleQuickActions: handleToggleQuickActions,
    onShowMediaInfo: handleShowMediaInfo,
    onRemoveClip: handleRemoveClip,
  }
}
