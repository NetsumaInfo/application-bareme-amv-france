import type { MutableRefObject } from 'react'
import { Pencil, Trash2, Upload } from 'lucide-react'
import type { Clip } from '@/types/project'
import {
  AppContextMenuItem,
  AppContextMenuPanel,
  AppContextMenuSeparator,
} from '@/components/ui/AppContextMenu'
import { useI18n } from '@/i18n'
import { UI_ICONS } from '@/components/ui/actionIcons'

interface MenuPosition {
  x: number
  y: number
}

interface MemberMenuState extends MenuPosition {
  judgeKey: string
}

interface ClipMenuState extends MenuPosition {
  clipId: string
}

type EmptyMenuState = MenuPosition

interface ResultatsContextMenusProps {
  memberContextMenu: MemberMenuState | null
  clipContextMenu: ClipMenuState | null
  emptyContextMenu: EmptyMenuState | null
  selectedClip: Clip | undefined
  clips: Clip[]
  memberContextMenuRef: MutableRefObject<HTMLDivElement | null>
  clipContextMenuRef: MutableRefObject<HTMLDivElement | null>
  emptyContextMenuRef: MutableRefObject<HTMLDivElement | null>
  onCloseMemberMenu: () => void
  onCloseClipMenu: () => void
  onCloseEmptyMenu: () => void
  onRemoveImportedJudge: (judgeKey: string) => void
  onRenameJudge: (judgeKey: string) => void
  onOpenClipInNotation: (clip: Clip) => void
  onOpenDetailedNotes: (clip: Clip) => void
  onImportJudgeJson: () => void
  onRemoveClip: (clipId: string) => void
  hideGeneralNotes: boolean
  onToggleGeneralNotes: () => void
  showMiniatures: boolean
  hasAnyLinkedVideo: boolean
  onToggleMiniatures: () => void
}

