import { useCallback, useEffect, useRef, useState, type FocusEvent, type MutableRefObject } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import * as tauri from '@/services/tauri'
import {
  createClipFromFilePath,
  createManualClip,
  parseManualClipLine,
} from '@/utils/clipImport'
import type { Clip, ProjectSettings } from '@/types/project'

interface UseSpreadsheetManualClipsParams {
  isDragOver: boolean
  isImportingClipsRef: MutableRefObject<boolean>
  suppressEmptyManualCleanupRef: MutableRefObject<boolean>
  markDirty: () => void
  setClips: (clips: Clip[]) => void
  setCurrentClip: (index: number) => void
  removeClip: (clipId: string) => void
  updateSettings: (settings: Partial<ProjectSettings>) => void
}

export function useSpreadsheetManualClips({
  isDragOver,
  isImportingClipsRef,
  suppressEmptyManualCleanupRef,
  markDirty,
  setClips,
  setCurrentClip,
  removeClip,
  updateSettings,
}: UseSpreadsheetManualClipsParams) {
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

  const handleAddManualRow = useCallback(() => {
    const latestClips = useProjectStore.getState().clips
    const newClip = createManualClip({ displayName: '' }, latestClips.length)
    setClips([...latestClips, newClip])
    updateSettings({ showAddRowButton: true })
    markDirty()
    setCurrentClip(latestClips.length)
    setEditingManualClipId(newClip.id)
  }, [markDirty, setClips, setCurrentClip, updateSettings])

  const handleManualClipFieldChange = useCallback((clipId: string, field: 'author' | 'displayName', value: string) => {
    const latestClips = useProjectStore.getState().clips
    const next = latestClips.map((clip) => {
      if (clip.id !== clipId) return clip
      const nextAuthor = field === 'author' ? value : (clip.author ?? '')
      const nextDisplay = field === 'displayName' ? value : clip.displayName
      const rawAuthor = nextAuthor
      const rawDisplay = nextDisplay
      return {
        ...clip,
        author: rawAuthor || undefined,
        displayName: rawDisplay,
        fileName: rawAuthor && rawDisplay
          ? `${rawAuthor} - ${rawDisplay}`
          : rawDisplay || rawAuthor || clip.fileName,
      }
    })
    setClips(next)
    markDirty()
  }, [markDirty, setClips])

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
      if (!targetClip || targetClip.filePath) return

      const normalizedAuthor = normalizeManualLabel(targetClip.author)
      const normalizedDisplay = normalizeManualLabel(targetClip.displayName)
      const hasAuthor = Boolean(normalizedAuthor)
      const hasDisplay = Boolean(normalizedDisplay)
      if (!hasAuthor && !hasDisplay) {
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
            fileName: normalizedAuthor && normalizedDisplay
              ? `${normalizedAuthor} - ${normalizedDisplay}`
              : normalizedDisplay || normalizedAuthor || clip.fileName,
          }
        }),
      )

      if (editingManualClipId === clipId) {
        setEditingManualClipId(null)
      }
    }, 240)

    pendingManualCleanupTimeoutsRef.current.set(clipId, timeout)

  }, [editingManualClipId, isDragOver, isImportingClipsRef, normalizeManualLabel, removeClip, setClips, suppressEmptyManualCleanupRef])

  const handleAttachVideoToClip = useCallback(async (clipId: string) => {
    const filePaths = await tauri.openVideoFilesDialog().catch(() => null)
    if (!filePaths || filePaths.length === 0) return
    const targetPath = filePaths[0]
    if (!targetPath) return

    const latestClips = useProjectStore.getState().clips
    const duplicate = latestClips.find((clip) => clip.id !== clipId && clip.filePath === targetPath)
    if (duplicate) {
      alert('Cette vidéo est déjà liée à une autre ligne.')
      return
    }

    const imported = createClipFromFilePath(targetPath, 0)
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
  }, [markDirty, normalizeManualLabel, setClips])

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

    const entries = lines
      .map((line) => parseManualClipLine(line))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))

    const manualClips = (entries.length > 0 ? entries : [{ displayName: '' }]).map((entry, index) =>
      createManualClip(entry, index))
    setClips(manualClips)
    updateSettings({ showAddRowButton: true })
    markDirty()
    resetNoVideoTableModal()
  }, [markDirty, noVideoTableInput, resetNoVideoTableModal, setClips, updateSettings])

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
    handleAttachVideoToClip,
    resetNoVideoTableModal,
    handleCreateNoVideoTable,
  }
}
