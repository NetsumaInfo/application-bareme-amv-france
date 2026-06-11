import { useEffect, useRef } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import * as tauri from '@/services/tauri'
import { resolveProjectBareme } from '@/store/projectStoreProjectActions'

// Stable save routine that reads fresh state at call time. Hoisted to module
// scope so it is never recreated per render and never participates in any
// effect dependency array.
async function performAutoSave() {
  const projectState = useProjectStore.getState()
  const { currentProject, isDirty, markClean, getProjectData } = projectState
  if (!currentProject?.filePath || !isDirty) return

  try {
    const notationState = useNotationStore.getState()
    const notesData = notationState.getNotesData()
    const activeBareme = resolveProjectBareme(
      currentProject.baremeId,
      notationState.currentBareme,
      notationState.availableBaremes,
    )
    const projectData = getProjectData(notesData, activeBareme)
    if (!projectData) return

    await tauri.saveProjectFile(projectData, currentProject.filePath)
    markClean()
  } catch (e) {
    console.error('Auto-save failed:', e)
  }
}

export function useAutoSave() {
  const isDirty = useProjectStore((s) => s.isDirty)
  const autoSave = useProjectStore((s) => s.currentProject?.settings.autoSave)
  const autoSaveInterval = useProjectStore((s) => s.currentProject?.settings.autoSaveInterval)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!autoSave || !isDirty) return

    const interval = (autoSaveInterval || 30) * 1000
    const saveDelay = Math.min(interval, 2500)

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      void performAutoSave()
    }, saveDelay)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [isDirty, autoSave, autoSaveInterval])

  return {
    doSave: () => performAutoSave(),
  }
}
