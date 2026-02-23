import { useEffect, useRef } from 'react'
import * as tauri from '@/services/tauri'

interface UseAutoDetachNotesWindowOptions {
  hasProject: boolean
  isNotationTab: boolean
  isDualInterface: boolean
  isNotesDetached: boolean
  setNotesDetached: (detached: boolean) => void
}

export function useAutoDetachNotesWindow({
  hasProject,
  isNotationTab,
  isDualInterface,
  isNotesDetached,
  setNotesDetached,
}: UseAutoDetachNotesWindowOptions) {
  const notesAutoDetachedRef = useRef(false)

  useEffect(() => {
    const shouldAutoDetachNotes = hasProject && isNotationTab && isDualInterface

    if (!shouldAutoDetachNotes) {
      if (notesAutoDetachedRef.current) {
        notesAutoDetachedRef.current = false
        setNotesDetached(false)
        tauri.closeNotesWindow().catch(() => {})
      }
      return
    }

    notesAutoDetachedRef.current = true
    if (isNotesDetached) {
      tauri.openNotesWindow().catch(() => {})
      return
    }

    tauri.openNotesWindow()
      .then(() => setNotesDetached(true))
      .catch(() => {})
  }, [hasProject, isDualInterface, isNotationTab, isNotesDetached, setNotesDetached])
}
