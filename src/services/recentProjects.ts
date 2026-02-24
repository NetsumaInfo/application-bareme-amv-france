import * as tauri from '@/services/tauri'

const RECENT_PROJECT_PATHS_KEY = 'recentProjectPaths'
const MAX_RECENT_PROJECTS = 30

type UserSettingsRecord = Record<string, unknown>

function sanitizePaths(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const unique = new Set<string>()
  for (const rawPath of value) {
    if (typeof rawPath !== 'string') continue
    const path = rawPath.trim()
    if (!path) continue
    unique.add(path)
    if (unique.size >= MAX_RECENT_PROJECTS) break
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

  await tauri.saveUserSettings({
    ...settings,
    [RECENT_PROJECT_PATHS_KEY]: next,
  })
}
