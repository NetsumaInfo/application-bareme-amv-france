import * as tauri from '@/services/tauri'

const RECENT_PROJECT_PATHS_KEY = 'recentProjectPaths'
const HIDDEN_PROJECT_PATHS_KEY = 'hiddenProjectPaths'
const MAX_RECENT_PROJECTS = 30
const MAX_HIDDEN_PROJECTS = 200

type UserSettingsRecord = Record<string, unknown>

function sanitizePaths(value: unknown, max: number = MAX_RECENT_PROJECTS): string[] {
  if (!Array.isArray(value)) return []
  const unique = new Set<string>()
  for (const rawPath of value) {
    if (typeof rawPath !== 'string') continue
    const path = rawPath.trim()
    if (!path) continue
    unique.add(path)
    if (unique.size >= max) break
  }
  return Array.from(unique)
}

async function loadSettingsRecord(): Promise<UserSettingsRecord> {
  const existing = await tauri.loadUserSettings().catch(() => null)
  if (!existing || typeof existing !== 'object') return {}
  return existing as UserSettingsRecord
}

export async function listRecentProjectPaths(): Promise<string[]> {
  const settings = await loadSettingsRecord()
  return sanitizePaths(settings[RECENT_PROJECT_PATHS_KEY])
}

export async function setRecentProjectPaths(paths: string[]): Promise<void> {
  const settings = await loadSettingsRecord()
  const next = sanitizePaths(paths)
  await tauri.saveUserSettings({
    ...settings,
    [RECENT_PROJECT_PATHS_KEY]: next,
  })
}

export async function rememberRecentProjectPath(filePath: string): Promise<void> {
  const normalized = filePath.trim()
  if (!normalized) return

  const settings = await loadSettingsRecord()
  const current = sanitizePaths(settings[RECENT_PROJECT_PATHS_KEY])
  const next = [normalized, ...current.filter((entry) => entry !== normalized)].slice(0, MAX_RECENT_PROJECTS)

  // Opening/saving a project always brings it back into the welcome list, so
  // clear any previous "hide from list" exclusion for this path.
  const hidden = sanitizePaths(settings[HIDDEN_PROJECT_PATHS_KEY], MAX_HIDDEN_PROJECTS)
  const nextHidden = hidden.filter((entry) => entry !== normalized)

  await tauri.saveUserSettings({
    ...settings,
    [RECENT_PROJECT_PATHS_KEY]: next,
    [HIDDEN_PROJECT_PATHS_KEY]: nextHidden,
  })
}

export async function listHiddenProjectPaths(): Promise<string[]> {
  const settings = await loadSettingsRecord()
  return sanitizePaths(settings[HIDDEN_PROJECT_PATHS_KEY], MAX_HIDDEN_PROJECTS)
}

export async function hideProjectPath(filePath: string): Promise<void> {
  const normalized = filePath.trim()
  if (!normalized) return

  const settings = await loadSettingsRecord()
  const hidden = sanitizePaths(settings[HIDDEN_PROJECT_PATHS_KEY], MAX_HIDDEN_PROJECTS)
  if (hidden.includes(normalized)) return
  const nextHidden = [normalized, ...hidden].slice(0, MAX_HIDDEN_PROJECTS)

  // Hiding also drops it from recents so it does not get re-merged into the list.
  const recents = sanitizePaths(settings[RECENT_PROJECT_PATHS_KEY])
  const nextRecents = recents.filter((entry) => entry !== normalized)

  await tauri.saveUserSettings({
    ...settings,
    [HIDDEN_PROJECT_PATHS_KEY]: nextHidden,
    [RECENT_PROJECT_PATHS_KEY]: nextRecents,
  })
}

export async function forgetRecentProjectPath(filePath: string): Promise<void> {
  const normalized = filePath.trim()
  if (!normalized) return

  const settings = await loadSettingsRecord()
  const current = sanitizePaths(settings[RECENT_PROJECT_PATHS_KEY])
  const next = current.filter((entry) => entry !== normalized)

  if (next.length === current.length) {
    return
  }

  await tauri.saveUserSettings({
    ...settings,
    [RECENT_PROJECT_PATHS_KEY]: next,
  })
}
