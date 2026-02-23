import { useProjectStore } from '@/store/useProjectStore'
import {
  createClipFromFilePath,
  createClipFromVideoMeta,
  mergeImportedVideosWithClips,
} from '@/utils/clipImport'
import type { Clip } from '@/types/project'
import * as tauri from '@/services/tauri'

export function useProjectVideoActions() {
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
      alert(`Erreur lors de l'import: ${errorValue}`)
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
      alert(`Erreur lors de l'import: ${errorValue}`)
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
        alert('Aucune vidéo trouvée dans ce dossier.')
        return
      }

      const merged = mergeImportedVideosWithClips(latestClips, importedClips)
      const matched = merged.linkedCount

      if (matched === 0 && merged.addedCount === 0) {
        alert('Aucun fichier correspondant trouvé pour relocaliser/lier les vidéos.')
        return
      }

      setClips(merged.clips)
      updateProject({ clipsFolderPath: folderPath })
      alert(`Relocalisation terminée: ${matched} liaison(s), ${merged.addedCount} ajout(s).`)
    } catch (errorValue) {
      console.error('Failed to relocate videos:', errorValue)
      alert(`Erreur lors de la relocalisation: ${errorValue}`)
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
        alert('Aucune vidéo trouvée dans ce dossier.')
        return
      }

      const merged = mergeImportedVideosWithClips(latestClips, importedClips, {
        appendUnmatched: false,
      })
      if (merged.linkedCount === 0) {
        alert('Aucune ligne existante n’a pu être liée.')
        return
      }

      setClips(merged.clips)
      updateProject({ clipsFolderPath: folderPath })
      alert(`Liaison terminée: ${merged.linkedCount} ligne(s) liée(s).`)
    } catch (errorValue) {
      console.error('Failed to relink videos:', errorValue)
      alert(`Erreur lors de la liaison: ${errorValue}`)
    }
  }

  return {
    handleImportFolder,
    handleImportFiles,
    handleRelocateVideos,
    handleRelinkOnly,
  }
}
