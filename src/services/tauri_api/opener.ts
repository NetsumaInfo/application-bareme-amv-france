import { openUrl } from '@tauri-apps/plugin-opener'

export async function openExternalUrl(url: string): Promise<void> {
  const normalizedUrl = url.trim()
  if (!normalizedUrl) return

  try {
    await openUrl(normalizedUrl)
    return
  } catch {
    if (typeof window !== 'undefined') {
      window.open(normalizedUrl, '_blank', 'noopener,noreferrer')
      return
    }
  }
}
