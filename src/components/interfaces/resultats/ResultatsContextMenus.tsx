import type { MutableRefObject } from 'react'
import {
  Clapperboard,
  Eye,
  EyeOff,
  FileText,
  Pencil,
  Play,
  Trash2,
  Upload,
} from 'lucide-react'
import type { Clip } from '@/types/project'
import {
  AppContextMenuItem,
  AppContextMenuPanel,
  AppContextMenuSeparator,
} from '@/components/ui/AppContextMenu'
import { useI18n } from '@/i18n'

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
}: ResultatsContextMenusProps) {
  const { t } = useI18n()
  const canRemoveSelectedJudge = Boolean(memberContextMenu?.judgeKey.startsWith('imported-'))

  return (
    <>
      {memberContextMenu && (
        <AppContextMenuPanel
          ref={memberContextMenuRef}
          x={memberContextMenu.x}
          y={memberContextMenu.y}
          minWidthClassName="min-w-[205px]"
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
          minWidthClassName="min-w-[225px]"
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
                      icon={Play}
                    />
                    <AppContextMenuSeparator />
                  </>
                ) : null}
                <AppContextMenuItem
                  onClick={() => {
                    onOpenDetailedNotes(clip)
                    onCloseClipMenu()
                  }}
                  label={t('Notes détaillées des juges')}
                  icon={Clapperboard}
                  iconSecondary={FileText}
                />
                <AppContextMenuSeparator />
                <AppContextMenuItem
                  onClick={() => {
                    onToggleGeneralNotes()
                    onCloseClipMenu()
                  }}
                  label={hideGeneralNotes ? t('Afficher note générale') : t('Masquer note générale')}
                  icon={FileText}
                  iconSecondary={hideGeneralNotes ? Eye : EyeOff}
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
            label={clips.find((item) => item.id === clipContextMenu.clipId)?.filePath ? t('Supprimer la vidéo') : t('Supprimer la ligne')}
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
          minWidthClassName="min-w-[235px]"
        >
          <AppContextMenuItem
            onClick={() => {
              onToggleGeneralNotes()
              onCloseEmptyMenu()
            }}
            label={hideGeneralNotes ? t('Afficher note générale') : t('Masquer note générale')}
            icon={FileText}
            iconSecondary={hideGeneralNotes ? Eye : EyeOff}
          />
          <AppContextMenuSeparator />
          <AppContextMenuItem
            onClick={() => {
              onImportJudgeJson()
              onCloseEmptyMenu()
            }}
            label={t('Importer un JE.json')}
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
                  icon={Play}
                />
              ) : null}
              <AppContextMenuItem
                onClick={() => {
                  onOpenDetailedNotes(selectedClip)
                  onCloseEmptyMenu()
                }}
                label={t('Notes détaillées des juges (clip sélectionné)')}
                icon={Clapperboard}
                iconSecondary={FileText}
              />
            </>
          ) : null}
        </AppContextMenuPanel>
      )}
    </>
  )
}
