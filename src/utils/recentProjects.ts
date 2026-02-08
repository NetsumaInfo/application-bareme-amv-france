const STORAGE_KEY = 'amv-notation-recent-projects'

export interface RecentProject {
  name: string
  judgeName: string
  path: string
  lastOpened: string
}

export function getRecentProjects(): RecentProject[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function addRecentProject(name: string, judgeName: string, path: string) {
  const recent = getRecentProjects().filter((p) => p.path !== path)
  recent.unshift({ name, judgeName, path, lastOpened: new Date().toISOString() })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, 10)))
}

export function removeRecentProject(path: string) {
  const recent = getRecentProjects().filter((p) => p.path !== path)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recent))
}
