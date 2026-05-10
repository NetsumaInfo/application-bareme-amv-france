import type { RefObject } from 'react'
import {
  CheckSquare2,
  ImagePlus,
  Link2,
  Star,
  Tags,
  TextCursorInput,
  Trash2,
} from 'lucide-react'
import type { Clip } from '@/types/project'
import {
  AppContextMenuItem,
  AppContextMenuPanel,
  AppContextMenuSeparator,
} from '@/components/ui/AppContextMenu'
import { formatShortcutDisplay, type ShortcutAction } from '@/utils/shortcuts'
import { useI18n } from '@/i18n'
import { UI_ICONS } from '@/components/ui/actionIcons'

interface ContextMenuPosition {
  clipId: string
  x: number
  y: number
}

interface ClipContextMenuProps {
  contextMenu: ContextMenuPosition | null
  contextClip: Clip | null
  currentClipId?: string
  showMiniatures: boolean
  showQuickActions: boolean
  hasAnyLinkedVideo: boolean
  shortcutBindings: Record<ShortcutAction, string>
  contextMenuRef: RefObject<HTMLDivElement | null>
  onToggleScored: (clip: Clip) => void
  onOpenFavorite: (clip: Clip) => void
  onOpenNotes: (clip: Clip) => void
  onAttachVideo: (clip: Clip) => void
  onRenameClip: (clip: Clip) => void
  onEditContestCategory: (clip: Clip) => void
  onSwapPseudoAndClipName: (clip: Clip) => void
  onSetMiniatureFromCurrentFrame: (clip: Clip) => void
  onResetMiniature: (clip: Clip) => void
  onToggleMiniatures: () => void
  onToggleQuickActions: () => void
  onShowMediaInfo: (clip: Clip) => void
  onRemoveClip: (clip: Clip) => void
}

export function ClipContextMenu({
  contextMenu,
  contextClip,
  currentClipId,
  showMiniatures,
  showQuickActions,
  hasAnyLinkedVideo,
  shortcutBindings,
  contextMenuRef,
  onToggleScored,
  onOpenFavorite,
  onOpenNotes,
  onAttachVideo,
  onRenameClip,
  onEditContestCategory,
  onSwapPseudoAndClipName,
  onSetMiniatureFromCurrentFrame,
  onResetMiniature,
  onToggleMiniatures,
  onToggleQuickActions,
  onShowMediaInfo,
  onRemoveClip,
}: ClipContextMenuProps) {
  const { t } = useI18n()
  const notesIcon = UI_ICONS.detailedNotesSecondary
  const miniaturesIcon = UI_ICONS.miniatures
  const showIcon = UI_ICONS.show
  const hideIcon = UI_ICONS.hide
  const mediaInfoIcon = UI_ICONS.mediaInfo
  const renameIcon = TextCursorInput
  const swapIcon = UI_ICONS.swap
  const contestCategoryIcon = Tags

  if (!contextMenu) return null

  return (
    <AppContextMenuPanel
      ref={contextMenuRef}
      x={contextMenu.x}
      y={contextMenu.y}
      minWidthClassName="min-w-[198px]"
    >
      {contextClip && (
        <>
          <AppContextMenuItem
            onClick={() => onToggleScored(contextClip)}
            label={contextClip.scored ? t('Retirer "noté"') : t('Marquer comme noté')}
            icon={CheckSquare2}
          />
          <AppContextMenuItem
            onClick={() => onOpenFavorite(contextClip)}
            label={contextClip.favorite ? t('Modifier le favori') : t('Mettre en favori')}
            icon={Star}
          />
          <AppContextMenuSeparator />
          <AppContextMenuItem
            onClick={() => onOpenNotes(contextClip)}
            label={t('Notes détaillées')}
            icon={notesIcon}
          />
          {!contextClip.filePath && (
            <AppContextMenuItem
              onClick={() => onAttachVideo(contextClip)}
              label={t('Lier une vidéo à cette ligne...')}
              icon={Link2}
            />
          )}
          <AppContextMenuItem
            onClick={() => onRenameClip(contextClip)}
            label={t('Renommer')}
            icon={renameIcon}
          />
          <AppContextMenuItem
            onClick={() => onEditContestCategory(contextClip)}
            label={contextClip.contestCategory?.trim() ? t('Modifier catégorie concours') : t('Définir catégorie concours')}
            icon={contestCategoryIcon}
          />
          <AppContextMenuItem
            onClick={() => onSwapPseudoAndClipName(contextClip)}
            label={t('Échanger pseudo et nom du clip')}
            icon={swapIcon}
          />
          {showMiniatures && currentClipId === contextClip.id && contextClip.filePath && (
            <>
              <AppContextMenuSeparator />
              <AppContextMenuItem
                onClick={() => onSetMiniatureFromCurrentFrame(contextClip)}
                label={t('Définir miniature')}
                icon={ImagePlus}
                shortcut={formatShortcutDisplay(shortcutBindings.setMiniatureFrame, t)}
              />
              <AppContextMenuItem
                onClick={() => onResetMiniature(contextClip)}
                label={t('Réinitialiser miniature')}
                icon={miniaturesIcon}
              />
            </>
          )}
          <AppContextMenuSeparator />
        </>
      )}
      {hasAnyLinkedVideo ? (
        <AppContextMenuItem
          onClick={onToggleMiniatures}
          label={showMiniatures ? t('Masquer les miniatures') : t('Afficher les miniatures')}
          icon={miniaturesIcon}
          iconSecondary={showMiniatures ? hideIcon : showIcon}
          shortcut={formatShortcutDisplay(shortcutBindings.toggleMiniatures, t)}
        />
      ) : (
        <AppContextMenuItem
          label={t('Miniatures indisponibles (pas de vidéo)')}
          icon={miniaturesIcon}
          disabled
        />
      )}
      <AppContextMenuSeparator />
      <AppContextMenuItem
        onClick={onToggleQuickActions}
        label={showQuickActions ? t('Masquer les actions rapides') : t('Afficher les actions rapides')}
        icon={showQuickActions ? hideIcon : showIcon}
      />
      <AppContextMenuSeparator />
      <AppContextMenuItem
        onClick={() => contextClip && onShowMediaInfo(contextClip)}
        disabled={!contextClip?.filePath}
        label={contextClip?.filePath ? t('Afficher MediaInfo') : t('MediaInfo indisponible (pas de vidéo)')}
        icon={mediaInfoIcon}
      />
      <AppContextMenuSeparator />
      <AppContextMenuItem
        onClick={() => contextClip && onRemoveClip(contextClip)}
        label={contextClip?.filePath ? t('Supprimer la vidéo du participant') : t('Supprimer le participant')}
        icon={Trash2}
        danger
      />
    </AppContextMenuPanel>
  )
}
