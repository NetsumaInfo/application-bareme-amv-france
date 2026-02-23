import { useCallback } from 'react'
import * as tauri from '@/services/tauri'
import { useProjectStore } from '@/store/useProjectStore'

export function useMiniatureActions() {
  const toggleMiniatures = useCallback(() => {
    const store = useProjectStore.getState()
    const project = store.currentProject
    if (!project) return
    store.updateSettings({
      showMiniatures: !project.settings.showMiniatures,
    })
  }, [])

  const setCurrentClipMiniatureFrame = useCallback(async () => {
    const store = useProjectStore.getState()
    const project = store.currentProject
    const clip = store.clips[store.currentClipIndex]
    if (!project || !clip?.filePath) return

    if (!project.settings.showMiniatures) {
      store.updateSettings({ showMiniatures: true })
    }

    const status = await tauri.playerGetStatus().catch(() => null)
    const seconds = Number(status?.current_time)
    if (!Number.isFinite(seconds) || seconds < 0) return
    store.setClipThumbnailTime(clip.id, seconds)
  }, [])

  return {
    toggleMiniatures,
    setCurrentClipMiniatureFrame,
  }
}
