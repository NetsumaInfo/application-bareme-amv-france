import type { MouseEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CheckSquare2, Info, Link2, TextCursorInput, Trash2 } from 'lucide-react'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'
import type { Clip } from '@/types/project'
import { UI_ICONS } from '@/components/ui/actionIcons'

interface ToolbarIconButtonProps {
  ariaLabel: string
  title: string
  icon: LucideIcon
  iconSecondary?: LucideIcon
  active?: boolean
  danger?: boolean
  disabled?: boolean
  onClick?: () => void
  onContextMenu?: (event: MouseEvent<HTMLButtonElement>) => void
}

function ToolbarIconButton({
  ariaLabel,
  title,
  icon: Icon,
  iconSecondary: IconSecondary,
  active = false,
  danger = false,
  disabled = false,
  onClick,
  onContextMenu,
}: ToolbarIconButtonProps) {
  const colorClassName = disabled
    ? 'bg-transparent text-gray-600'
      : danger
      ? 'bg-transparent text-rose-300 hover:bg-rose-500/10 hover:text-rose-200'
      : active
        ? 'bg-primary-500/8 text-primary-100 hover:bg-primary-500/12 hover:text-white'
        : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'
  const bubbleClassName = disabled
    ? 'bg-slate-950 text-gray-600'
    : danger
      ? 'bg-slate-950 text-rose-300'
      : active
        ? 'bg-slate-950 text-primary-100'
        : 'bg-slate-950 text-slate-200'

  return (
    <HoverTextTooltip text={title}>
      <button
        type="button"
        onClick={disabled ? undefined : onClick}
        onContextMenu={onContextMenu}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors ${colorClassName} ${disabled ? 'cursor-not-allowed opacity-55' : ''}`}
      >
        <span className="relative flex h-3.5 w-3.5 items-center justify-center">
          <Icon size={14} strokeWidth={1.9} />
          {IconSecondary ? (
            <span className={`absolute -bottom-px -right-px flex h-2.5 w-2.5 items-center justify-center rounded-full ${bubbleClassName}`}>
              <IconSecondary size={5} strokeWidth={2.1} />
            </span>
          ) : null}
        </span>
      </button>
    </HoverTextTooltip>
  )
}

interface SpreadsheetToolbarProps {
  currentClip?: Clip
  onAddManualRow: () => void
  onToggleScored: (clip: Clip) => void
  onOpenNotes: (clip: Clip) => void
  onAttachVideo: (clip: Clip) => void
  onRenameClip: (clip: Clip) => void
  onSwapPseudoAndClipName: (clip: Clip) => void
  onToggleMiniatures: () => void
  onShowMediaInfo: (clip: Clip) => void
  onRemoveClip: (clip: Clip) => void
  onTogglePipVideo: () => void
  showMiniatures: boolean
  hasAnyLinkedVideo: boolean
  showPipVideo: boolean
}

export function SpreadsheetToolbar({
  currentClip,
  onAddManualRow,
  onToggleScored,
  onOpenNotes,
  onAttachVideo,
  onRenameClip,
  onSwapPseudoAndClipName,
  onToggleMiniatures,
  onShowMediaInfo,
  onRemoveClip,
  onTogglePipVideo,
  showMiniatures,
  hasAnyLinkedVideo,
  showPipVideo,
}: SpreadsheetToolbarProps) {
  const { t } = useI18n()
  const detailedNotesIcon = UI_ICONS.detailedNotesSecondary
  const miniaturesIcon = UI_ICONS.miniatures
  const addRowIcon = UI_ICONS.addRow
  const showIcon = UI_ICONS.show
  const hideIcon = UI_ICONS.hide
  const pipIcon = UI_ICONS.pip
  const renameIcon = TextCursorInput
  const swapIcon = UI_ICONS.swap
  const hasCurrentClip = Boolean(currentClip)
  const hasCurrentClipVideo = Boolean(currentClip?.filePath)
  const toggleScoredLabel = hasCurrentClip
    ? (currentClip?.scored ? t('Retirer "noté"') : t('Marquer comme noté'))
    : t('Sélectionnez un clip')
  const notesLabel = hasCurrentClip ? t('Notes du clip') : t('Sélectionnez un clip')
  const attachVideoLabel = hasCurrentClip ? t('Lier une vidéo à cette ligne...') : t('Sélectionnez un clip')
  const miniaturesLabel = hasAnyLinkedVideo
    ? (showMiniatures ? t('Masquer les miniatures') : t('Afficher les miniatures'))
    : t('Miniatures indisponibles (pas de média)')
  const addManualRowLabel = t('Ajouter une ligne sans vidéo')
  const renameClipLabel = hasCurrentClip ? t('Renommer') : t('Sélectionnez un clip')
  const swapClipLabel = hasCurrentClip ? t('Échanger pseudo et nom du clip') : t('Sélectionnez un clip')
  const mediaInfoLabel = hasCurrentClip
    ? (hasCurrentClipVideo ? t('Afficher MediaInfo') : t('MediaInfo indisponible (pas de vidéo)'))
    : t('Sélectionnez un clip')
  const removeClipLabel = hasCurrentClip
    ? (hasCurrentClipVideo ? t('Supprimer la vidéo du participant') : t('Supprimer le participant'))
    : t('Sélectionnez un clip')
  const pipLabel = hasCurrentClipVideo
    ? (showPipVideo ? t('Masquer la vidéo PiP') : t('Afficher la vidéo PiP'))
    : t('Vidéo PiP indisponible (pas de média)')

  return (
    <div className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-gray-700/50 py-px">
      <ToolbarIconButton
        ariaLabel={hasCurrentClipVideo ? pipLabel : attachVideoLabel}
        title={hasCurrentClipVideo ? pipLabel : attachVideoLabel}
        icon={hasCurrentClipVideo ? pipIcon : Link2}
        active={showPipVideo && hasCurrentClipVideo}
        disabled={!currentClip}
        onClick={currentClip ? (hasCurrentClipVideo ? onTogglePipVideo : () => onAttachVideo(currentClip)) : undefined}
      />

      <ToolbarIconButton
        ariaLabel={addManualRowLabel}
        title={addManualRowLabel}
        icon={addRowIcon}
        onClick={onAddManualRow}
      />

      <ToolbarIconButton
        ariaLabel={miniaturesLabel}
        title={miniaturesLabel}
        icon={miniaturesIcon}
        iconSecondary={showMiniatures ? hideIcon : showIcon}
        active={showMiniatures && hasAnyLinkedVideo}
        disabled={!hasAnyLinkedVideo}
        onClick={hasAnyLinkedVideo ? onToggleMiniatures : undefined}
      />

      <ToolbarIconButton
        ariaLabel={renameClipLabel}
        title={renameClipLabel}
        icon={renameIcon}
        disabled={!currentClip}
        onClick={currentClip ? () => onRenameClip(currentClip) : undefined}
      />

      <ToolbarIconButton
        ariaLabel={swapClipLabel}
        title={swapClipLabel}
        icon={swapIcon}
        disabled={!currentClip}
        onClick={currentClip ? () => onSwapPseudoAndClipName(currentClip) : undefined}
      />

      <ToolbarIconButton
        ariaLabel={mediaInfoLabel}
        title={mediaInfoLabel}
        icon={Info}
        disabled={!currentClip || !hasCurrentClipVideo}
        onClick={currentClip && hasCurrentClipVideo ? () => onShowMediaInfo(currentClip) : undefined}
      />

      <ToolbarIconButton
        ariaLabel={notesLabel}
        title={notesLabel}
        icon={detailedNotesIcon}
        disabled={!currentClip}
        onClick={currentClip ? () => onOpenNotes(currentClip) : undefined}
      />

      <ToolbarIconButton
        ariaLabel={toggleScoredLabel}
        title={toggleScoredLabel}
        icon={CheckSquare2}
        active={Boolean(currentClip?.scored)}
        disabled={!currentClip}
        onClick={currentClip ? () => onToggleScored(currentClip) : undefined}
      />

      <ToolbarIconButton
        ariaLabel={removeClipLabel}
        title={removeClipLabel}
        icon={Trash2}
        danger
        disabled={!currentClip}
        onClick={currentClip ? () => onRemoveClip(currentClip) : undefined}
      />
    </div>
  )
}
