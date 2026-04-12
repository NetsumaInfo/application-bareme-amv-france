import { create } from 'zustand'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'

interface ClipDeletionStore {
  pendingClipId: string | null
  requestClipDeletion: (clipId: string) => void
  cancelClipDeletion: () => void
  confirmClipDeletion: (disableFutureWarnings: boolean) => void
}

export const useClipDeletionStore = create<ClipDeletionStore>((set, get) => ({
  pendingClipId: null,

  requestClipDeletion: (clipId) => {
    if (!useUIStore.getState().confirmClipDeletion) {
      useProjectStore.getState().removeClip(clipId)
      return
    }

    set({ pendingClipId: clipId })
  },

  cancelClipDeletion: () => set({ pendingClipId: null }),

  confirmClipDeletion: (disableFutureWarnings) => {
    const clipId = get().pendingClipId
    if (!clipId) return

    if (disableFutureWarnings) {
      useUIStore.getState().toggleConfirmClipDeletion()
    }

    useProjectStore.getState().removeClip(clipId)
    set({ pendingClipId: null })
  },
}))
