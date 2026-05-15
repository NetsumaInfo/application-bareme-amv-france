import { useCallback, useRef, useState } from 'react'
import * as tauri from '@/services/tauri'
import { computeFramePreviewPlacement } from '@/utils/framePreviewPosition'
import {
  FRAME_PREVIEW_BASE_WIDTH,
  FRAME_PREVIEW_FALLBACK_BASE_WIDTH,
  getFramePreviewCaptureWidth,
} from '@/utils/framePreviewQuality'

interface FramePreviewState {
  visible: boolean
  left: number
  top: number
  image: string | null
  loading: boolean
}

interface ShowFramePreviewParams {
  seconds: number
  anchorRect: DOMRect
}

const INITIAL_PREVIEW_STATE: FramePreviewState = {
  visible: false,
  left: 0,
  top: 0,
  image: null,
  loading: false,
}

export function useDetachedFramePreview(clipFilePath?: string) {
  const framePreviewCacheRef = useRef<Map<string, string>>(new Map())
  const hoverRequestRef = useRef(0)
  const [framePreview, setFramePreview] = useState<FramePreviewState>(INITIAL_PREVIEW_STATE)

  const hideFramePreview = useCallback(() => {
    hoverRequestRef.current += 1
    setFramePreview((prev) => ({ ...prev, visible: false, loading: false }))
  }, [])

  const showFramePreview = useCallback(async ({ seconds, anchorRect }: ShowFramePreviewParams) => {
    const targetPath = clipFilePath ?? null
    const previewCaptureWidth = getFramePreviewCaptureWidth(FRAME_PREVIEW_BASE_WIDTH)
    const placement = computeFramePreviewPlacement({
      anchorRect,
      previewWidth: 236,
      previewHeight: 136,
    })
    const cacheKey = `${targetPath ?? '__current__'}|${seconds.toFixed(3)}|${previewCaptureWidth}`
    const requestId = ++hoverRequestRef.current

    const cached = framePreviewCacheRef.current.get(cacheKey)
    if (cached) {
      setFramePreview({
        visible: true,
        left: placement.left,
        top: placement.top,
        image: cached,
        loading: false,
      })
      return
    }

    setFramePreview({
      visible: true,
      left: placement.left,
      top: placement.top,
      image: null,
      loading: true,
    })

    const image =
      await tauri.playerGetFramePreview(targetPath, seconds, previewCaptureWidth).catch(() => null)
      ?? await tauri.playerGetFramePreview(
        targetPath,
        seconds,
        getFramePreviewCaptureWidth(FRAME_PREVIEW_FALLBACK_BASE_WIDTH),
      ).catch(() => null)
    if (hoverRequestRef.current !== requestId) return
    if (image) {
      framePreviewCacheRef.current.set(cacheKey, image)
    }
    setFramePreview({
      visible: true,
      left: placement.left,
      top: placement.top,
      image,
      loading: false,
    })
  }, [clipFilePath])

  return {
    framePreview,
    hideFramePreview,
    showFramePreview,
  }
}
