import { useCallback } from 'react'
import * as tauri from '@/services/tauri'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'

export function useOpenProjectShortcut() {
  return useCallback(async () => {
    try {
      const filePath = await tauri.openProjectDialog()
      if (!filePath) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await tauri.loadProjectFile(filePath) as any
      useProjectStore.getState().setProjectFromData({
        ...data,
        version: typeof data.version === 'string' ? data.version : '1.0',
        project: { ...data.project, filePath },
        baremeId: data.baremeId ?? data.project?.baremeId ?? '',
        clips: Array.isArray(data.clips) ? data.clips : [],
        notes: data.notes ?? {},
      })
      if (data.notes) {
        useNotationStore.getState().loadNotes(data.notes)
      }
    } catch (error) {
      console.error('Failed to open project:', error)
    }
  }, [])
}
