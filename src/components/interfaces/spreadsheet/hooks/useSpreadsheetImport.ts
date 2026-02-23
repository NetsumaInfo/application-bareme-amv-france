import { useCallback, useRef } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import * as tauri from '@/services/tauri'
import {
  createClipFromFilePath,
  createClipFromVideoMeta,
  mergeImportedVideosWithClips,
} from '@/utils/clipImport'
import { useSpreadsheetDropListeners } from '@/components/interfaces/spreadsheet/hooks/useSpreadsheetDropListeners'
import type { Clip, Project, ProjectSettings } from '@/types/project'

const VIDEO_EXTENSIONS = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'm4v', 'wmv', 'mpg', 'mpeg', 'ts', 'vob', 'ogv', 'amv']

interface UseSpreadsheetImportParams {
  currentProject: Project | null
  markDirty: () => void
  setClips: (clips: Clip[]) => void
  updateProject: (updates: Partial<Project>) => void
  updateSettings: (updates: Partial<ProjectSettings>) => void
}

export function useSpreadsheetImport({
  currentProject,
  markDirty,
  setClips,
  updateProject,
  updateSettings,
}: UseSpreadsheetImportParams) {
  const suppressEmptyManualCleanupRef = useRef(false)
  const isImportingClipsRef = useRef(false)

  const isVideoFile = useCallback((path: string) => {
    const ext = path.split('.').pop()?.toLowerCase() ?? ''
    return VIDEO_EXTENSIONS.includes(ext)
  }, [])

  const applyImportedClips = useCallback((importedClips: Clip[]) => {
    if (importedClips.length === 0) return
    const latestClips = useProjectStore.getState().clips
    const wasEmptyBeforeImport = latestClips.length === 0
    const merged = mergeImportedVideosWithClips(latestClips, importedClips)
    if (merged.addedCount <= 0 && merged.linkedCount <= 0) return
    setClips(merged.clips)
    if (wasEmptyBeforeImport) {
      updateSettings({ showAddRowButton: false })
    }
    markDirty()
  }, [markDirty, setClips, updateSettings])

  const handleFileDrop = useCallback(async (paths: string[]) => {
    const latestClips = useProjectStore.getState().clips
    const existingPaths = new Set(
      latestClips
        .map((clip) => clip.filePath)
        .filter((path) => Boolean(path)),
    )
    const videoPaths = paths.filter((p) => isVideoFile(p) && !existingPaths.has(p))
    const folderPaths = paths.filter((p) => !p.includes('.') || (!isVideoFile(p) && !p.endsWith('.json')))

    let folderVideos: tauri.VideoMetadata[] = []
    for (const folder of folderPaths) {
      try {
        const videos = await tauri.scanVideoFolder(folder)
        folderVideos = [...folderVideos, ...videos.filter((v) => !existingPaths.has(v.file_path))]
      } catch {
        // ignore invalid folders
      }
    }

    const importedClips: Clip[] = [
      ...videoPaths.map((filePath, i) => createClipFromFilePath(filePath, latestClips.length + i)),
      ...folderVideos.map((video, i) =>
        createClipFromVideoMeta(video, latestClips.length + videoPaths.length + i),
      ),
    ]

    applyImportedClips(importedClips)
  }, [applyImportedClips, isVideoFile])

  const { isDragOver } = useSpreadsheetDropListeners({
    handleFileDrop,
    suppressEmptyManualCleanupRef,
    isImportingClipsRef,
  })

  const endImportingSoon = useCallback((delayMs = 220) => {
    isImportingClipsRef.current = false
    window.setTimeout(() => {
      if (!isImportingClipsRef.current) {
        suppressEmptyManualCleanupRef.current = false
      }
    }, delayMs)
  }, [])

  const handleImportFolder = useCallback(async () => {
    try {
      isImportingClipsRef.current = true
      suppressEmptyManualCleanupRef.current = true
      const latestClips = useProjectStore.getState().clips
      const folderPath = await tauri.openFolderDialog()
      if (!folderPath) return

      const videos = await tauri.scanVideoFolder(folderPath)
      const importedClips = videos.map((video, index) =>
        createClipFromVideoMeta(video, latestClips.length + index),
      )
      applyImportedClips(importedClips)
      if (currentProject) {
        updateProject({ clipsFolderPath: folderPath })
      }
    } catch (error) {
      console.error('Failed to import folder:', error)
      alert(`Erreur lors de l'import: ${error}`)
    } finally {
      endImportingSoon()
    }
  }, [applyImportedClips, currentProject, endImportingSoon, updateProject])

  const handleImportFiles = useCallback(async () => {
    try {
      isImportingClipsRef.current = true
      suppressEmptyManualCleanupRef.current = true
      const latestClips = useProjectStore.getState().clips
      const filePaths = await tauri.openVideoFilesDialog()
      if (!filePaths || filePaths.length === 0) return

      const importedClips = filePaths.map((filePath, index) =>
        createClipFromFilePath(filePath, latestClips.length + index),
      )
      applyImportedClips(importedClips)
    } catch (error) {
      console.error('Failed to import files:', error)
      alert(`Erreur lors de l'import: ${error}`)
    } finally {
      endImportingSoon()
    }
  }, [applyImportedClips, endImportingSoon])

  return {
    isDragOver,
    suppressEmptyManualCleanupRef,
    isImportingClipsRef,
    handleFileDrop,
    handleImportFolder,
    handleImportFiles,
  }
}
