import { useCallback, useEffect, useState } from 'react'
import { getVersion } from '@tauri-apps/api/app'
import { loadUserSettings, saveUserSettings } from '@/services/tauri_api/persistence'
import { getReleaseNoteToShow, type ReleaseNote } from '@/constants/releaseNotes'

const LAST_SEEN_VERSION_KEY = 'lastSeenVersion'

async function loadSettings(): Promise<Record<string, unknown>> {
  const data = await loadUserSettings().catch(() => null)
  return data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
}

async function persistLastSeenVersion(version: string): Promise<void> {
  const settings = await loadSettings()
  await saveUserSettings({ ...settings, [LAST_SEEN_VERSION_KEY]: version }).catch(() => {})
}

interface WhatsNewState {
  release: ReleaseNote | null
  dismiss: () => void
}

/**
 * On the first launch after an update, surfaces the current version's release
 * notes. The "last seen" version is persisted in user settings; a brand-new
 * install records its version silently (no panel) so new users are not
 * interrupted. Main window only — do not mount in auxiliary windows.
 */
export function useWhatsNew(): WhatsNewState {
  const [release, setRelease] = useState<ReleaseNote | null>(null)
  const [currentVersion, setCurrentVersion] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      const current = await getVersion().catch(() => null)
      if (!current || !active) return
      setCurrentVersion(current)

      const settings = await loadSettings()
      if (!active) return
      const lastSeen =
        typeof settings[LAST_SEEN_VERSION_KEY] === 'string'
          ? (settings[LAST_SEEN_VERSION_KEY] as string)
          : null

      const note = getReleaseNoteToShow(current, lastSeen)
      if (note) {
        setRelease(note)
      } else if (!lastSeen) {
        // First-ever launch: record the version without showing the panel.
        void persistLastSeenVersion(current)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const dismiss = useCallback(() => {
    setRelease(null)
    if (currentVersion) {
      void persistLastSeenVersion(currentVersion)
    }
  }, [currentVersion])

  return { release, dismiss }
}
