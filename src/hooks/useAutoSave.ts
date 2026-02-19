import { useEffect, useRef } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import * as tauri from '@/services/tauri'

export function useAutoSave() {
  const { currentProject, isDirty, markClean, getProjectData } = useProjectStore()
  const { getNotesData } = useNotationStore()
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const doSaveRef = useRef<() => Promise<void>>(async () => {})

  useEffect(() => {
    doSaveRef.current = async () => {
      if (!currentProject?.filePath || !isDirty) return

      try {
        const notesData = getNotesData()
        const projectData = getProjectData(notesData)
        if (!projectData) return

        await tauri.saveProjectFile(projectData, currentProject.filePath)
        markClean()
      } catch (e) {
        console.error('Auto-save failed:', e)
      }
    }
  }, [currentProject?.filePath, isDirty, getNotesData, getProjectData, markClean])

  useEffect(() => {
    if (!currentProject?.settings.autoSave || !isDirty) return

    const interval = (currentProject.settings.autoSaveInterval || 30) * 1000
    const saveDelay = Math.min(interval, 2500)

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      void doSaveRef.current()
    }, saveDelay)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [isDirty, currentProject?.settings.autoSave, currentProject?.settings.autoSaveInterval])

  return {
    doSave: () => doSaveRef.current(),
  }
}
