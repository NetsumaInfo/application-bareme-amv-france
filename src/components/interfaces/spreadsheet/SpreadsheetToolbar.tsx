import type { DragEvent, MouseEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CheckCircle2, Link2, Star, Tags, TextCursorInput, Trash2 } from 'lucide-react'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'
import type { Clip } from '@/types/project'
import { UI_ICONS } from '@/components/ui/actionIcons'
import { ALL_CONTEST_CATEGORY_KEY } from '@/utils/contestCategory'
import { withAlpha } from '@/utils/colors'

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
  contestCategoriesEnabled: boolean
  contestCategoryViewTabs: Array<{
    key: string
    label: string
    color: string
    count: number
  }>
  activeContestCategoryView: string
  onSelectContestCategoryView: (categoryKey: string) => void
  onAddManualRow: () => void
  onToggleScored: (clip: Clip) => void
  onOpenFavorite: (clip: Clip) => void
  onOpenNotes: (clip: Clip) => void
  onAttachVideo: (clip: Clip) => void
  onRenameClip: (clip: Clip) => void
  onEditContestCategory: (clip: Clip) => void
  onSwapPseudoAndClipName: (clip: Clip) => void
  onToggleMiniatures: () => void
  onShowMediaInfo: (clip: Clip) => void
  onRemoveClip: (clip: Clip) => void
  onTogglePipVideo: () => void
  showMiniatures: boolean
  hasAnyLinkedVideo: boolean
  hasContestCategories: boolean
  showPipVideo: boolean
}

