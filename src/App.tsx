import { useEffect } from 'react'
import { appWindow } from '@tauri-apps/api/window'
import AppLayout from '@/components/layout/AppLayout'
import FullscreenOverlay from '@/components/player/FullscreenOverlay'

const tauriWindowLabel =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__TAURI_METADATA__?.__currentWindow?.label as string | undefined

const byInitFlag =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__AMV_FULLSCREEN_OVERLAY__ === true
const byQuery = window.location.search.includes('overlay=true') || window.location.hash.includes('overlay=true')
const byPath = window.location.pathname.toLowerCase().includes('overlay')

const isOverlayWindow =
  byInitFlag ||
  appWindow.label === 'fullscreen-overlay' ||
  tauriWindowLabel === 'fullscreen-overlay' ||
  byQuery ||
  byPath

function App() {
  // For the overlay window: make background transparent
  useEffect(() => {
    if (isOverlayWindow) {
      document.documentElement.style.background = 'transparent'
      document.body.style.background = 'transparent'
      const root = document.getElementById('root')
      if (root) root.style.background = 'transparent'
    }
  }, [])

  if (isOverlayWindow) {
    return <FullscreenOverlay />
  }

  return <AppLayout />
}

export default App