export function ResultatsContextMenus({
  memberContextMenu,
  clipContextMenu,
  emptyContextMenu,
  selectedClip,
  clips,
  memberContextMenuRef,
  clipContextMenuRef,
  emptyContextMenuRef,
  onCloseMemberMenu,
  onCloseClipMenu,
  onCloseEmptyMenu,
  onRemoveImportedJudge,
  onRenameJudge,
  onOpenClipInNotation,
  onOpenDetailedNotes,
  onImportJudgeJson,
  onRemoveClip,
  hideGeneralNotes,
  onToggleGeneralNotes,
  showMiniatures,
  hasAnyLinkedVideo,
  onToggleMiniatures,
}: ResultatsContextMenusProps) {
  const { t } = useI18n()
  const playerIcon = UI_ICONS.player
  const detailedNotesIcon = UI_ICONS.detailedNotes
  const detailedNotesSecondaryIcon = UI_ICONS.detailedNotesSecondary
  const generalNoteIcon = UI_ICONS.generalNote
  const miniaturesIcon = UI_ICONS.miniatures
  const showIcon = UI_ICONS.show
  const hideIcon = UI_ICONS.hide
  const canRemoveSelectedJudge = Boolean(memberContextMenu?.judgeKey.startsWith('imported-'))

  return (
    <>
      {memberContextMenu && (
        <AppContextMenuPanel
          ref={memberContextMenuRef}
          x={memberContextMenu.x}
          y={memberContextMenu.y}
          minWidthClassName="min-w-[188px]"
        >
          <AppContextMenuItem
            onClick={() => {
              onRenameJudge(memberContextMenu.judgeKey)
              onCloseMemberMenu()
            }}
            label={t('Renommer le juge')}
            icon={Pencil}
          />
          {canRemoveSelectedJudge && (
            <>
              <AppContextMenuSeparator />
              <AppContextMenuItem
                onClick={() => {
                  onRemoveImportedJudge(memberContextMenu.judgeKey)
                  onCloseMemberMenu()
                }}
                label={t('Supprimer le juge')}
                icon={Trash2}
                danger
              />
            </>
          )}
        </AppContextMenuPanel>
      )}

      {clipContextMenu && (
        <AppContextMenuPanel
          ref={clipContextMenuRef}
          x={clipContextMenu.x}
          y={clipContextMenu.y}
          minWidthClassName="min-w-[198px]"
        >
          {(() => {
            const clip = clips.find((item) => item.id === clipContextMenu.clipId)
            if (!clip) return null
            return (
              <>
                {clip.filePath ? (
                  <>
                    <AppContextMenuItem
                      onClick={() => {
                        onOpenClipInNotation(clip)
                        onCloseClipMenu()
                      }}
                      label={t('Ouvrir le lecteur')}
                      icon={playerIcon}
                    />
                    <AppContextMenuSeparator />
                  </>
                ) : null}
                <AppContextMenuItem
                  onClick={() => {
                    onOpenDetailedNotes(clip)
                    onCloseClipMenu()
                  }}
                  label={t('Commentaires détaillés des juges')}
                  icon={detailedNotesIcon}
                  iconSecondary={detailedNotesSecondaryIcon}
                />
                <AppContextMenuSeparator />
                <AppContextMenuItem
                  onClick={() => {
                    onToggleGeneralNotes()
                    onCloseClipMenu()
                  }}
                  label={hideGeneralNotes ? t('Afficher commentaire général') : t('Masquer commentaire général')}
                  icon={generalNoteIcon}
                  iconSecondary={hideGeneralNotes ? showIcon : hideIcon}
                />
                <AppContextMenuItem
                  onClick={() => {
                    if (!hasAnyLinkedVideo) return
                    onToggleMiniatures()
                    onCloseClipMenu()
                  }}
                  label={showMiniatures ? t('Masquer les miniatures') : t('Afficher les miniatures')}
                  icon={miniaturesIcon}
                  iconSecondary={showMiniatures ? hideIcon : showIcon}
                  disabled={!hasAnyLinkedVideo}
                />
                <AppContextMenuSeparator />
              </>
            )
          })()}
          <AppContextMenuItem
            onClick={() => {
              onRemoveClip(clipContextMenu.clipId)
              onCloseClipMenu()
            }}
            label={clips.find((item) => item.id === clipContextMenu.clipId)?.filePath ? t('Supprimer la vidéo du participant') : t('Supprimer le participant')}
            icon={Trash2}
            danger
          />
        </AppContextMenuPanel>
      )}

      {emptyContextMenu && (
        <AppContextMenuPanel
          ref={emptyContextMenuRef}
          x={emptyContextMenu.x}
          y={emptyContextMenu.y}
          minWidthClassName="min-w-[202px]"
        >
          <AppContextMenuItem
            onClick={() => {
              onToggleGeneralNotes()
              onCloseEmptyMenu()
            }}
            label={hideGeneralNotes ? t('Afficher commentaire général') : t('Masquer commentaire général')}
            icon={generalNoteIcon}
            iconSecondary={hideGeneralNotes ? showIcon : hideIcon}
          />
          <AppContextMenuItem
            onClick={() => {
              if (!hasAnyLinkedVideo) return
              onToggleMiniatures()
              onCloseEmptyMenu()
            }}
            label={showMiniatures ? t('Masquer les miniatures') : t('Afficher les miniatures')}
            icon={miniaturesIcon}
            iconSecondary={showMiniatures ? hideIcon : showIcon}
            disabled={!hasAnyLinkedVideo}
          />
          <AppContextMenuSeparator />
          <AppContextMenuItem
            onClick={() => {
              onImportJudgeJson()
              onCloseEmptyMenu()
            }}
            label={t('Importer un juge')}
            icon={Upload}
          />
          {selectedClip ? (
            <>
              <AppContextMenuSeparator />
              {selectedClip.filePath ? (
                <AppContextMenuItem
                  onClick={() => {
                    onOpenClipInNotation(selectedClip)
                    onCloseEmptyMenu()
                  }}
                  label={t('Ouvrir le lecteur (clip sélectionné)')}
                  icon={playerIcon}
                />
              ) : null}
              <AppContextMenuItem
                onClick={() => {
                  onOpenDetailedNotes(selectedClip)
                  onCloseEmptyMenu()
                }}
                label={t('Commentaires détaillés des juges (clip sélectionné)')}
                icon={detailedNotesIcon}
                iconSecondary={detailedNotesSecondaryIcon}
              />
            </>
          ) : null}
        </AppContextMenuPanel>
      )}
    </>
  )
}
