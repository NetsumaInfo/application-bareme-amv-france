import { useRef, useCallback, useMemo, useState, useEffect } from 'react'
import { FolderPlus, FilePlus, Download } from 'lucide-react'
import { emit, listen } from '@tauri-apps/api/event'
import MediaInfoPanel from '@/components/player/MediaInfoPanel'
import TimecodeTextarea from '@/components/notes/TimecodeTextarea'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import { usePlayer } from '@/hooks/usePlayer'
import * as tauri from '@/services/tauri'
import { generateId, parseClipName, getClipPrimaryLabel, getClipSecondaryLabel, formatPreciseTimecode } from '@/utils/formatters'
import { CATEGORY_COLOR_PRESETS, sanitizeColor, withAlpha } from '@/utils/colors'
import { normalizeShortcutFromEvent } from '@/utils/shortcuts'
import { snapToFrameSeconds } from '@/utils/timecodes'
import type { Clip } from '@/types/project'
import type { Criterion } from '@/types/bareme'

interface CategoryGroup {
  category: string
  criteria: Criterion[]
  totalMax: number
  color: string
}

const VIDEO_EXTENSIONS = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'm4v', 'wmv', 'mpg', 'mpeg', 'ts', 'vob', 'ogv', 'amv']
const MINIATURE_WIDTH = 164
const miniaturePreviewCache = new Map<string, string>()
const MINIATURE_CACHE_LIMIT = 400
const MINIATURE_MAX_CONCURRENCY = 1
const miniatureInflightRequests = new Map<string, Promise<string | null>>()
const miniatureQueue: Array<() => void> = []
let miniatureQueueRunning = 0

function putMiniatureInCache(key: string, value: string) {
  miniaturePreviewCache.set(key, value)
  if (miniaturePreviewCache.size <= MINIATURE_CACHE_LIMIT) return
  const oldestKey = miniaturePreviewCache.keys().next().value
  if (oldestKey) {
    miniaturePreviewCache.delete(oldestKey)
  }
}

function runMiniatureQueue() {
  while (miniatureQueueRunning < MINIATURE_MAX_CONCURRENCY && miniatureQueue.length > 0) {
    const task = miniatureQueue.shift()
    if (!task) break
    miniatureQueueRunning += 1
    task()
  }
}

function enqueueMiniaturePreviewRequest(key: string, path: string, seconds: number): Promise<string | null> {
  const inflight = miniatureInflightRequests.get(key)
  if (inflight) return inflight

  const promise = new Promise<string | null>((resolve) => {
    miniatureQueue.push(() => {
      tauri.playerGetFramePreview(path, seconds, MINIATURE_WIDTH)
        .then((result) => {
          resolve(result || null)
        })
        .catch(() => {
          resolve(null)
        })
        .finally(() => {
          miniatureQueueRunning = Math.max(0, miniatureQueueRunning - 1)
          miniatureInflightRequests.delete(key)
          setTimeout(runMiniatureQueue, 0)
        })
    })
    runMiniatureQueue()
  })

  miniatureInflightRequests.set(key, promise)
  return promise
}

function resolveMiniatureSeconds(clip: Clip, defaultSeconds: number): number {
  const safeDefault = Number.isFinite(defaultSeconds) && defaultSeconds >= 0 ? defaultSeconds : 10
  if (typeof clip.thumbnailTime === 'number' && Number.isFinite(clip.thumbnailTime) && clip.thumbnailTime >= 0) {
    return clip.thumbnailTime
  }
  if (typeof clip.duration === 'number' && clip.duration > 0) {
    return Math.max(0, Math.min(clip.duration - 0.1, safeDefault))
  }
  return safeDefault
}

function ClipMiniaturePreview({
  clip,
  enabled,
  defaultSeconds,
}: {
  clip: Clip
  enabled: boolean
  defaultSeconds: number
}) {
  const [imageState, setImageState] = useState<{ key: string; value: string | null }>({
    key: '',
    value: null,
  })
  const [statusState, setStatusState] = useState<{ key: string; loading: boolean; failed: boolean }>({
    key: '',
    loading: false,
    failed: false,
  })
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const seconds = resolveMiniatureSeconds(clip, defaultSeconds)
  const cacheKey = `${clip.filePath}|${seconds.toFixed(3)}|${MINIATURE_WIDTH}`
  const cachedImage = miniaturePreviewCache.get(cacheKey) ?? null
  const image = imageState.key === cacheKey ? imageState.value : null
  const loading = statusState.key === cacheKey ? statusState.loading : false
  const failed = statusState.key === cacheKey ? statusState.failed : false
  const resolvedImage = cachedImage ?? image

  useEffect(() => {
    const node = containerRef.current
    if (!enabled || !node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setIsVisible(Boolean(entry?.isIntersecting))
      },
      {
        root: null,
        threshold: 0.01,
      },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled, cacheKey])

  useEffect(() => {
    if (!enabled || !clip.filePath || !isVisible) return

    if (miniaturePreviewCache.has(cacheKey)) return

    let active = true
    queueMicrotask(() => {
      if (!active) return
      setImageState({ key: cacheKey, value: null })
      setStatusState({ key: cacheKey, loading: true, failed: false })
    })
    enqueueMiniaturePreviewRequest(cacheKey, clip.filePath, seconds)
      .then((result) => {
        if (!active) return
        if (!result) {
          setImageState({ key: cacheKey, value: null })
          setStatusState({ key: cacheKey, loading: false, failed: true })
          return
        }
        putMiniatureInCache(cacheKey, result)
        setImageState({ key: cacheKey, value: result })
        setStatusState({ key: cacheKey, loading: false, failed: false })
      })
      .catch(() => {
        if (!active) return
        setImageState({ key: cacheKey, value: null })
        setStatusState({ key: cacheKey, loading: false, failed: true })
      })

    return () => {
      active = false
    }
  }, [cacheKey, clip.filePath, enabled, isVisible, seconds])

  if (!enabled) return null

  return (
    <div
      ref={containerRef}
      className="mt-1 w-[82px] h-[46px] rounded-md overflow-hidden border border-gray-700 bg-black/60 pointer-events-none select-none"
    >
      {resolvedImage ? (
        <img
          src={resolvedImage}
          alt={`Miniature ${clip.displayName}`}
          className="w-full h-full object-cover pointer-events-none select-none"
          draggable={false}
          onDragStart={(event) => {
            event.preventDefault()
          }}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500">
          {loading ? 'Frame...' : failed ? 'No frame' : 'Miniature'}
        </div>
      )}
    </div>
  )
}

