import { useCallback, useRef, useState } from 'react'
import * as tauri from '@/services/tauri'

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
    setFramePreview((prev) => ({ ...prev, visible: false }))
  }, [])

  const showFramePreview = useCallback(async ({ seconds, anchorRect }: ShowFramePreviewParams) => {
    if (!clipFilePath) return
    const left = Math.min(window.innerWidth - 250, Math.max(12, anchorRect.left))
    const top = Math.max(12, anchorRect.top - 186)
    const cacheKey = `${clipFilePath}|${seconds.toFixed(3)}`
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

    const image = await tauri.playerGetFramePreview(clipFilePath, seconds, 236).catch(() => null)
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
  }, [clipFilePath])

  return {
    framePreview,
    hideFramePreview,
    showFramePreview,
  }
}
