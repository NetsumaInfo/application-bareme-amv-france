import { useEffect, useRef } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { useNotationStore } from '@/store/useNotationStore'
import * as tauri from '@/services/tauri'
import { resolveProjectBareme } from '@/store/projectStoreProjectActions'

async function doAutoSave() {
  // Read the latest state at save time instead of capturing it in a closure —
  // keeps the save callback stable across renders.
  const projectStore = useProjectStore.getState()
  const notationStore = useNotationStore.getState()
  const { currentProject, isDirty } = projectStore
  if (!currentProject?.filePath || !isDirty) return

  try {
    const notesData = notationStore.getNotesData()
    const activeBareme = resolveProjectBareme(
      currentProject.baremeId,
      notationStore.currentBareme,
      notationStore.availableBaremes,
    )
    const projectData = projectStore.getProjectData(notesData, activeBareme)
    if (!projectData) return

    await tauri.saveProjectFile(projectData, currentProject.filePath)
    projectStore.markClean()
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
      void doAutoSave()
    }, saveDelay)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [isDirty, autoSave, autoSaveInterval])

  return {
    doSave: doAutoSave,
  }
}
