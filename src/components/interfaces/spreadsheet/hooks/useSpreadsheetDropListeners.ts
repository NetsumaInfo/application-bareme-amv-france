import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { listen } from '@tauri-apps/api/event'

interface UseSpreadsheetDropListenersParams {
  handleFileDrop: (paths: string[]) => Promise<void>
  suppressEmptyManualCleanupRef: MutableRefObject<boolean>
  isImportingClipsRef: MutableRefObject<boolean>
}

export function useSpreadsheetDropListeners({
  handleFileDrop,
  suppressEmptyManualCleanupRef,
  isImportingClipsRef,
}: UseSpreadsheetDropListenersParams) {
  const [isDragOver, setIsDragOver] = useState(false)
  const dragHoverTsRef = useRef(0)

  useEffect(() => {
    let unlistenDrop: (() => void) | null = null
    let unlistenHover: (() => void) | null = null
    let unlistenCancel: (() => void) | null = null

    const resetCleanupSuppressionSoon = (delayMs: number) => {
      window.setTimeout(() => {
        if (!isImportingClipsRef.current) {
          suppressEmptyManualCleanupRef.current = false
        }
      }, delayMs)
    }

    listen<string[]>('tauri://file-drop', (event) => {
      setIsDragOver(false)
      dragHoverTsRef.current = 0
      suppressEmptyManualCleanupRef.current = true
      isImportingClipsRef.current = true
      if (event.payload && event.payload.length > 0) {
        handleFileDrop(event.payload)
          .finally(() => {
            isImportingClipsRef.current = false
            resetCleanupSuppressionSoon(320)
          })
      } else {
        isImportingClipsRef.current = false
        resetCleanupSuppressionSoon(150)
      }
    }).then((fn) => { unlistenDrop = fn })

    listen('tauri://file-drop-hover', () => {
      dragHoverTsRef.current = Date.now()
      suppressEmptyManualCleanupRef.current = true
      setIsDragOver(true)
    }).then((fn) => { unlistenHover = fn })

    listen('tauri://file-drop-cancelled', () => {
      setIsDragOver(false)
      dragHoverTsRef.current = 0
      resetCleanupSuppressionSoon(100)
    }).then((fn) => { unlistenCancel = fn })

    const preventBrowserFileDrop = (event: DragEvent) => {
      if (event.dataTransfer?.types?.includes('Files')) {
        event.preventDefault()
      }
    }
    const markSuppressionOnDragEnter = () => {
      suppressEmptyManualCleanupRef.current = true
    }
    const relaxSuppressionOnDragLeave = () => {
      resetCleanupSuppressionSoon(180)
    }

    window.addEventListener('dragover', preventBrowserFileDrop)
    window.addEventListener('drop', preventBrowserFileDrop)
    window.addEventListener('dragenter', markSuppressionOnDragEnter)
    window.addEventListener('dragleave', relaxSuppressionOnDragLeave)

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
      window.removeEventListener('dragover', preventBrowserFileDrop)
      window.removeEventListener('drop', preventBrowserFileDrop)
      window.removeEventListener('dragenter', markSuppressionOnDragEnter)
      window.removeEventListener('dragleave', relaxSuppressionOnDragLeave)
    }
  }, [handleFileDrop, isImportingClipsRef, suppressEmptyManualCleanupRef])

  return {
    isDragOver,
  }
}
