import { useEffect } from 'react'
import { emit } from '@tauri-apps/api/event'
import { useWindowUiSettingsSync } from '@/hooks/useWindowUiSettingsSync'

export function useDetachedNotesWindowSetup() {
  useWindowUiSettingsSync()

  useEffect(() => {
    document.documentElement.style.background = 'rgb(var(--color-surface-dark))'
    document.body.style.background = 'rgb(var(--color-surface-dark))'
    document.body.style.color = 'rgb(229 231 235)'
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
}
