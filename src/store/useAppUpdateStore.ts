import { create } from 'zustand'
import { checkGithubReleaseUpdate } from '@/services/githubUpdate'

const UPDATE_CHECK_COOLDOWN_MS = 30 * 60 * 1000

type AppUpdateStatus = 'idle' | 'checking' | 'up_to_date' | 'update_available' | 'error'

interface AppUpdateStore {
  status: AppUpdateStatus
  currentVersion: string | null
  latestVersion: string | null
  releaseUrl: string | null
  releaseName: string | null
  publishedAt: string | null
  errorMessage: string | null
  lastCheckedAt: number | null
  checkForUpdates: (force?: boolean) => Promise<void>
}

export const useAppUpdateStore = create<AppUpdateStore>((set, get) => ({
  status: 'idle',
  currentVersion: null,
  latestVersion: null,
  releaseUrl: null,
  releaseName: null,
  publishedAt: null,
  errorMessage: null,
  lastCheckedAt: null,

  checkForUpdates: async (force = false) => {
    const state = get()
    if (state.status === 'checking') return
    if (
      !force
      && state.lastCheckedAt
      && Date.now() - state.lastCheckedAt < UPDATE_CHECK_COOLDOWN_MS
    ) {
      return
    }

    set((prev) => ({
      ...prev,
      status: 'checking',
      errorMessage: null,
    }))

    try {
      const result = await checkGithubReleaseUpdate()
      set({
        status: result.hasUpdate ? 'update_available' : 'up_to_date',
        currentVersion: result.currentVersion,
        latestVersion: result.latestVersion,
        releaseUrl: result.releaseUrl,
        releaseName: result.releaseName,
        publishedAt: result.publishedAt,
        errorMessage: null,
        lastCheckedAt: Date.now(),
      })
    } catch (error) {
      set((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : String(error),
        lastCheckedAt: Date.now(),
      }))
    }
  },
}))
