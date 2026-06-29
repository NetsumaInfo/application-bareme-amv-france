import { invoke } from '@tauri-apps/api/core'

const hasTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

export interface WindowChrome {
  /** Use the native dark title-bar variant (light glyphs on the close button). */
  dark: boolean
  /** Caption (title-bar) background, `#RRGGBB`. */
  caption: string
  /** Title text colour, `#RRGGBB`. */
  text: string
  /** Window border colour, `#RRGGBB`. */
  border: string
}

/**
 * Theme the calling window's native title bar (square min/max/close buttons,
 * caption background, title text and border) to match the in-app appearance.
 * Also syncs the detached Win32 mpv player window. No-op outside Tauri / Windows.
 */
export async function setWindowChrome(chrome: WindowChrome): Promise<void> {
  if (!hasTauri) return
  try {
    await invoke('set_window_chrome', {
      dark: chrome.dark,
      caption: chrome.caption,
      text: chrome.text,
      border: chrome.border,
    })
  } catch {
    // Pre-Win11 (no caption-colour support) or non-Windows: ignore.
  }
}
