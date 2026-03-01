import type { RefObject } from 'react'
import {
  CheckSquare2,
  Clapperboard,
  Eye,
  EyeOff,
  FileText,
  Image,
  ImagePlus,
  Info,
  Link2,
  Table2,
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
  hasAnyLinkedVideo: boolean
  showAddRowButton: boolean
  shortcutBindings: Record<ShortcutAction, string>
  contextMenuRef: RefObject<HTMLDivElement | null>
  onToggleScored: (clip: Clip) => void
  onOpenNotes: (clip: Clip) => void
  onAttachVideo: (clip: Clip) => void
  onSetMiniatureFromCurrentFrame: (clip: Clip) => void
  onResetMiniature: (clip: Clip) => void
  onToggleMiniatures: () => void
  onToggleAddRowButton: () => void
  onShowMediaInfo: (clip: Clip) => void
  onRemoveClip: (clip: Clip) => void
}

export function ClipContextMenu({
  contextMenu,
  contextClip,
  currentClipId,
  showMiniatures,
  hasAnyLinkedVideo,
  showAddRowButton,
  shortcutBindings,
  contextMenuRef,
  onToggleScored,
  onOpenNotes,
  onAttachVideo,
  onSetMiniatureFromCurrentFrame,
  onResetMiniature,
  onToggleMiniatures,
  onToggleAddRowButton,
  onShowMediaInfo,
  onRemoveClip,
}: ClipContextMenuProps) {
  const { t } = useI18n()

  if (!contextMenu) return null

  return (
    <AppContextMenuPanel
      ref={contextMenuRef}
      x={contextMenu.x}
      y={contextMenu.y}
      minWidthClassName="min-w-[220px]"
    >
      {contextClip && (
        <>
          <AppContextMenuItem
            onClick={() => onToggleScored(contextClip)}
            label={contextClip.scored ? t('Retirer "noté"') : t('Marquer comme noté')}
            icon={CheckSquare2}
          />
          <AppContextMenuSeparator />
          <AppContextMenuItem
            onClick={() => onOpenNotes(contextClip)}
            label={t('Notes du clip')}
            icon={Clapperboard}
            iconSecondary={FileText}
          />
          {!contextClip.filePath && (
            <AppContextMenuItem
              onClick={() => onAttachVideo(contextClip)}
              label={t('Lier une vidéo à cette ligne...')}
              icon={Link2}
            />
          )}
          {showMiniatures && currentClipId === contextClip.id && contextClip.filePath && (
            <>
              <AppContextMenuSeparator />
              <AppContextMenuItem
                onClick={() => onSetMiniatureFromCurrentFrame(contextClip)}
                label={t('Définir miniature (frame courante)')}
                icon={ImagePlus}
                shortcut={formatShortcutDisplay(shortcutBindings.setMiniatureFrame, t)}
              />
              <AppContextMenuItem
                onClick={() => onResetMiniature(contextClip)}
                label={t('Réinitialiser miniature')}
                icon={Image}
              />
            </>
          )}
          <AppContextMenuSeparator />
        </>
      )}
      {hasAnyLinkedVideo ? (
        <AppContextMenuItem
          onClick={onToggleMiniatures}
          label={showMiniatures ? t('Masquer miniatures') : t('Afficher miniatures')}
          icon={Image}
          iconSecondary={showMiniatures ? EyeOff : Eye}
          shortcut={formatShortcutDisplay(shortcutBindings.toggleMiniatures, t)}
        />
      ) : (
        <AppContextMenuItem
          label={t('Miniatures indisponibles (pas de vidéo)')}
          icon={Image}
          disabled
        />
      )}
      <AppContextMenuSeparator />
      <AppContextMenuItem
        onClick={onToggleAddRowButton}
        label={showAddRowButton ? t('Masquer bouton') : t('Afficher bouton')}
        icon={Table2}
        iconSecondary={showAddRowButton ? EyeOff : Eye}
      />
      <AppContextMenuSeparator />
      <AppContextMenuItem
        onClick={() => contextClip && onShowMediaInfo(contextClip)}
        disabled={!contextClip?.filePath}
        label={contextClip?.filePath ? t('Afficher MediaInfo') : t('MediaInfo indisponible (pas de vidéo)')}
        icon={Info}
      />
      <AppContextMenuSeparator />
      <AppContextMenuItem
        onClick={() => contextClip && onRemoveClip(contextClip)}
        label={contextClip?.filePath ? t('Supprimer la vidéo') : t('Supprimer la ligne')}
        icon={Trash2}
        danger
      />
    </AppContextMenuPanel>
  )
}
