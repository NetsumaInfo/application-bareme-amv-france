import { useCallback, useEffect, useRef, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import type { Clip, ImportedJudgeData } from '@/types/project'
import { useJudgeImport } from '@/components/project/useJudgeImport'

interface UseResultatsJudgeImportOptions {
  clips: Clip[]
  importedJudges: ImportedJudgeData[]
  setImportedJudges: (judges: ImportedJudgeData[]) => void
}

export function useResultatsJudgeImport({
  importedJudges,
  setImportedJudges,
}: UseResultatsJudgeImportOptions) {
  const { importing, handleImportJudgeJson, importJudgePaths } = useJudgeImport()
  const [isJsonDragOver, setIsJsonDragOver] = useState(false)
  const dragHoverTsRef = useRef(0)
  const fileDragDetectedTsRef = useRef(0)

  useEffect(() => {
    let unlistenDrop: (() => void) | null = null
    let unlistenHover: (() => void) | null = null
    let unlistenCancel: (() => void) | null = null

    listen<string[]>('tauri://file-drop', (event) => {
      setIsJsonDragOver(false)
      dragHoverTsRef.current = 0
      fileDragDetectedTsRef.current = 0
      if (event.payload && event.payload.length > 0) {
        importJudgePaths(event.payload).catch(() => {})
      }
    }).then((fn) => { unlistenDrop = fn })

    listen('tauri://file-drop-hover', () => {
      if (Date.now() - fileDragDetectedTsRef.current > 900) return
      dragHoverTsRef.current = Date.now()
      setIsJsonDragOver(true)
    }).then((fn) => { unlistenHover = fn })

    listen('tauri://file-drop-cancelled', () => {
      setIsJsonDragOver(false)
      dragHoverTsRef.current = 0
      fileDragDetectedTsRef.current = 0
    }).then((fn) => { unlistenCancel = fn })

    const preventBrowserFileDrop = (event: DragEvent) => {
      if (event.dataTransfer?.types?.includes('Files')) {
        fileDragDetectedTsRef.current = Date.now()
        event.preventDefault()
      }
    }

    const forceReset = () => {
      setIsJsonDragOver(false)
      dragHoverTsRef.current = 0
      fileDragDetectedTsRef.current = 0
    }

    const watchdog = window.setInterval(() => {
      if (!dragHoverTsRef.current) return
      if (Date.now() - dragHoverTsRef.current > 1000) {
        forceReset()
      }
    }, 250)

    window.addEventListener('dragenter', preventBrowserFileDrop)
    window.addEventListener('dragover', preventBrowserFileDrop)
    window.addEventListener('drop', preventBrowserFileDrop)
    window.addEventListener('blur', forceReset)
    window.addEventListener('mouseleave', forceReset)
    window.addEventListener('dragend', forceReset)
    window.addEventListener('drop', forceReset)

    return () => {
      if (unlistenDrop) unlistenDrop()
      if (unlistenHover) unlistenHover()
      if (unlistenCancel) unlistenCancel()
      window.clearInterval(watchdog)
      window.removeEventListener('dragenter', preventBrowserFileDrop)
      window.removeEventListener('dragover', preventBrowserFileDrop)
      window.removeEventListener('drop', preventBrowserFileDrop)
      window.removeEventListener('blur', forceReset)
      window.removeEventListener('mouseleave', forceReset)
      window.removeEventListener('dragend', forceReset)
      window.removeEventListener('drop', forceReset)
    }
  }, [importJudgePaths])

  const removeImportedJudge = useCallback((index: number) => {
    setImportedJudges(importedJudges.filter((_, i) => i !== index))
  }, [importedJudges, setImportedJudges])

  const renameImportedJudge = useCallback((index: number, nextName: string) => {
    if (index < 0 || index >= importedJudges.length) return false

    const trimmedName = nextName.trim()
    if (!trimmedName) return false

    setImportedJudges(
      importedJudges.map((judge, judgeIndex) => (
        judgeIndex === index ? { ...judge, judgeName: trimmedName } : judge
      )),
    )
    return true
  }, [importedJudges, setImportedJudges])

  return {
    importing,
    isJsonDragOver,
    handleImportJudgeJson,
    removeImportedJudge,
    renameImportedJudge,
  }
}
