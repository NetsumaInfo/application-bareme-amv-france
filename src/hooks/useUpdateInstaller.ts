import { useCallback, useState } from 'react'
import { useSaveProject } from '@/hooks/useSaveProject'
import { useAppUpdateStore } from '@/store/useAppUpdateStore'
import {
  checkTauriUpdate,
  downloadAndInstallUpdate,
  relaunchApp,
  openExternalUrl,
} from '@/services/tauri'
import { GITHUB_RELEASES_URL } from '@/constants/projectLinks'

type InstallPhase = 'idle' | 'saving' | 'checking' | 'downloading' | 'installing' | 'error'

interface UpdateInstallerState {
  phase: InstallPhase
  progressPct: number | null
  busy: boolean
  applyUpdate: () => Promise<void>
}

/**
 * Orchestrates the "install update" action triggered from the header logo:
 * save the current project first, then download + install the signed update
 * via the Tauri updater and relaunch. If no signed release is available yet
 * (endpoint missing / check fails), gracefully falls back to opening the
 * GitHub releases page in the browser.
 */
export function useUpdateInstaller(): UpdateInstallerState {
  const { save } = useSaveProject()
  const [phase, setPhase] = useState<InstallPhase>('idle')
  const [progressPct, setProgressPct] = useState<number | null>(null)

  const applyUpdate = useCallback(async () => {
    const releaseUrl = useAppUpdateStore.getState().releaseUrl || GITHUB_RELEASES_URL
    const openReleasePage = () => {
      openExternalUrl(releaseUrl).catch(() => {})
    }

    setProgressPct(null)
    setPhase('saving')
    try {
      await save()
    } catch {
      // Saving is best-effort; continue with the update either way.
    }

    setPhase('checking')
    try {
      const update = await checkTauriUpdate()
      if (!update) {
        // No signed update at the endpoint yet — fall back to the web page.
        setPhase('idle')
        openReleasePage()
        return
      }

      setPhase('downloading')
      await downloadAndInstallUpdate(update, ({ downloaded, contentLength }) => {
        if (contentLength && contentLength > 0) {
          setProgressPct(Math.min(100, Math.round((downloaded / contentLength) * 100)))
        }
      })

      setPhase('installing')
      await relaunchApp()
    } catch {
      setPhase('error')
      openReleasePage()
      window.setTimeout(() => setPhase('idle'), 4000)
    }
  }, [save])

  return {
    phase,
    progressPct,
    busy: phase !== 'idle' && phase !== 'error',
    applyUpdate,
  }
}
