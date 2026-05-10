import { useCallback, useRef } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import * as tauri from '@/services/tauri'
import {
  createClipFromFilePath,
  createClipFromVideoMeta,
  mergeImportedVideosWithClips,
} from '@/utils/clipImport'
import { useI18n } from '@/i18n'
import { normalizeFilePath } from '@/utils/path'
import { useSpreadsheetDropListeners } from '@/components/interfaces/spreadsheet/hooks/useSpreadsheetDropListeners'
import type { Clip, Project } from '@/types/project'
import {
  ALL_CONTEST_CATEGORY_KEY,
  UNCATEGORIZED_CONTEST_CATEGORY_KEY,
} from '@/utils/contestCategory'

const VIDEO_EXTENSIONS = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'm4v', 'wmv', 'mpg', 'mpeg', 'ts', 'vob', 'ogv', 'amv']

interface UseSpreadsheetImportParams {
  currentProject: Project | null
  activeContestCategoryView: string
  markDirty: () => void
  setClips: (clips: Clip[]) => void
  updateProject: (updates: Partial<Project>) => void
}

export function useSpreadsheetImport({
  currentProject,
  activeContestCategoryView,
  markDirty,
  setClips,
  updateProject,
}: UseSpreadsheetImportParams) {
  const { t } = useI18n()
  const suppressEmptyManualCleanupRef = useRef(false)
  const isImportingClipsRef = useRef(false)

  const isVideoFile = useCallback((path: string) => {
    const ext = path.split('.').pop()?.toLowerCase() ?? ''
    return VIDEO_EXTENSIONS.includes(ext)
  }, [])

  const getImportContestCategory = useCallback(() => {
    if (
      activeContestCategoryView === ALL_CONTEST_CATEGORY_KEY
      || activeContestCategoryView === UNCATEGORIZED_CONTEST_CATEGORY_KEY
    ) {
      return ''
    }
    return activeContestCategoryView
  }, [activeContestCategoryView])

  const applyImportedClips = useCallback((importedClips: Clip[]) => {
    if (importedClips.length === 0) return
    const latestClips = useProjectStore.getState().clips
    const merged = mergeImportedVideosWithClips(latestClips, importedClips)
    if (merged.addedCount <= 0 && merged.linkedCount <= 0) return
    setClips(merged.clips)
    markDirty()
  }, [markDirty, setClips])

  const getClipNamePattern = useCallback(() => (
    useProjectStore.getState().currentProject?.settings.clipNamePattern ?? 'pseudo_clip'
  ), [])

  const handleFileDrop = useCallback(async (paths: string[]) => {
    const latestClips = useProjectStore.getState().clips
    const existingPaths = new Set(
      latestClips
        .map((clip) => normalizeFilePath(clip.filePath))
        .filter((path) => Boolean(path)),
    )
    const queuedPaths = new Set<string>()
    const videoPaths = paths.filter((pathValue) => {
      if (!isVideoFile(pathValue)) return false
      const normalized = normalizeFilePath(pathValue)
      if (!normalized || existingPaths.has(normalized) || queuedPaths.has(normalized)) return false
      queuedPaths.add(normalized)
      return true
    })
    const folderPaths = paths.filter((p) => !p.includes('.') || (!isVideoFile(p) && !p.endsWith('.json')))

    let folderVideos: tauri.VideoMetadata[] = []
    for (const folder of folderPaths) {
      try {
        const videos = await tauri.scanVideoFolder(folder)
        const uniqueVideos = videos.filter((video) => {
          const normalized = normalizeFilePath(video.file_path)
          if (!normalized || existingPaths.has(normalized) || queuedPaths.has(normalized)) return false
          queuedPaths.add(normalized)
          return true
        })
        folderVideos = [...folderVideos, ...uniqueVideos]
      } catch {
        // ignore invalid folders
      }
    }

    const clipNamePattern = getClipNamePattern()
    const importContestCategory = getImportContestCategory()
    const importedClips: Clip[] = [
      ...videoPaths.map((filePath, i) => createClipFromFilePath(
        filePath,
        latestClips.length + i,
        clipNamePattern,
        importContestCategory,
      )),
      ...folderVideos.map((video, i) =>
        createClipFromVideoMeta(
          video,
          latestClips.length + videoPaths.length + i,
          clipNamePattern,
          importContestCategory,
        ),
      ),
    ]

    applyImportedClips(importedClips)
  }, [applyImportedClips, getClipNamePattern, getImportContestCategory, isVideoFile])

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
      const clipNamePattern = getClipNamePattern()
      const importContestCategory = getImportContestCategory()
      const importedClips = videos.map((video, index) =>
        createClipFromVideoMeta(video, latestClips.length + index, clipNamePattern, importContestCategory),
      )
      applyImportedClips(importedClips)
      if (currentProject) {
        updateProject({ clipsFolderPath: folderPath })
      }
    } catch (error) {
      console.error('Failed to import folder:', error)
      alert(t("Erreur lors de l'import: {error}", { error: String(error) }))
    } finally {
      endImportingSoon()
    }
  }, [applyImportedClips, currentProject, endImportingSoon, getClipNamePattern, getImportContestCategory, t, updateProject])

  const handleImportFiles = useCallback(async () => {
    try {
      isImportingClipsRef.current = true
      suppressEmptyManualCleanupRef.current = true
      const latestClips = useProjectStore.getState().clips
      const filePaths = await tauri.openVideoFilesDialog()
      if (!filePaths || filePaths.length === 0) return

      const clipNamePattern = getClipNamePattern()
      const importContestCategory = getImportContestCategory()
      const importedClips = filePaths.map((filePath, index) =>
        createClipFromFilePath(filePath, latestClips.length + index, clipNamePattern, importContestCategory),
      )
      applyImportedClips(importedClips)
    } catch (error) {
      console.error('Failed to import files:', error)
      alert(t("Erreur lors de l'import: {error}", { error: String(error) }))
    } finally {
      endImportingSoon()
    }
  }, [applyImportedClips, endImportingSoon, getClipNamePattern, getImportContestCategory, t])

  return {
    isDragOver,
    suppressEmptyManualCleanupRef,
    isImportingClipsRef,
    handleFileDrop,
    handleImportFolder,
    handleImportFiles,
  }
}
