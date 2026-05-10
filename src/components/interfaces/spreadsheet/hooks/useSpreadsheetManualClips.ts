import { useCallback, useEffect, useRef, useState, type FocusEvent, type MutableRefObject } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import * as tauri from '@/services/tauri'
import {
  createClipFromFilePath,
  createManualClip,
  parseManualClipLine,
} from '@/utils/clipImport'
import { buildManualFileName } from '@/utils/manualClipParser'
import { useI18n } from '@/i18n'
import type { Clip } from '@/types/project'
import {
  ALL_CONTEST_CATEGORY_KEY,
  normalizeContestCategory,
  UNCATEGORIZED_CONTEST_CATEGORY_KEY,
} from '@/utils/contestCategory'

interface UseSpreadsheetManualClipsParams {
  activeContestCategoryView: string
  isDragOver: boolean
  isImportingClipsRef: MutableRefObject<boolean>
  suppressEmptyManualCleanupRef: MutableRefObject<boolean>
  markDirty: () => void
  setClips: (clips: Clip[]) => void
  setCurrentClip: (index: number) => void
  removeClip: (clipId: string) => void
}

export function useSpreadsheetManualClips({
  activeContestCategoryView,
  isDragOver,
  isImportingClipsRef,
  suppressEmptyManualCleanupRef,
  markDirty,
  setClips,
  setCurrentClip,
  removeClip,
}: UseSpreadsheetManualClipsParams) {
  const { t } = useI18n()
  const [showNoVideoTableModal, setShowNoVideoTableModal] = useState(false)
  const [noVideoTableAccepted, setNoVideoTableAccepted] = useState(false)
  const [noVideoTableInput, setNoVideoTableInput] = useState('')
  const [noVideoTableError, setNoVideoTableError] = useState<string | null>(null)
  const [editingManualClipId, setEditingManualClipId] = useState<string | null>(null)
  const pendingManualCleanupTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    const cleanupMap = pendingManualCleanupTimeoutsRef.current
    return () => {
      cleanupMap.forEach((timeout) => clearTimeout(timeout))
      cleanupMap.clear()
    }
  }, [])

  const normalizeManualLabel = useCallback((value: string | undefined) => {
    if (!value) return ''
    return value
      .replace(/_+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }, [])

  const getClipNamePattern = useCallback(() => (
    useProjectStore.getState().currentProject?.settings.clipNamePattern ?? 'pseudo_clip'
  ), [])

  const getDefaultContestCategory = useCallback(() => {
    if (
      activeContestCategoryView === ALL_CONTEST_CATEGORY_KEY
      || activeContestCategoryView === UNCATEGORIZED_CONTEST_CATEGORY_KEY
    ) {
      return ''
    }
    return activeContestCategoryView
  }, [activeContestCategoryView])

  const handleAddManualRow = useCallback(() => {
    const latestClips = useProjectStore.getState().clips
    const newClip = createManualClip(
      { displayName: '' },
      latestClips.length,
      getClipNamePattern(),
      getDefaultContestCategory(),
    )
    setClips([...latestClips, newClip])
    markDirty()
    setCurrentClip(latestClips.length)
    setEditingManualClipId(newClip.id)
  }, [getClipNamePattern, getDefaultContestCategory, markDirty, setClips, setCurrentClip])

  const handleManualClipFieldChange = useCallback((
    clipId: string,
    field: 'author' | 'displayName' | 'contestCategory',
    value: string,
  ) => {
    const latestClips = useProjectStore.getState().clips
    const next = latestClips.map((clip) => {
      if (clip.id !== clipId) return clip
      const nextAuthor = field === 'author' ? value : (clip.author ?? '')
      const nextDisplay = field === 'displayName' ? value : clip.displayName
      const nextContestCategory = field === 'contestCategory'
        ? value
        : (clip.contestCategory ?? '')
      const rawAuthor = nextAuthor
      const rawDisplay = nextDisplay
      const keepSourceFileName = Boolean(clip.filePath?.trim())
      return {
        ...clip,
        author: rawAuthor || undefined,
        displayName: rawDisplay,
        contestCategory: normalizeContestCategory(nextContestCategory) || undefined,
        fileName: keepSourceFileName
          ? clip.fileName
          : (
              buildManualFileName(
                { author: rawAuthor, displayName: rawDisplay },
                getClipNamePattern(),
              ) || clip.fileName
            ),
      }
    })
    setClips(next)
    markDirty()
  }, [getClipNamePattern, markDirty, setClips])

  const handleStartClipIdentityEdit = useCallback((clipId: string) => {
    const pending = pendingManualCleanupTimeoutsRef.current.get(clipId)
    if (pending) {
      clearTimeout(pending)
      pendingManualCleanupTimeoutsRef.current.delete(clipId)
    }
    setEditingManualClipId(clipId)
  }, [])

  const handleSwapClipAuthorAndDisplayName = useCallback((clipId: string) => {
    const latestClips = useProjectStore.getState().clips
    let didUpdate = false
    const next = latestClips.map((clip) => {
      if (clip.id !== clipId) return clip
      didUpdate = true
      const swappedAuthor = clip.displayName ?? ''
      const swappedDisplayName = clip.author ?? ''
      const keepSourceFileName = Boolean(clip.filePath?.trim())
      return {
        ...clip,
        author: swappedAuthor.trim() ? swappedAuthor : undefined,
        displayName: swappedDisplayName,
        fileName: keepSourceFileName
          ? clip.fileName
          : (
              buildManualFileName(
                { author: swappedAuthor, displayName: swappedDisplayName },
                getClipNamePattern(),
              ) || clip.fileName
            ),
      }
    })
    if (!didUpdate) return
    setClips(next)
    markDirty()
  }, [getClipNamePattern, markDirty, setClips])

  const handleManualClipBlur = useCallback((clipId: string, event: FocusEvent<HTMLDivElement>) => {
    if (suppressEmptyManualCleanupRef.current || isDragOver) return
    const nextFocused = event.relatedTarget as Node | null
    if (nextFocused && event.currentTarget.contains(nextFocused)) return
    const previousTimeout = pendingManualCleanupTimeoutsRef.current.get(clipId)
    if (previousTimeout) {
      clearTimeout(previousTimeout)
      pendingManualCleanupTimeoutsRef.current.delete(clipId)
    }

    const timeout = window.setTimeout(() => {
      pendingManualCleanupTimeoutsRef.current.delete(clipId)
      if (suppressEmptyManualCleanupRef.current || isDragOver || isImportingClipsRef.current) return

      const latestClips = useProjectStore.getState().clips
      const targetClip = latestClips.find((clip) => clip.id === clipId)
      if (!targetClip) return

      if (targetClip.filePath) {
        const normalizedAuthor = (targetClip.author ?? '').trim()
        const normalizedDisplay = targetClip.displayName.trim()
        setClips(
          latestClips.map((clip) => {
            if (clip.id !== clipId) return clip
            return {
              ...clip,
              author: normalizedAuthor || undefined,
              displayName: normalizedDisplay,
              contestCategory: normalizeContestCategory(clip.contestCategory) || undefined,
            }
          }),
        )
        if (editingManualClipId === clipId) {
          setEditingManualClipId(null)
        }
        return
      }

      const normalizedAuthor = normalizeManualLabel(targetClip.author)
      const normalizedDisplay = normalizeManualLabel(targetClip.displayName)
      const hasAuthor = Boolean(normalizedAuthor)
      const hasDisplay = Boolean(normalizedDisplay)
      if (!hasAuthor && !hasDisplay) {
        if (latestClips.length <= 1) {
          if (editingManualClipId !== clipId) {
            setEditingManualClipId(clipId)
          }
          return
        }
        removeClip(clipId)
        if (editingManualClipId === clipId) {
          setEditingManualClipId(null)
        }
        return
      }

      setClips(
        latestClips.map((clip) => {
          if (clip.id !== clipId) return clip
          return {
            ...clip,
            author: normalizedAuthor || undefined,
            displayName: normalizedDisplay,
            contestCategory: normalizeContestCategory(clip.contestCategory) || undefined,
            fileName: buildManualFileName(
              { author: normalizedAuthor, displayName: normalizedDisplay },
              getClipNamePattern(),
            ) || clip.fileName,
          }
        }),
      )

      if (editingManualClipId === clipId) {
        setEditingManualClipId(null)
      }
    }, 240)

    pendingManualCleanupTimeoutsRef.current.set(clipId, timeout)

  }, [editingManualClipId, getClipNamePattern, isDragOver, isImportingClipsRef, normalizeManualLabel, removeClip, setClips, suppressEmptyManualCleanupRef])

  const handleAttachVideoToClip = useCallback(async (clipId: string) => {
    const filePaths = await tauri.openVideoFilesDialog().catch(() => null)
    if (!filePaths || filePaths.length === 0) return
    const targetPath = filePaths[0]
    if (!targetPath) return

    const latestClips = useProjectStore.getState().clips
    const duplicate = latestClips.find((clip) => clip.id !== clipId && clip.filePath === targetPath)
    if (duplicate) {
      alert(t('Cette vidéo est déjà liée à une autre ligne.'))
      return
    }

    const clipNamePattern = getClipNamePattern()
    const imported = createClipFromFilePath(targetPath, 0, clipNamePattern)
    const next = latestClips.map((clip) => {
      if (clip.id !== clipId) return clip
      const existingAuthor = normalizeManualLabel(clip.author)
      const existingDisplayName = normalizeManualLabel(clip.displayName)
      return {
        ...clip,
        filePath: imported.filePath,
        fileName: imported.fileName,
        author: existingAuthor || imported.author,
        displayName: existingDisplayName || imported.displayName,
        hasInternalSubtitles: imported.hasInternalSubtitles,
        audioTrackCount: imported.audioTrackCount,
      }
    })
    setClips(next)
    markDirty()
    setEditingManualClipId(null)
  }, [getClipNamePattern, markDirty, normalizeManualLabel, setClips, t])

  const resetNoVideoTableModal = useCallback(() => {
    setShowNoVideoTableModal(false)
    setNoVideoTableAccepted(false)
    setNoVideoTableInput('')
    setNoVideoTableError(null)
  }, [])

  const handleCreateNoVideoTable = useCallback(() => {
    const lines = noVideoTableInput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    const clipNamePattern = getClipNamePattern()
    const defaultContestCategory = getDefaultContestCategory()
    const entries = lines
      .map((line) => parseManualClipLine(line, clipNamePattern))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))

    const manualClips = (entries.length > 0 ? entries : [{ displayName: '' }]).map((entry, index) =>
      createManualClip(entry, index, clipNamePattern, defaultContestCategory))
    setClips(manualClips)
    markDirty()
    setCurrentClip(0)
    setEditingManualClipId(entries.length === 0 ? (manualClips[0]?.id ?? null) : null)
    resetNoVideoTableModal()
  }, [getClipNamePattern, getDefaultContestCategory, markDirty, noVideoTableInput, resetNoVideoTableModal, setClips, setCurrentClip])

  return {
    showNoVideoTableModal,
    noVideoTableAccepted,
    noVideoTableInput,
    noVideoTableError,
    editingManualClipId,
    pendingManualCleanupTimeoutsRef,
    setShowNoVideoTableModal,
    setNoVideoTableAccepted,
    setNoVideoTableInput,
    setNoVideoTableError,
    setEditingManualClipId,
    handleAddManualRow,
    handleManualClipFieldChange,
    handleManualClipBlur,
    handleStartClipIdentityEdit,
    handleSwapClipAuthorAndDisplayName,
    handleAttachVideoToClip,
    resetNoVideoTableModal,
    handleCreateNoVideoTable,
  }
}
