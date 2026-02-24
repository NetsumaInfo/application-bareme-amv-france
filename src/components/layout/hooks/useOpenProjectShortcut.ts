import { useCallback } from 'react'
import * as tauri from '@/services/tauri'
import { rememberRecentProjectPath } from '@/services/recentProjects'
import { loadAndApplyProjectFile } from '@/services/projectSession'

export function useOpenProjectShortcut() {
  return useCallback(async () => {
    try {
      const filePath = await tauri.openProjectDialog()
      if (!filePath) return
      await loadAndApplyProjectFile(filePath)
      await rememberRecentProjectPath(filePath)
    } catch (error) {
      console.error('Failed to open project:', error)
    }
  }, [])
}
