import { useEffect, useRef, useState } from 'react'
import * as tauri from '@/services/tauri'
import type { Clip } from '@/types/project'

const MINIATURE_WIDTH = 164
const MINIATURE_CACHE_LIMIT = 400
const MINIATURE_MAX_CONCURRENCY = 1

const miniaturePreviewCache = new Map<string, string>()
const miniatureInflightRequests = new Map<string, Promise<string | null>>()
const miniatureQueue: Array<() => void> = []
let miniatureQueueRunning = 0

function putMiniatureInCache(key: string, value: string) {
  miniaturePreviewCache.set(key, value)
  if (miniaturePreviewCache.size <= MINIATURE_CACHE_LIMIT) return
  const oldestKey = miniaturePreviewCache.keys().next().value
  if (oldestKey) miniaturePreviewCache.delete(oldestKey)
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
        .then((result) => resolve(result || null))
        .catch(() => resolve(null))
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

interface ClipMiniaturePreviewProps {
  clip: Clip
  enabled: boolean
  defaultSeconds: number
}

export function ClipMiniaturePreview({ clip, enabled, defaultSeconds }: ClipMiniaturePreviewProps) {
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
      { root: null, threshold: 0.01 },
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
          onDragStart={(event) => event.preventDefault()}
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
