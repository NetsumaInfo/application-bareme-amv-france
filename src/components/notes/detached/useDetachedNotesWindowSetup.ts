import { useEffect } from 'react'
import { emit } from '@tauri-apps/api/event'
import { useUIStore } from '@/store/useUIStore'
import { DEFAULT_SHORTCUT_BINDINGS } from '@/utils/shortcuts'
import * as tauri from '@/services/tauri'

export function useDetachedNotesWindowSetup() {
  useEffect(() => {
    document.documentElement.style.background = '#0f0f23'
    document.body.style.background = '#0f0f23'
    document.body.style.color = '#e0e0e0'
  }, [])

  useEffect(() => {
    const notifyClose = () => {
      emit('notes:close').catch(() => {})
    }
    window.addEventListener('beforeunload', notifyClose)
    window.addEventListener('unload', notifyClose)
    return () => {
      window.removeEventListener('beforeunload', notifyClose)
      window.removeEventListener('unload', notifyClose)
    }
  }, [])

  useEffect(() => {
    tauri.loadUserSettings()
      .then((data) => {
        if (!data || typeof data !== 'object') return
        const settings = data as Record<string, unknown>
        const rawBindings = settings.shortcutBindings
        if (!rawBindings || typeof rawBindings !== 'object') return
        useUIStore.setState({
          shortcutBindings: {
            ...DEFAULT_SHORTCUT_BINDINGS,
            ...(rawBindings as Record<string, string>),
          },
        })
      })
      .catch(() => {})
  }, [])
}