export default function SpreadsheetInterface() {
  const {
    currentBareme,
    updateCriterion,
    getNoteForClip,
    getScoreForClip,
    setTextNotes,
  } = useNotationStore()
  const { seek, pause } = usePlayer()
  const {
    clips,
    currentClipIndex,
    setCurrentClip,
    setClips,
    currentProject,
    updateProject,
    updateSettings,
    setClipScored,
    setClipThumbnailTime,
    markDirty,
    removeClip,
  } = useProjectStore()
  const { setShowPipVideo, hideAverages, hideTextNotes, setNotesDetached, shortcutBindings } = useUIStore()
  const cellRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map())
  const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [contextMenu, setContextMenu] = useState<{ clipId: string; x: number; y: number } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement | null>(null)
  const [mediaInfoClip, setMediaInfoClip] = useState<{ name: string; path: string } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [scoringCategory, setScoringCategory] = useState<string | null>(null)
  const scoringPanelRef = useRef<HTMLDivElement | null>(null)
  const dragHoverTsRef = useRef(0)
  const [clipFps, setClipFps] = useState<number | null>(null)
  const framePreviewCacheRef = useRef<Map<string, string>>(new Map())
  const hoverRequestRef = useRef(0)
  const [framePreview, setFramePreview] = useState<{
    visible: boolean
    left: number
    top: number
    image: string | null
    loading: boolean
  }>({
    visible: false,
    left: 0,
    top: 0,
    image: null,
    loading: false,
  })

  const isVideoFile = useCallback((path: string) => {
    const ext = path.split('.').pop()?.toLowerCase() ?? ''
    return VIDEO_EXTENSIONS.includes(ext)
  }, [])

  const handleFileDrop = useCallback(async (paths: string[]) => {
    const existingPaths = new Set(clips.map((c) => c.filePath))
    const videoPaths = paths.filter((p) => isVideoFile(p) && !existingPaths.has(p))
    const folderPaths = paths.filter((p) => !p.includes('.') || (!isVideoFile(p) && !p.endsWith('.json')))

    // Scan dropped folders
    let folderVideos: tauri.VideoMetadata[] = []
    for (const folder of folderPaths) {
      try {
        const videos = await tauri.scanVideoFolder(folder)
        folderVideos = [...folderVideos, ...videos.filter((v) => !existingPaths.has(v.file_path))]
      } catch { /* ignore invalid folders */ }
    }

    const allNewClips: Clip[] = [
      ...videoPaths.map((filePath, i) => {
        const fileName = filePath.split(/[\\/]/).pop() || filePath
        const parsed = parseClipName(fileName)
        return {
          id: generateId(),
          fileName,
          filePath,
          displayName: parsed.displayName,
          author: parsed.author,
          duration: 0,
          hasInternalSubtitles: false,
          audioTrackCount: 1,
          scored: false,
          order: clips.length + i,
        }
      }),
      ...folderVideos.map((v, i) => {
        const parsed = parseClipName(v.file_name)
        return {
          id: generateId(),
          fileName: v.file_name,
          filePath: v.file_path,
          displayName: parsed.displayName,
          author: parsed.author,
          duration: 0,
          hasInternalSubtitles: false,
          audioTrackCount: 1,
          scored: false,
          order: clips.length + videoPaths.length + i,
        }
      }),
    ]

    if (allNewClips.length > 0) {
      setClips([...clips, ...allNewClips])
      markDirty()
    }
  }, [clips, setClips, markDirty, isVideoFile])

  // Listen for Tauri file drop events
  useEffect(() => {
    let unlistenDrop: (() => void) | null = null
    let unlistenHover: (() => void) | null = null
    let unlistenCancel: (() => void) | null = null

    listen<string[]>('tauri://file-drop', (event) => {
      setIsDragOver(false)
      dragHoverTsRef.current = 0
      if (event.payload && event.payload.length > 0) {
        handleFileDrop(event.payload)
      }
    }).then((fn) => { unlistenDrop = fn })

    listen('tauri://file-drop-hover', () => {
      dragHoverTsRef.current = Date.now()
      setIsDragOver(true)
    }).then((fn) => { unlistenHover = fn })

    listen('tauri://file-drop-cancelled', () => {
      setIsDragOver(false)
      dragHoverTsRef.current = 0
    }).then((fn) => { unlistenCancel = fn })

    const forceReset = () => {
      setIsDragOver(false)
      dragHoverTsRef.current = 0
    }
    const watchdog = window.setInterval(() => {
      if (!dragHoverTsRef.current) return
      if (Date.now() - dragHoverTsRef.current > 1000) {
        forceReset()
      }
    }, 250)
    window.addEventListener('blur', forceReset)
    window.addEventListener('mouseleave', forceReset)
    window.addEventListener('dragend', forceReset)
    window.addEventListener('drop', forceReset)

    return () => {
      if (unlistenDrop) unlistenDrop()
      if (unlistenHover) unlistenHover()
      if (unlistenCancel) unlistenCancel()
      window.clearInterval(watchdog)
      window.removeEventListener('blur', forceReset)
      window.removeEventListener('mouseleave', forceReset)
      window.removeEventListener('dragend', forceReset)
      window.removeEventListener('drop', forceReset)
    }
  }, [handleFileDrop])

  const openClipContextMenu = useCallback((clipId: string, x: number, y: number) => {
    const width = 210
    const height = 248
    const paddedX = Math.max(8, Math.min(x, window.innerWidth - width - 8))
    const paddedY = Math.max(8, Math.min(y, window.innerHeight - height - 8))
    setContextMenu({ clipId, x: paddedX, y: paddedY })
  }, [])

  useEffect(() => {
    if (!contextMenu) return
    const handleClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [contextMenu])

  // Close scoring panel on click outside
  useEffect(() => {
    if (!scoringCategory) return
    const handleClick = (e: MouseEvent) => {
      if (scoringPanelRef.current && !scoringPanelRef.current.contains(e.target as Node)) {
        setScoringCategory(null)
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setScoringCategory(null)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [scoringCategory])

  const criteriaCount = currentBareme?.criteria.length ?? 0

  const categoryGroups = useMemo((): CategoryGroup[] => {
    if (!currentBareme) return []
    const groups: CategoryGroup[] = []
    const seen = new Map<string, number>()

    for (const c of currentBareme.criteria) {
      const cat = c.category || 'Général'
      if (seen.has(cat)) {
        groups[seen.get(cat)!].criteria.push(c)
        groups[seen.get(cat)!].totalMax += (c.max ?? 10)
      } else {
        seen.set(cat, groups.length)
        const colorFromBareme = currentBareme.categoryColors?.[cat]
        groups.push({
          category: cat,
          criteria: [c],
          totalMax: (c.max ?? 10),
          color: sanitizeColor(
            colorFromBareme,
            CATEGORY_COLOR_PRESETS[groups.length % CATEGORY_COLOR_PRESETS.length],
          ),
        })
      }
    }
    return groups
  }, [currentBareme])

  const currentClip = clips[currentClipIndex]
  const currentNote = currentClip ? getNoteForClip(currentClip.id) : undefined
  const allClipsScored = clips.length > 0 && clips.every((clip) => clip.scored)
  const hideTotalsSetting = Boolean(currentProject?.settings.hideTotals)
  const hideTotalsUntilAllScored = Boolean(currentProject?.settings.hideFinalScoreUntilEnd) && !allClipsScored
  const showMiniatures = Boolean(currentProject?.settings.showMiniatures)

  const setMiniatureFromCurrentFrame = useCallback(async (clipId: string) => {
    if (!currentProject?.settings.showMiniatures) {
      updateSettings({ showMiniatures: true })
    }
    const status = await tauri.playerGetStatus().catch(() => null)
    const seconds = Number(status?.current_time)
    if (!Number.isFinite(seconds) || seconds < 0) return
    setClipThumbnailTime(clipId, seconds)
  }, [currentProject?.settings.showMiniatures, setClipThumbnailTime, updateSettings])

  const hideFramePreview = useCallback(() => {
    setFramePreview((prev) => ({ ...prev, visible: false }))
  }, [])

  const showFramePreview = useCallback(async (params: { seconds: number; anchorRect: DOMRect }) => {
    if (!currentClip?.filePath) return

    const left = Math.min(window.innerWidth - 250, Math.max(12, params.anchorRect.left))
    const top = Math.max(12, params.anchorRect.top - 186)
    const cacheKey = `${currentClip.filePath}|${params.seconds.toFixed(3)}`
    const requestId = ++hoverRequestRef.current

    const cached = framePreviewCacheRef.current.get(cacheKey)
    if (cached) {
      setFramePreview({
        visible: true,
        left,
        top,
        image: cached,
        loading: false,
      })
      return
    }

    setFramePreview({
      visible: true,
      left,
      top,
      image: null,
      loading: true,
    })

    const image = await tauri.playerGetFramePreview(currentClip.filePath, params.seconds, 236).catch(() => null)
    if (hoverRequestRef.current !== requestId) return
    if (image) {
      framePreviewCacheRef.current.set(cacheKey, image)
    }
    setFramePreview({
      visible: true,
      left,
      top,
      image,
      loading: false,
    })
  }, [currentClip])

  useEffect(() => {
    let active = true
    if (!currentClip?.filePath) {
      return () => {
        active = false
      }
    }

    tauri.playerGetMediaInfo(currentClip.filePath)
      .then((info) => {
        if (!active) return
        const fps = Number(info?.fps)
        setClipFps(Number.isFinite(fps) && fps > 0 ? fps : null)
      })
      .catch(() => {
        if (!active) return
        setClipFps(null)
      })

    return () => {
      active = false
    }
  }, [currentClip?.id, currentClip?.filePath])

  const sortedClips = useMemo(() => {
    const base = [...clips]
    const originalIndex = new Map(clips.map((clip, index) => [clip.id, index]))
    base.sort((a, b) => {
      const labelA = getClipPrimaryLabel(a)
      const labelB = getClipPrimaryLabel(b)
      const cmp = labelA.localeCompare(labelB, 'fr', { sensitivity: 'base' })
      if (cmp !== 0) return cmp
      return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0)
    })
    return base
  }, [clips])

  const focusCell = useCallback(
    (clipIdx: number, critIdx: number) => {
      if (clipIdx < 0 || clipIdx >= sortedClips.length) return
      if (critIdx < 0 || critIdx >= criteriaCount) return
      const key = `${clipIdx}-${critIdx}`
      const input = cellRefs.current.get(key)
      if (input) {
        input.focus()
        input.select()
      }
      // Scroll row into view
      const row = rowRefs.current.get(clipIdx)
      if (row) {
        row.scrollIntoView({ block: 'nearest' })
      }
      // Map sorted index to original index
      const clip = sortedClips[clipIdx]
      const originalIndex = clips.findIndex(c => c.id === clip.id)
      if (originalIndex !== -1) {
        setCurrentClip(originalIndex)
      }
    },
    [sortedClips, clips, criteriaCount, setCurrentClip],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, clipIdx: number, critIdx: number) => {
      const shortcut = normalizeShortcutFromEvent(e.nativeEvent)
      if (shortcut === shortcutBindings.notesNextField) {
        e.preventDefault()
        focusCell(clipIdx, critIdx + 1)
        return
      }
      if (shortcut === shortcutBindings.notesPrevField) {
        e.preventDefault()
        focusCell(clipIdx, critIdx - 1)
        return
      }
      if (shortcut === shortcutBindings.notesFieldDown) {
        e.preventDefault()
        focusCell(clipIdx + 1, critIdx)
        return
      }
      if (shortcut === shortcutBindings.notesFieldUp) {
        e.preventDefault()
        focusCell(clipIdx - 1, critIdx)
        return
      }

      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        if (critIdx < criteriaCount - 1) focusCell(clipIdx, critIdx + 1)
        else if (clipIdx < sortedClips.length - 1) focusCell(clipIdx + 1, 0)
      } else if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault()
        if (critIdx > 0) focusCell(clipIdx, critIdx - 1)
        else if (clipIdx > 0) focusCell(clipIdx - 1, criteriaCount - 1)
      } else if (e.key === 'ArrowRight') {
        const input = e.currentTarget as HTMLInputElement
        if (input.selectionStart === input.value.length) {
          e.preventDefault()
          focusCell(clipIdx, critIdx + 1)
        }
      } else if (e.key === 'ArrowLeft') {
        const input = e.currentTarget as HTMLInputElement
        if (input.selectionStart === 0) {
          e.preventDefault()
          focusCell(clipIdx, critIdx - 1)
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        focusCell(clipIdx + 1, critIdx)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        focusCell(clipIdx - 1, critIdx)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        focusCell(clipIdx + 1, critIdx)
      }
    },
    [focusCell, sortedClips.length, criteriaCount, shortcutBindings],
  )

  const handleChange = useCallback(
    (clipId: string, criterionId: string, value: string) => {
      const numValue = value === '' ? '' : Number(value)
      if (typeof numValue === 'number' && isNaN(numValue)) return
      updateCriterion(clipId, criterionId, numValue as number)
      markDirty()
    },
    [updateCriterion, markDirty],
  )

  const insertTextAtCursor = useCallback((textarea: HTMLTextAreaElement, insertion: string) => {
    const start = textarea.selectionStart ?? textarea.value.length
    const end = textarea.selectionEnd ?? start
    const value = textarea.value
    const before = value.slice(0, start)
    const after = value.slice(end)
    const needsSpaceBefore = before.length > 0 && !/\s$/.test(before)
    const needsSpaceAfter = after.length > 0 && !/^\s/.test(after)
    const insert = `${needsSpaceBefore ? ' ' : ''}${insertion}${needsSpaceAfter ? ' ' : ''}`
    const nextValue = `${before}${insert}${after}`
    const caret = before.length + insert.length
    return { nextValue, caret }
  }, [])

  const insertCurrentTimecode = useCallback(async () => {
    if (!currentClip) return
    const textarea = notesTextareaRef.current
    if (!textarea) return

    const status = await tauri.playerGetStatus().catch(() => null)
    if (!status) return
    const preciseSeconds = snapToFrameSeconds(status.current_time, clipFps ?? undefined)
    const timecode = formatPreciseTimecode(preciseSeconds)
    const { nextValue, caret } = insertTextAtCursor(textarea, timecode)
    setTextNotes(currentClip.id, nextValue)
    markDirty()
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(caret, caret)
    })
  }, [clipFps, currentClip, insertTextAtCursor, markDirty, setTextNotes])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const shortcut = normalizeShortcutFromEvent(event)
      if (!shortcut || shortcut !== shortcutBindings.insertTimecode) return
      event.preventDefault()
      event.stopPropagation()
      insertCurrentTimecode().catch(() => { })
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [insertCurrentTimecode, shortcutBindings])

  const openPlayerAtFront = useCallback(() => {
    setShowPipVideo(true)
    tauri.playerShow()
      .then(() => tauri.playerSyncOverlay().catch(() => { }))
      .catch(() => { })
    setTimeout(() => {
      tauri.playerSyncOverlay().catch(() => { })
    }, 120)
  }, [setShowPipVideo])

  const handleImportFolder = async () => {
    try {
      const folderPath = await tauri.openFolderDialog()
      if (!folderPath) return

      const videos = await tauri.scanVideoFolder(folderPath)

      const newClips: Clip[] = videos.map((v, i) => {
        const parsed = parseClipName(v.file_name)
        return {
          id: generateId(),
          fileName: v.file_name,
          filePath: v.file_path,
          displayName: parsed.displayName,
          author: parsed.author,
          duration: 0,
          hasInternalSubtitles: false,
          audioTrackCount: 1,
          scored: false,
          order: clips.length + i,
        }
      })

      setClips([...clips, ...newClips])
      if (currentProject) {
        updateProject({ clipsFolderPath: folderPath })
      }
    } catch (e) {
      console.error('Failed to import folder:', e)
      alert(`Erreur lors de l'import: ${e}`)
    }
  }

  const handleImportFiles = async () => {
    try {
      const filePaths = await tauri.openVideoFilesDialog()
      if (!filePaths || filePaths.length === 0) return

      const newClips: Clip[] = filePaths.map((filePath, i) => {
        const fileName = filePath.split(/[\\/]/).pop() || filePath
        const parsed = parseClipName(fileName)
        return {
          id: generateId(),
          fileName,
          filePath,
          displayName: parsed.displayName,
          author: parsed.author,
          duration: 0,
          hasInternalSubtitles: false,
          audioTrackCount: 1,
          scored: false,
          order: clips.length + i,
        }
      })

      setClips([...clips, ...newClips])
    } catch (e) {
      console.error('Failed to import files:', e)
      alert(`Erreur lors de l'import: ${e}`)
    }
  }

  const getCategoryScore = useCallback(
    (clipId: string, group: CategoryGroup): number => {
      const note = getNoteForClip(clipId)
      if (!note) return 0
      let total = 0
      for (const c of group.criteria) {
        const score = note.scores[c.id]
        if (score && score.isValid && typeof score.value === 'number') {
          total += score.value
        }
      }
      return Math.round(total * 100) / 100
    },
    [getNoteForClip],
  )

  const hasAnyScoreInGroup = useCallback(
    (clipId: string, group: CategoryGroup): boolean => {
      const note = getNoteForClip(clipId)
      if (!note) return false
      for (const criterion of group.criteria) {
        const score = note.scores[criterion.id]
        if (!score) continue
        if (score.isValid === false) continue
        if (typeof score.value === 'boolean') return true
        const value = Number(score.value)
        if (Number.isFinite(value)) return true
      }
      return false
    },
    [getNoteForClip],
  )

  const hasAnyScoreInBareme = useCallback(
    (clipId: string): boolean => {
      if (!currentBareme) return false
      const note = getNoteForClip(clipId)
      if (!note) return false
      for (const criterion of currentBareme.criteria) {
        const score = note.scores[criterion.id]
        if (!score) continue
        if (score.isValid === false) continue
        if (typeof score.value === 'boolean') return true
        const value = Number(score.value)
        if (Number.isFinite(value)) return true
      }
      return false
    },
    [currentBareme, getNoteForClip],
  )

  if (!currentBareme) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Aucun barème sélectionné
      </div>
    )
  }

  if (clips.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-full gap-4 transition-colors ${isDragOver ? 'bg-primary-600/10' : ''
        }`}>
        <div className={`flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed transition-colors ${isDragOver ? 'border-primary-400 bg-primary-600/5' : 'border-gray-700'
          }`}>
          {isDragOver ? (
            <>
              <Download size={32} className="text-primary-400" />
              <p className="text-primary-400 text-sm font-medium">
                Déposez vos fichiers ici
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-500 text-sm">
                Glissez-déposez des vidéos ici, ou
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleImportFolder}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
                >
                  <FolderPlus size={16} />
                  Importer un dossier
                </button>
                <button
                  onClick={handleImportFiles}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary-600 text-primary-500 hover:bg-primary-600/10 text-sm font-medium transition-colors"
                >
                  <FilePlus size={16} />
                  Importer des fichiers
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  const scoredClips = clips.filter((clip) => clip.scored)
  const contextClip = contextMenu ? clips.find((clip) => clip.id === contextMenu.clipId) ?? null : null

  // Build flat criteria index for cell navigation
  let globalCritIdx = 0
  const critIdxMap = new Map<string, number>()
  for (const c of currentBareme.criteria) {
    critIdxMap.set(c.id, globalCritIdx++)
  }

  return (
    <div className={`flex flex-col h-full ${isDragOver ? 'ring-2 ring-primary-400 ring-inset' : ''}`}>
      {/* Drag overlay */}
      {isDragOver && clips.length > 0 && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 pointer-events-none">
          <div className="flex flex-col items-center gap-2 p-6 rounded-xl bg-surface border-2 border-dashed border-primary-400">
            <Download size={28} className="text-primary-400" />
            <p className="text-primary-400 text-sm font-medium">Déposez pour ajouter des vidéos</p>
          </div>
        </div>
      )}
      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10">
            {/* Row 1: Category headers */}
            <tr>
              <th
                rowSpan={2}
                className="px-2 py-1.5 text-center text-[10px] font-medium text-gray-500 border-r border-b border-gray-700 w-7 bg-surface-dark sticky left-0 z-20"
              >
                #
              </th>
              <th
                rowSpan={2}
                className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 border-r border-b border-gray-700 min-w-[120px] bg-surface-dark sticky left-7 z-20"
              >
                Pseudo
              </th>
              {categoryGroups.map((g) => (
                <th
                  key={g.category}
                  colSpan={g.criteria.length}
                  className="px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider border-r border-b border-gray-600 cursor-pointer select-none transition-all hover:brightness-125"
                  style={{
                    backgroundColor: withAlpha(g.color, 0.22),
                    borderColor: withAlpha(g.color, 0.35),
                  }}
                  onClick={() => setScoringCategory(scoringCategory === g.category ? null : g.category)}
                  title={`Cliquez pour noter "${g.category}"`}
                >
                  <span style={{ color: g.color }}>{g.category}</span>
                  <span className="font-normal text-gray-500 ml-1">
                    /{g.totalMax}
                  </span>
                </th>
              ))}
              {!hideTotalsSetting && (
                <th
                  rowSpan={2}
                  className="px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider border-b border-gray-700 min-w-[50px] bg-surface-dark"
                >
                  Total
                  <div className="font-normal text-gray-500">
                    /{currentBareme.totalPoints}
                  </div>
                </th>
              )}
            </tr>

            {/* Row 2: Criteria names */}
            <tr>
              {categoryGroups.map((g) =>
                g.criteria.map((c) => (
                  <th
                    key={c.id}
                    className="px-1 py-1 text-center text-[9px] font-medium border-r border-b border-gray-700 min-w-[76px]"
                    title={c.description}
                    style={{ backgroundColor: withAlpha(g.color, 0.12) }}
                  >
                    <div className="truncate" style={{ color: withAlpha(g.color, 0.92) }}>
                      {g.criteria.length === 1 ? '' : c.name}
                    </div>
                    <div className="text-gray-500 font-normal">
                      /{c.max ?? 10}
                    </div>
                  </th>
                )),
              )}
            </tr>
          </thead>

          <tbody>
            {sortedClips.map((clip, clipIdx) => {
              const note = getNoteForClip(clip.id)
              const totalScore = getScoreForClip(clip.id)
              const currentClip = clips[currentClipIndex]
              const isActive = currentClip?.id === clip.id

              return (
                <tr
                  key={clip.id}
                  ref={(el) => { if (el) rowRefs.current.set(clipIdx, el) }}
                  className={`transition-colors cursor-pointer ${isActive
                      ? 'bg-primary-600/15'
                      : clipIdx % 2 === 0
                        ? 'bg-surface-dark/30'
                        : 'bg-transparent'
                    } hover:bg-primary-600/10`}
                  onClick={() => {
                    const originalIndex = clips.findIndex(c => c.id === clip.id)
                    if (originalIndex !== -1) setCurrentClip(originalIndex)
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    openClipContextMenu(clip.id, e.clientX, e.clientY)
                  }}
                >
                  <td
                    className={`px-2 py-1 text-center font-mono text-[10px] text-gray-500 border-r border-gray-800 sticky left-0 z-10 ${isActive
                        ? 'bg-primary-900/30'
                        : clipIdx % 2 === 0
                          ? 'bg-surface-dark'
                          : 'bg-surface'
                      }`}
                  >
                    {clipIdx + 1}
                  </td>

                  <td
                    className={`px-2 py-1 border-r border-gray-800 sticky left-7 z-10 group/clip ${isActive
                        ? 'bg-primary-900/30'
                        : clipIdx % 2 === 0
                          ? 'bg-surface-dark'
                          : 'bg-surface'
                      }`}
                    onDoubleClick={() => openPlayerAtFront()}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      openClipContextMenu(clip.id, e.clientX, e.clientY)
                    }}
                  >
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="w-2 flex items-center justify-center shrink-0">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${clip.scored ? 'bg-green-500 opacity-100' : 'opacity-0'}`}
                        />
                      </span>
                      <div className="truncate flex flex-col min-w-0 leading-tight flex-1">
                        <span className="truncate text-primary-300 text-[11px] font-semibold">
                          {getClipPrimaryLabel(clip)}
                        </span>
                        {getClipSecondaryLabel(clip) && (
                          <span className="truncate text-[9px] text-gray-500">
                            {getClipSecondaryLabel(clip)}
                          </span>
                        )}
                        {showMiniatures && (
                          <ClipMiniaturePreview
                            clip={clip}
                            enabled={showMiniatures}
                            defaultSeconds={currentProject?.settings.thumbnailDefaultTimeSec ?? 10}
                          />
                        )}
                      </div>
                    </div>
                  </td>

                  {currentBareme.criteria.map((criterion) => {
                    const critIdx = critIdxMap.get(criterion.id) ?? 0
                    const score = note?.scores[criterion.id]
                    const hasError = score && !score.isValid
                    const value = score?.value ?? ''

                    return (
                      <td
                        key={criterion.id}
                        className="px-0.5 py-0.5 border-r border-gray-800 text-center"
                      >
                        <input
                          ref={(el) => {
                            if (el)
                              cellRefs.current.set(`${clipIdx}-${critIdx}`, el)
                          }}
                          type="number"
                          min={criterion.min}
                          max={criterion.max}
                          step={criterion.step || 0.5}
                          value={value === '' ? '' : String(value)}
                          onChange={(e) =>
                            handleChange(clip.id, criterion.id, e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDown(e, clipIdx, critIdx)}
                          onFocus={() => {
                            const originalIndex = clips.findIndex(c => c.id === clip.id)
                            if (originalIndex !== -1) setCurrentClip(originalIndex)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={`amv-soft-number w-full px-1 py-0.5 text-center rounded text-xs font-mono transition-colors focus-visible:outline-none ${hasError
                              ? 'border border-accent bg-accent/10 text-accent-light'
                              : 'border border-transparent bg-transparent text-white hover:bg-surface-light/50 focus:border-primary-500 focus:bg-surface-dark'
                            } focus:outline-none`}
                        />
                      </td>
                    )
                  })}

                  {!hideTotalsSetting && (
                    <td className="px-2 py-1 text-center font-mono font-bold text-[11px]">
                      <span
                        className={
                          hideTotalsUntilAllScored ? 'text-gray-600' : totalScore > 0 ? 'text-white' : 'text-gray-600'
                        }
                      >
                        {hideTotalsUntilAllScored ? '-' : totalScore}
                      </span>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>

          {/* Footer averages */}
          {clips.length > 1 && !hideAverages && !hideTotalsUntilAllScored && (
            <tfoot>
              <tr>
                <td
                  colSpan={2 + currentBareme.criteria.length + (hideTotalsSetting ? 0 : 1)}
                  className="h-[2px] bg-gray-500"
                />
              </tr>
              <tr className="bg-surface-dark">
                <td
                  colSpan={2}
                  className="px-2 py-2 font-bold text-[10px] uppercase tracking-wider text-gray-300 border-r border-gray-600 sticky left-0 z-10 bg-surface-dark"
                >
                  Moyennes
                </td>
                {categoryGroups.map((g) =>
                  g.criteria.map((c, i) => {
                    if (i === 0) {
                      const values = scoredClips
                        .filter((clip) => hasAnyScoreInGroup(clip.id, g))
                        .map((clip) => getCategoryScore(clip.id, g))
                      const avg = values.length > 0
                        ? values.reduce((sum, value) => sum + value, 0) / values.length
                        : 0
                      return (
                        <td
                          key={`avg-${c.id}`}
                          colSpan={g.criteria.length}
                          className="px-1 py-2 text-center border-r border-gray-600"
                          style={{ backgroundColor: withAlpha(g.color, 0.22) }}
                        >
                          <span
                            className="text-[11px] font-mono font-bold"
                            style={{ color: g.color }}
                          >
                            {avg.toFixed(1)}
                          </span>
                          <span className="text-[9px] text-gray-400">
                            /{g.totalMax}
                          </span>
                        </td>
                      )
                    }
                    return null
                  }),
                )}
                {!hideTotalsSetting && (
                  <td className="px-2 py-2 text-center font-mono font-bold text-[12px] text-white bg-surface-dark">
                    {(() => {
                      const values = scoredClips
                        .filter((clip) => hasAnyScoreInBareme(clip.id))
                        .map((clip) => getScoreForClip(clip.id))
                      return (values.length > 0
                        ? values.reduce((sum, value) => sum + value, 0) / values.length
                        : 0
                      ).toFixed(1)
                    })()
                    }
                  </td>
                )}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Notes for selected clip */}
      {currentClip && !hideTextNotes && (
        <div className="px-3 py-2 border-t border-gray-700 bg-surface shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
              Notes
            </span>
            <span className="text-[10px] text-gray-600">—</span>
            <span className="text-[10px] text-gray-400">
              <span className="text-primary-400">
                {getClipPrimaryLabel(currentClip)}
              </span>
              {getClipSecondaryLabel(currentClip) && (
                <span className="text-gray-500 ml-1">
                  - {getClipSecondaryLabel(currentClip)}
                </span>
              )}
            </span>
            <span className="text-[10px] text-gray-600 ml-auto">
              {categoryGroups.map((g) => (
                <span key={g.category} className="ml-2">
                  <span style={{ color: g.color }}>{g.category}</span>:{' '}
                  <span className="text-gray-400">
                    {getCategoryScore(currentClip.id, g)}/{g.totalMax}
                  </span>
                </span>
              ))}
            </span>
          </div>
          <TimecodeTextarea
            placeholder="Notes libres pour ce clip..."
            value={currentNote?.textNotes ?? ''}
            onChange={(nextValue) => {
              setTextNotes(currentClip.id, nextValue)
              markDirty()
            }}
            rows={2}
            textareaClassName="text-xs min-h-[40px]"
            color="#60a5fa"
            fpsHint={clipFps ?? undefined}
            onTimecodeSelect={async (item) => {
              if (!currentClip) return
              setShowPipVideo(true)
              await seek(item.seconds)
              await pause()
              const detail = {
                clipId: currentClip.id,
                seconds: item.seconds,
                category: null,
                criterionId: null,
              }
              window.dispatchEvent(new CustomEvent('amv:focus-note-marker', { detail }))
              emit('main:focus-note-marker', detail).catch(() => { })
            }}
            onTimecodeHover={({ item, anchorRect }) => {
              showFramePreview({
                seconds: item.seconds,
                anchorRect,
              }).catch(() => { })
            }}
            onTimecodeLeave={hideFramePreview}
            textareaRef={(el) => {
              notesTextareaRef.current = el
            }}
          />
        </div>
      )}

      {framePreview.visible && (
        <div
          className="fixed z-[120] pointer-events-none rounded-lg border border-gray-600 bg-surface shadow-2xl overflow-hidden"
          style={{ left: framePreview.left, top: framePreview.top, width: 236 }}
        >
          <div className="h-[132px] bg-black flex items-center justify-center">
            {framePreview.loading ? (
              <span className="text-[10px] text-gray-500">Chargement frame...</span>
            ) : framePreview.image ? (
              <img
                src={framePreview.image}
                alt="Frame preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[10px] text-gray-500">Preview indisponible</span>
            )}
          </div>
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextClip && (
            <>
              <button
                onClick={() => {
                  setClipScored(contextClip.id, !contextClip.scored)
                  setContextMenu(null)
                }}
                className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors"
              >
                {contextClip.scored ? 'Retirer "noté"' : 'Marquer comme noté'}
              </button>
              <div className="border-t border-gray-700 my-0.5" />
              <button
                onClick={() => {
                  const index = clips.findIndex((item) => item.id === contextClip.id)
                  if (index >= 0) setCurrentClip(index)
                  tauri.openNotesWindow().then(() => setNotesDetached(true)).catch(() => { })
                  setContextMenu(null)
                }}
                className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Notes du clip
              </button>
              {showMiniatures && currentClip?.id === contextClip.id && (
                <>
                  <div className="border-t border-gray-700 my-0.5" />
                  <button
                    onClick={() => {
                      setMiniatureFromCurrentFrame(contextClip.id).catch(() => { })
                      setContextMenu(null)
                    }}
                    className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors"
                  >
                    Définir miniature (frame courante)
                  </button>
                  <button
                    onClick={() => {
                      setClipThumbnailTime(contextClip.id, null)
                      setContextMenu(null)
                    }}
                    className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors"
                  >
                    Réinitialiser miniature
                  </button>
                </>
              )}
              <div className="border-t border-gray-700 my-0.5" />
            </>
          )}
          <button
            onClick={() => {
              updateSettings({ showMiniatures: !showMiniatures })
              setContextMenu(null)
            }}
            className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors"
          >
            {showMiniatures ? 'Masquer miniatures' : 'Afficher miniatures'}
          </button>
          <div className="border-t border-gray-700 my-0.5" />
          <button
            onClick={() => {
              const clip = clips.find((c) => c.id === contextMenu.clipId)
              if (clip) {
                setMediaInfoClip({ name: getClipPrimaryLabel(clip), path: clip.filePath })
              }
              setContextMenu(null)
            }}
            className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Afficher MediaInfo
          </button>
          <div className="border-t border-gray-700 my-0.5" />
          <button
            onClick={() => {
              removeClip(contextMenu.clipId)
              setContextMenu(null)
            }}
            className="w-full text-left px-3 py-1.5 text-[11px] text-red-400 hover:bg-gray-800 transition-colors"
          >
            Supprimer la vidéo
          </button>
        </div>
      )}

      {/* MediaInfo panel */}
      {mediaInfoClip && (
        <MediaInfoPanel
          clipName={mediaInfoClip.name}
          filePath={mediaInfoClip.path}
          onClose={() => setMediaInfoClip(null)}
        />
      )}

      {/* Category scoring panel */}
      {scoringCategory && currentClip && (() => {
        const group = categoryGroups.find((g) => g.category === scoringCategory)
        if (!group) return null
        const clipNote = getNoteForClip(currentClip.id)
        const catScore = getCategoryScore(currentClip.id, group)

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setScoringCategory(null)}>
            <div
              ref={scoringPanelRef}
              className="w-[380px] max-h-[80vh] rounded-xl border shadow-2xl overflow-hidden flex flex-col"
              style={{
                backgroundColor: '#0f0f23',
                borderColor: withAlpha(group.color, 0.35),
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Panel header */}
              <div
                className="px-4 py-3 flex items-center justify-between shrink-0"
                style={{
                  backgroundColor: withAlpha(group.color, 0.18),
                  borderBottom: `1px solid ${withAlpha(group.color, 0.3)}`,
                }}
              >
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: group.color }}>
                    {group.category}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[200px]">
                    {getClipPrimaryLabel(currentClip)}
                    {currentClip.author && (
                      <span className="text-gray-500"> — {currentClip.author}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold font-mono" style={{ color: catScore > 0 ? group.color : '#6b7280' }}>
                    {catScore}
                  </span>
                  <span className="text-xs text-gray-500">/{group.totalMax}</span>
                </div>
              </div>

              {/* Criteria inputs */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {group.criteria.map((criterion) => {
                  const score = clipNote?.scores[criterion.id]
                  const value = score?.value ?? ''
                  const hasError = score && !score.isValid

                  return (
                    <div
                      key={criterion.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                      style={{
                        backgroundColor: hasError ? withAlpha('#ef4444', 0.12) : withAlpha(group.color, 0.06),
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-200 truncate" title={criterion.name}>
                          {criterion.name}
                        </div>
                        {criterion.description && (
                          <div className="text-[9px] text-gray-500 truncate">
                            {criterion.description}
                          </div>
                        )}
                      </div>
                      <input
                        type="number"
                        min={criterion.min}
                        max={criterion.max}
                        step={criterion.step || 0.5}
                        value={value === '' ? '' : String(value)}
                        onChange={(e) => handleChange(currentClip.id, criterion.id, e.target.value)}
                        autoFocus={criterion.id === group.criteria[0]?.id}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'ArrowDown') {
                            e.preventDefault()
                            const idx = group.criteria.findIndex((c) => c.id === criterion.id)
                            const nextCrit = group.criteria[idx + 1]
                            if (nextCrit) {
                              const nextInput = scoringPanelRef.current?.querySelector(
                                `input[data-crit-id="${nextCrit.id}"]`,
                              ) as HTMLInputElement | null
                              nextInput?.focus()
                              nextInput?.select()
                            } else {
                              setScoringCategory(null)
                            }
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault()
                            const idx = group.criteria.findIndex((c) => c.id === criterion.id)
                            const prevCrit = group.criteria[idx - 1]
                            if (prevCrit) {
                              const prevInput = scoringPanelRef.current?.querySelector(
                                `input[data-crit-id="${prevCrit.id}"]`,
                              ) as HTMLInputElement | null
                              prevInput?.focus()
                              prevInput?.select()
                            }
                          } else if (e.key === 'Escape') {
                            setScoringCategory(null)
                          }
                        }}
                        data-crit-id={criterion.id}
                        className={`amv-soft-number w-20 px-2 py-1.5 text-center text-sm rounded-lg border font-mono focus-visible:outline-none ${hasError
                            ? 'border-accent bg-accent/10 text-accent-light'
                            : 'text-white focus:border-primary-500'
                          } focus:outline-none`}
                        style={!hasError ? {
                          borderColor: withAlpha(group.color, 0.4),
                          backgroundColor: withAlpha(group.color, 0.1),
                        } : undefined}
                      />
                      <span className="text-[10px] text-gray-500 w-7 text-right font-mono">
                        /{criterion.max ?? 10}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Panel footer */}
              <div className="px-3 py-2 border-t border-gray-700 flex items-center justify-between shrink-0" style={{ background: '#1a1a2e' }}>
                <span className="text-[10px] text-gray-500">
                  Entrée/↓ = suivant · Échap = fermer
                </span>
                <button
                  onClick={() => setScoringCategory(null)}
                  className="px-3 py-1 text-[11px] rounded-md bg-surface-light text-gray-300 hover:text-white hover:bg-primary-600 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
