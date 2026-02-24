import { useEffect, useMemo, useState } from 'react'
import { appWindow } from '@tauri-apps/api/window'
import AppLayout from '@/components/layout/AppLayout'
import FullscreenOverlay from '@/components/player/FullscreenOverlay'
import DetachedNotesWindow from '@/components/notes/DetachedNotesWindow'
import DetachedResultatsJudgeNotesWindow from '@/components/interfaces/resultats/DetachedResultatsJudgeNotesWindow'

type WindowKind = 'main' | 'overlay' | 'notes' | 'resultats-notes'

function detectWindowKind(windowLabel?: string): WindowKind {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metadataLabel = (window as any).__TAURI_METADATA__?.__currentWindow?.label as string | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byOverlayFlag = (window as any).__AMV_FULLSCREEN_OVERLAY__ === true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byNotesFlag = (window as any).__AMV_NOTES_WINDOW__ === true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byResultatsNotesFlag = (window as any).__AMV_RESULTATS_NOTES_WINDOW__ === true
  const byOverlayQuery = window.location.search.includes('overlay=true') || window.location.hash.includes('overlay=true')
  const byResultatsNotesQuery =
    window.location.search.includes('resultats-notes=true')
    || window.location.hash.includes('resultats-notes=true')
  const byNotesQuery =
    /(?:\?|&|#)notes=true(?:&|$)/.test(window.location.search + window.location.hash)

  const label = windowLabel || metadataLabel
  if (byOverlayFlag || label === 'fullscreen-overlay' || byOverlayQuery || window.name === 'fullscreen-overlay') {
    return 'overlay'
  }
  if (
    byResultatsNotesFlag
    || label === 'resultats-notes-window'
    || byResultatsNotesQuery
    || window.name === 'resultats-notes-window'
  ) {
    return 'resultats-notes'
  }
  if (byNotesFlag || label === 'notes-window' || byNotesQuery || window.name === 'notes-window') {
    return 'notes'
  }
  return 'main'
}

function App() {
  const [windowLabel, setWindowLabel] = useState<string | undefined>(() => {
    try {
      return appWindow.label
    } catch {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (window as any).__TAURI_METADATA__?.__currentWindow?.label as string | undefined
    }
  })

  const windowKind = useMemo(() => detectWindowKind(windowLabel), [windowLabel])

  useEffect(() => {
    let active = true
    let retries = 0

    const refreshLabel = () => {
      if (!active) return
      let nextLabel: string | undefined
      try {
        nextLabel = appWindow.label
      } catch {
        // ignore until metadata is ready
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metadataLabel = (window as any).__TAURI_METADATA__?.__currentWindow?.label as string | undefined
      if (!nextLabel && metadataLabel) nextLabel = metadataLabel
      if (nextLabel && nextLabel !== windowLabel) {
        setWindowLabel(nextLabel)
        return
      }
      if (!nextLabel && retries < 20) {
        retries += 1
        setTimeout(refreshLabel, 100)
      }
    }

    refreshLabel()
    return () => {
      active = false
    }
  }, [windowLabel])

  useEffect(() => {
    if (windowKind === 'overlay') {
      document.documentElement.style.background = 'transparent'
      document.body.style.background = 'transparent'
      const root = document.getElementById('root')
      if (root) root.style.background = 'transparent'
    }
  }, [windowKind])

  if (windowKind === 'overlay') {
    return <FullscreenOverlay />
  }

  if (windowKind === 'notes') {
    return <DetachedNotesWindow />
  }

  if (windowKind === 'resultats-notes') {
    return <DetachedResultatsJudgeNotesWindow />
  }

  return <AppLayout />
}

export default App