export function SpreadsheetToolbar({
  currentClip,
  contestCategoriesEnabled,
  contestCategoryViewTabs,
  activeContestCategoryView,
  onSelectContestCategoryView,
  onAddManualRow,
  onToggleScored,
  onOpenFavorite,
  onOpenNotes,
  onAttachVideo,
  onRenameClip,
  onEditContestCategory,
  onSwapPseudoAndClipName,
  onToggleMiniatures,
  onShowMediaInfo,
  onRemoveClip,
  onTogglePipVideo,
  showMiniatures,
  hasAnyLinkedVideo,
  hasContestCategories,
  showPipVideo,
}: SpreadsheetToolbarProps) {
  const { t } = useI18n()
  const detailedNotesIcon = UI_ICONS.generalNote
  const miniaturesIcon = UI_ICONS.miniatures
  const addRowIcon = UI_ICONS.addRow
  const showIcon = UI_ICONS.show
  const hideIcon = UI_ICONS.hide
  const pipIcon = UI_ICONS.pip
  const mediaInfoIcon = UI_ICONS.mediaInfo
  const renameIcon = TextCursorInput
  const swapIcon = UI_ICONS.swap
  const hasCurrentClip = Boolean(currentClip)
  const hasCurrentClipVideo = Boolean(currentClip?.filePath)
  const toggleScoredLabel = hasCurrentClip
    ? (currentClip?.scored ? t('Retirer "noté"') : t('Marquer comme noté'))
    : t('Sélectionnez un clip')
  const favoriteLabel = hasCurrentClip
    ? (currentClip?.favorite ? t('Modifier le favori') : t('Mettre en favori'))
    : t('Sélectionnez un clip')
  const notesLabel = hasCurrentClip ? t('Commentaires du clip') : t('Sélectionnez un clip')
  const attachVideoLabel = hasCurrentClip ? t('Lier une vidéo à cette ligne...') : t('Sélectionnez un clip')
  const miniaturesLabel = hasAnyLinkedVideo
    ? (showMiniatures ? t('Masquer les miniatures') : t('Afficher les miniatures'))
    : t('Miniatures indisponibles (pas de média)')
  const addManualRowLabel = t('Ajouter une ligne sans vidéo')
  const renameClipLabel = hasCurrentClip ? t('Renommer') : t('Sélectionnez un clip')
  const contestCategoryLabel = hasCurrentClip
    ? (currentClip?.contestCategory?.trim() ? t('Modifier catégorie clip') : t('Définir catégorie clip'))
    : t('Sélectionnez un clip')
  const swapClipLabel = hasCurrentClip ? t('Échanger pseudo et nom du clip') : t('Sélectionnez un clip')
  const mediaInfoLabel = hasCurrentClip
    ? (hasCurrentClipVideo ? t('Afficher MediaInfo') : t('MediaInfo indisponible (pas de vidéo)'))
    : t('Sélectionnez un clip')
  const removeClipLabel = hasCurrentClip
    ? (hasCurrentClipVideo ? t('Supprimer la vidéo du participant') : t('Supprimer le participant'))
    : t('Sélectionnez un clip')
  const pipLabel = hasCurrentClipVideo
    ? (showPipVideo ? t('Masquer la vidéo PiP') : t('Ouvrir la vidéo'))
    : t('Vidéo PiP indisponible (pas de média)')
  const showContestCategoryBar = contestCategoriesEnabled && contestCategoryViewTabs.length > 1
  const isFileDragEvent = (event: DragEvent<HTMLButtonElement>) => (
    Array.from(event.dataTransfer?.types ?? []).includes('Files')
  )

  return (
    <div className="relative flex shrink-0 items-center border-b border-gray-700/50 py-px">
      <div className="z-[1] flex items-center gap-0.5 pr-2">
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
          ariaLabel={contestCategoryLabel}
          title={contestCategoryLabel}
          icon={Tags}
          disabled={!currentClip || !hasContestCategories}
          onClick={currentClip && hasContestCategories ? () => onEditContestCategory(currentClip) : undefined}
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
          icon={mediaInfoIcon}
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
          icon={CheckCircle2}
          active={Boolean(currentClip?.scored)}
          disabled={!currentClip}
          onClick={currentClip ? () => onToggleScored(currentClip) : undefined}
        />

        <ToolbarIconButton
          ariaLabel={favoriteLabel}
          title={favoriteLabel}
          icon={Star}
          active={Boolean(currentClip?.favorite)}
          disabled={!currentClip}
          onClick={currentClip ? () => onOpenFavorite(currentClip) : undefined}
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

      {showContestCategoryBar ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[2] flex -translate-y-1/2 justify-center px-2">
          <div className="pointer-events-auto flex max-w-[calc(100%-14rem)] min-w-0 items-center gap-1 overflow-x-auto rounded-md px-1 py-0.5">
            {contestCategoryViewTabs.map((tab) => {
              const active = activeContestCategoryView === tab.key
              const isGeneral = tab.key === ALL_CONTEST_CATEGORY_KEY
              const labelColor = isGeneral
                ? (active ? 'rgb(var(--color-primary-500) / 0.86)' : 'rgb(var(--color-primary-500) / 0.74)')
                : withAlpha(tab.color, active ? 0.86 : 0.74)
              const countColor = isGeneral
                ? (active ? 'rgb(var(--color-primary-500) / 0.76)' : 'rgb(var(--color-primary-500) / 0.64)')
                : withAlpha(tab.color, active ? 0.76 : 0.64)
              const lineColor = isGeneral
                ? (active ? 'rgb(var(--color-primary-500) / 0.8)' : 'rgb(var(--color-primary-500) / 0.68)')
                : withAlpha(tab.color, active ? 0.8 : 0.68)
              return (
                <HoverTextTooltip
                  key={`contest-category-view-${tab.key}`}
                  text={
                    tab.key === ALL_CONTEST_CATEGORY_KEY
                      ? t('Afficher tous les clips')
                      : t('Filtrer sur la catégorie {category}', { category: tab.label })
                  }
                >
                  <button
                    type="button"
                    className={`group relative shrink-0 rounded-md border px-2 py-0.5 text-[10px] transition-colors ${
                      active
                        ? 'border-white/15 bg-surface-dark/90'
                        : 'border-transparent bg-transparent hover:border-white/10 hover:bg-white/[0.04]'
                    }`}
                    onDragEnter={(event) => {
                      if (!isFileDragEvent(event)) return
                      if (activeContestCategoryView === tab.key) return
                      onSelectContestCategoryView(tab.key)
                    }}
                    onClick={() => {
                      onSelectContestCategoryView(tab.key)
                    }}
                  >
                    <span
                      className={`absolute inset-x-1 bottom-0 h-[1px] rounded-full ${active ? 'opacity-95' : 'opacity-80'}`}
                      style={{ backgroundColor: lineColor }}
                    />
                    <span className="inline-flex max-w-[12rem] items-center gap-1.5">
                      <span
                        className={`max-w-[9rem] truncate text-[10px] font-semibold leading-none ${active ? '' : 'opacity-90 group-hover:opacity-100'}`}
                        style={{ color: labelColor }}
                      >
                        {tab.label}
                      </span>
                      <span
                        className={`text-[9px] font-semibold leading-none tabular-nums ${active ? '' : 'opacity-80 group-hover:opacity-100'}`}
                        style={{ color: countColor }}
                      >
                        {tab.count}
                      </span>
                    </span>
                  </button>
                </HoverTextTooltip>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
