import { useProjectStore } from '@/store/useProjectStore'
import {
  createClipFromFilePath,
  createClipFromVideoMeta,
  mergeImportedVideosWithClips,
} from '@/utils/clipImport'
import type { Clip } from '@/types/project'
import * as tauri from '@/services/tauri'
import { useI18n } from '@/i18n'

export function useProjectVideoActions() {
  const { t } = useI18n()
  const { currentProject, clips, setClips, updateProject } = useProjectStore()

  const buildImportedClipsFromFolder = async (folderPath: string): Promise<Clip[]> => {
    const latestClips = useProjectStore.getState().clips
    const videos = await tauri.scanVideoFolder(folderPath)
    return videos.map((video, index) => createClipFromVideoMeta(video, latestClips.length + index))
  }

  const handleImportFolder = async () => {
    if (!currentProject) return

    try {
      const latestClips = useProjectStore.getState().clips
      const folderPath = await tauri.openFolderDialog()
      if (!folderPath) return

      const importedClips = await buildImportedClipsFromFolder(folderPath)
      const merged = mergeImportedVideosWithClips(latestClips, importedClips)
      if (merged.addedCount > 0 || merged.linkedCount > 0) {
        setClips(merged.clips)
      }
      updateProject({ clipsFolderPath: folderPath })
    } catch (errorValue) {
      console.error('Failed to import folder:', errorValue)
      alert(t("Erreur lors de l'import: {error}", { error: String(errorValue) }))
    }
  }

  const handleImportFiles = async () => {
    if (!currentProject) return

    try {
      const latestClips = useProjectStore.getState().clips
      const filePaths = await tauri.openVideoFilesDialog()
      if (!filePaths || filePaths.length === 0) return

      const importedClips: Clip[] = filePaths.map((filePath, index) =>
        createClipFromFilePath(filePath, latestClips.length + index),
      )
      const merged = mergeImportedVideosWithClips(latestClips, importedClips)
      if (merged.addedCount > 0 || merged.linkedCount > 0) {
        setClips(merged.clips)
      }
    } catch (errorValue) {
      console.error('Failed to import files:', errorValue)
      alert(t("Erreur lors de l'import: {error}", { error: String(errorValue) }))
    }
  }

  const handleRelocateVideos = async () => {
    if (!currentProject || clips.length === 0) return

    try {
      const latestClips = useProjectStore.getState().clips
      const folderPath = await tauri.openFolderDialog()
      if (!folderPath) return

      const importedClips = await buildImportedClipsFromFolder(folderPath)
      if (importedClips.length === 0) {
        alert(t('Aucune vidéo trouvée dans ce dossier.'))
        return
      }

      const merged = mergeImportedVideosWithClips(latestClips, importedClips)
      const matched = merged.linkedCount

      if (matched === 0 && merged.addedCount === 0) {
        alert(t('Aucun fichier correspondant trouvé pour relocaliser/lier les vidéos.'))
        return
      }

      setClips(merged.clips)
      updateProject({ clipsFolderPath: folderPath })
      alert(t('Relocalisation terminée: {matched} liaison(s), {added} ajout(s).', {
        matched,
        added: merged.addedCount,
      }))
    } catch (errorValue) {
      console.error('Failed to relocate videos:', errorValue)
      alert(t('Erreur lors de la relocalisation: {error}', { error: String(errorValue) }))
    }
  }

  const handleRelinkOnly = async () => {
    if (!currentProject || clips.length === 0) return

    try {
      const latestClips = useProjectStore.getState().clips
      const folderPath = await tauri.openFolderDialog()
      if (!folderPath) return

      const importedClips = await buildImportedClipsFromFolder(folderPath)
      if (importedClips.length === 0) {
        alert(t('Aucune vidéo trouvée dans ce dossier.'))
        return
      }

      const merged = mergeImportedVideosWithClips(latestClips, importedClips, {
        appendUnmatched: false,
      })
      if (merged.linkedCount === 0) {
        alert(t('Aucune ligne existante n’a pu être liée.'))
        return
      }

      setClips(merged.clips)
      updateProject({ clipsFolderPath: folderPath })
      alert(t('Liaison terminée: {count} ligne(s) liée(s).', { count: merged.linkedCount }))
    } catch (errorValue) {
      console.error('Failed to relink videos:', errorValue)
      alert(t('Erreur lors de la liaison: {error}', { error: String(errorValue) }))
    }
  }

  return {
    handleImportFolder,
    handleImportFiles,
    handleRelocateVideos,
    handleRelinkOnly,
  }
}
