import { useEffect, useRef, useState } from 'react'
import { FolderPlus, Check, Circle, CheckSquare2, Star, Trash2 } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import { useClipDeletionStore } from '@/store/useClipDeletionStore'
import { useNotationStore } from '@/store/useNotationStore'
import { useUIStore } from '@/store/useUIStore'
import * as tauri from '@/services/tauri'
import { getClipPrimaryLabel, getClipSecondaryLabel } from '@/utils/formatters'
import { createClipFromVideoMeta, mergeImportedVideosWithClips } from '@/utils/clipImport'
import type { Clip } from '@/types/project'
import { useI18n } from '@/i18n'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import {
  AppContextMenuItem,
  AppContextMenuPanel,
  AppContextMenuSeparator,
} from '@/components/ui/AppContextMenu'
import { UI_ICONS } from '@/components/ui/actionIcons'
import { ClipFavoriteDialog } from '@/components/project/ClipFavoriteDialog'

export default function VideoList() {
  const { t } = useI18n()
  const detailedNotesIcon = UI_ICONS.detailedNotes
  const detailedNotesSecondaryIcon = UI_ICONS.detailedNotesSecondary
  const { clips, currentClipIndex, setCurrentClip, setClips, currentProject, updateProject, setClipScored, setClipFavorite } =
    useProjectStore()
  const { isClipComplete } = useNotationStore()
  const setNotesDetached = useUIStore((state) => state.setNotesDetached)
  const requestClipDeletion = useClipDeletionStore((state) => state.requestClipDeletion)
  const [contextMenu, setContextMenu] = useState<{ clipId: string; x: number; y: number } | null>(null)
  const [favoriteDialogClipId, setFavoriteDialogClipId] = useState<string | null>(null)
  const contextMenuRef = useRef<HTMLDivElement | null>(null)
  const favoriteDialogClip = favoriteDialogClipId
    ? (clips.find((clip) => clip.id === favoriteDialogClipId) ?? null)
    : null

  useEffect(() => {
    if (!contextMenu) return
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (contextMenuRef.current?.contains(target)) return
      setContextMenu(null)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [contextMenu])

  const handleImportFolder = async () => {
    try {
      const folderPath = await tauri.openFolderDialog()
      if (!folderPath) return

      const videos = await tauri.scanVideoFolder(folderPath)
      const latestClips = useProjectStore.getState().clips
      const clipNamePattern = useProjectStore.getState().currentProject?.settings.clipNamePattern ?? 'pseudo_clip'
      const importedClips: Clip[] = videos.map((video, index) =>
        createClipFromVideoMeta(video, latestClips.length + index, clipNamePattern),
      )
      const merged = mergeImportedVideosWithClips(latestClips, importedClips)
      if (merged.addedCount > 0 || merged.linkedCount > 0) {
        setClips(merged.clips)
      }
      if (currentProject) {
        updateProject({ clipsFolderPath: folderPath })
      }
    } catch (e) {
      console.error('Failed to import folder:', e)
      alert(t("Erreur lors de l'import: {error}", { error: String(e) }))
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {t('Clips')} ({clips.length})
        </h3>
        {currentProject && (
          <HoverTextTooltip text={t('Importer un dossier de vidéos')}>
            <button
              onClick={handleImportFolder}
              aria-label={t('Importer un dossier de vidéos')}
              className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
            >
              <FolderPlus size={14} />
            </button>
          </HoverTextTooltip>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {clips.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-xs">
            {currentProject
              ? t('Importez un dossier de vidéos pour commencer')
              : t('Créez ou ouvrez un projet')}
          </div>
        )}

        {clips.map((clip, index) => {
          const isActive = index === currentClipIndex
          const isComplete = isClipComplete(clip.id)
          const isScored = clip.scored || isComplete

          return (
            <button
              key={clip.id}
              onClick={() => setCurrentClip(index)}
              onContextMenu={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setContextMenu({ clipId: clip.id, x: event.clientX, y: event.clientY })
              }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 border-b border-gray-800 transition-colors ${
                isActive
                  ? 'bg-primary-600/20 text-primary-300 border-l-2 border-l-primary-500'
                  : 'text-gray-300 hover:bg-surface-light'
              }`}
            >
              <span className="flex-shrink-0">
                {isScored ? (
                  <Check size={12} className="text-green-400" />
                ) : (
                  <Circle size={12} className="text-gray-600" />
                )}
              </span>
              <span className="truncate flex-1">
                <span className="text-primary-300">{getClipPrimaryLabel(clip)}</span>
                {getClipSecondaryLabel(clip) && (
                  <span className="text-gray-500 ml-1">({getClipSecondaryLabel(clip)})</span>
                )}
              </span>
              {clip.favorite ? (
                <span
                  className="flex-shrink-0 text-amber-200"
                  title={clip.favoriteComment?.trim() || t('Favori')}
                >
                  <Star size={12} fill="currentColor" />
                </span>
              ) : null}
              <span className="text-gray-500 flex-shrink-0">{index + 1}</span>
            </button>
          )
        })}
      </div>

      {contextMenu && (
        <AppContextMenuPanel
          ref={contextMenuRef}
          x={contextMenu.x}
          y={contextMenu.y}
          minWidthClassName="min-w-[198px]"
        >
          {(() => {
            const clip = clips.find((item) => item.id === contextMenu.clipId)
            if (!clip) return null
            const clipIndex = clips.findIndex((item) => item.id === clip.id)
            return (
              <>
                <AppContextMenuItem
                  onClick={() => {
                    setClipScored(clip.id, !clip.scored)
                    setContextMenu(null)
                  }}
                  label={clip.scored ? t('Retirer "noté"') : t('Marquer comme noté')}
                  icon={CheckSquare2}
                />
                <AppContextMenuItem
                  onClick={() => {
                    setFavoriteDialogClipId(clip.id)
                    setContextMenu(null)
                  }}
                  label={clip.favorite ? t('Modifier le favori') : t('Mettre en favori')}
                  icon={Star}
                />
                <AppContextMenuSeparator />
                <AppContextMenuItem
                  onClick={() => {
                    if (clipIndex >= 0) setCurrentClip(clipIndex)
                    tauri.openNotesWindow().then(() => setNotesDetached(true)).catch(() => {})
                    setContextMenu(null)
                  }}
                  label={t('Notes détaillées')}
                  icon={detailedNotesIcon}
                  iconSecondary={detailedNotesSecondaryIcon}
                />
                <AppContextMenuSeparator />
              </>
            )
          })()}
          <AppContextMenuItem
            onClick={() => {
              requestClipDeletion(contextMenu.clipId)
              setContextMenu(null)
            }}
            label={t('Supprimer la vidéo du participant')}
            icon={Trash2}
            danger
          />
        </AppContextMenuPanel>
      )}

      {favoriteDialogClip ? (
        <ClipFavoriteDialog
          clip={favoriteDialogClip}
          onClose={() => setFavoriteDialogClipId(null)}
          onSave={(clip, comment) => {
            setClipFavorite(clip.id, true, comment)
            setFavoriteDialogClipId(null)
          }}
          onRemove={(clip) => {
            setClipFavorite(clip.id, false)
            setFavoriteDialogClipId(null)
          }}
        />
      ) : null}
    </div>
  )
}
