import * as tauri from '@/services/tauri'

const RECENT_JUDGE_NAMES_KEY = 'recentJudgeNames'
const MAX_RECENT_JUDGE_NAMES = 30

type UserSettingsRecord = Record<string, unknown>

function sanitizeNames(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of value) {
    if (typeof raw !== 'string') continue
    const name = raw.trim()
    if (!name) continue
    const key = name.toLocaleLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(name)
    if (out.length >= MAX_RECENT_JUDGE_NAMES) break
  }
  return out
}

async function loadSettingsRecord(): Promise<UserSettingsRecord> {
  const existing = await tauri.loadUserSettings().catch(() => null)
  if (!existing || typeof existing !== 'object') return {}
  return existing as UserSettingsRecord
}

export async function listRecentJudgeNames(): Promise<string[]> {
  const settings = await loadSettingsRecord()
  return sanitizeNames(settings[RECENT_JUDGE_NAMES_KEY])
}

export async function rememberJudgeName(name: string): Promise<void> {
  const normalized = name.trim()
  if (normalized.length < 2) return

  const settings = await loadSettingsRecord()
  const current = sanitizeNames(settings[RECENT_JUDGE_NAMES_KEY])
  const next = sanitizeNames([normalized, ...current])

  await tauri.saveUserSettings({
    ...settings,
    [RECENT_JUDGE_NAMES_KEY]: next,
  })
}

export async function forgetJudgeName(name: string): Promise<void> {
  const normalized = name.trim().toLocaleLowerCase()
  if (!normalized) return

  const settings = await loadSettingsRecord()
  const current = sanitizeNames(settings[RECENT_JUDGE_NAMES_KEY])
  const next = current.filter((entry) => entry.toLocaleLowerCase() !== normalized)

  if (next.length === current.length) return

  await tauri.saveUserSettings({
    ...settings,
    [RECENT_JUDGE_NAMES_KEY]: next,
  })
}
