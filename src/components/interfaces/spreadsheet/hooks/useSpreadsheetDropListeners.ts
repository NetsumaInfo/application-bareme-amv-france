import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { listenNativeFileDrop } from '@/services/tauri'

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
  const fileDragDetectedTsRef = useRef(0)

  useEffect(() => {
    let unlistenDrop: (() => void) | null = null

    const resetCleanupSuppressionSoon = (delayMs: number) => {
      window.setTimeout(() => {
        if (!isImportingClipsRef.current) {
          suppressEmptyManualCleanupRef.current = false
        }
      }, delayMs)
    }

    listenNativeFileDrop({
      onDrop: (paths) => {
        setIsDragOver(false)
        dragHoverTsRef.current = 0
        suppressEmptyManualCleanupRef.current = true
        isImportingClipsRef.current = true
        if (paths.length > 0) {
          handleFileDrop(paths)
            .finally(() => {
              isImportingClipsRef.current = false
              resetCleanupSuppressionSoon(320)
            })
        } else {
          isImportingClipsRef.current = false
          resetCleanupSuppressionSoon(150)
        }
      },
      onHover: () => {
        dragHoverTsRef.current = Date.now()
        suppressEmptyManualCleanupRef.current = true
        setIsDragOver(true)
      },
      onCancel: () => {
        setIsDragOver(false)
        dragHoverTsRef.current = 0
        resetCleanupSuppressionSoon(100)
      },
    }).then((fn) => { unlistenDrop = fn })

    const preventBrowserFileDrop = (event: DragEvent) => {
      if (event.dataTransfer?.types?.includes('Files')) {
        fileDragDetectedTsRef.current = Date.now()
        event.preventDefault()
      }
    }
    const markSuppressionOnDragEnter = (event: DragEvent) => {
      if (!event.dataTransfer?.types?.includes('Files')) return
      fileDragDetectedTsRef.current = Date.now()
      suppressEmptyManualCleanupRef.current = true
    }
    const relaxSuppressionOnDragLeave = (event: DragEvent) => {
      if (!event.dataTransfer?.types?.includes('Files')) return
      resetCleanupSuppressionSoon(180)
    }

    window.addEventListener('dragover', preventBrowserFileDrop)
    window.addEventListener('drop', preventBrowserFileDrop)
    window.addEventListener('dragenter', markSuppressionOnDragEnter)
    window.addEventListener('dragleave', relaxSuppressionOnDragLeave)

    const forceReset = () => {
      setIsDragOver(false)
      dragHoverTsRef.current = 0
      fileDragDetectedTsRef.current = 0
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
