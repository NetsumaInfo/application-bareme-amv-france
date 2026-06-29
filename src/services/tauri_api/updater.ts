import { check, type Update } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

export interface UpdaterDownloadProgress {
  downloaded: number
  contentLength: number | null
}

/**
 * Check the configured updater endpoint (GitHub Releases latest.json) for a
 * signed update. Returns the pending Update handle, or null when up to date.
 *
 * Throws if the endpoint is unreachable or no signed release exists yet —
 * callers should degrade gracefully (e.g. open the releases page).
 */
export async function checkTauriUpdate(): Promise<Update | null> {
  return check()
}

/**
 * Download and install a pending update, reporting byte progress.
 * Does NOT relaunch — call relaunchApp() afterwards.
 */
export async function downloadAndInstallUpdate(
  update: Update,
  onProgress?: (progress: UpdaterDownloadProgress) => void,
): Promise<void> {
  let downloaded = 0
  let contentLength: number | null = null

  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case 'Started':
        contentLength = event.data.contentLength ?? null
        onProgress?.({ downloaded, contentLength })
        break
      case 'Progress':
        downloaded += event.data.chunkLength
        onProgress?.({ downloaded, contentLength })
        break
      case 'Finished':
        onProgress?.({ downloaded, contentLength })
        break
    }
  })
}

/** Restart the app so the freshly installed update takes effect. */
export async function relaunchApp(): Promise<void> {
  await relaunch()
}
