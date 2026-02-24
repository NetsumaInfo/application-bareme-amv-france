import { create } from 'zustand'
import type { SubtitleTrack, AudioTrack } from '@/types/player'

interface PlayerStore {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  playbackSpeed: number
  isLoaded: boolean
  currentFilePath: string | null
  subtitleTracks: SubtitleTrack[]
  audioTracks: AudioTrack[]
  currentSubtitleId: number | null
  currentAudioId: number | null
  isFullscreen: boolean
  isDetached: boolean

  setPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  setMuted: (muted: boolean) => void
  setPlaybackSpeed: (speed: number) => void
  setLoaded: (loaded: boolean, filePath?: string) => void
  setSubtitleTracks: (tracks: SubtitleTrack[]) => void
  setAudioTracks: (tracks: AudioTrack[]) => void
  setCurrentSubtitleId: (id: number | null) => void
  setCurrentAudioId: (id: number | null) => void
  setFullscreen: (fs: boolean) => void
  setDetached: (detached: boolean) => void
  syncStatus: (status: {
    isPlaying: boolean
    currentTime: number
    duration: number
    volume: number
    isFullscreen: boolean
  }) => void
  reset: () => void
}

const initialState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 80,
  muted: true,
  playbackSpeed: 1,
  isLoaded: false,
  currentFilePath: null as string | null,
  subtitleTracks: [] as SubtitleTrack[],
  audioTracks: [] as AudioTrack[],
  currentSubtitleId: null as number | null,
  currentAudioId: null as number | null,
  isFullscreen: false,
  isDetached: true,
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  ...initialState,

  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(100, volume)) }),
  setMuted: (muted) => set({ muted }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setLoaded: (loaded, filePath) =>
    set({
      isLoaded: loaded,
      currentFilePath: filePath ?? null,
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      subtitleTracks: [],
      audioTracks: [],
      currentSubtitleId: null,
      currentAudioId: null,
    }),
  setSubtitleTracks: (tracks) => set({ subtitleTracks: tracks }),
  setAudioTracks: (tracks) => set({ audioTracks: tracks }),
  setCurrentSubtitleId: (id) => set({ currentSubtitleId: id }),
  setCurrentAudioId: (id) => set({ currentAudioId: id }),
  setFullscreen: (fs) => set({ isFullscreen: fs }),
  setDetached: (detached) => set({ isDetached: detached }),
  syncStatus: ({ isPlaying, currentTime, duration, volume, isFullscreen }) =>
    set((state) => {
      const nextTime = Number.isFinite(currentTime) ? currentTime : 0
      const nextDuration = Number.isFinite(duration) ? duration : 0
      const nextVolume = Number.isFinite(volume) ? Math.max(0, Math.min(100, volume)) : state.volume
      const nextMuted = nextVolume <= 0.001

      const hasPlayingChanged = state.isPlaying !== isPlaying
      const hasTimeChanged = Math.abs(state.currentTime - nextTime) >= 0.05
      const hasDurationChanged = Math.abs(state.duration - nextDuration) >= 0.1
      const hasVolumeChanged = Math.abs(state.volume - nextVolume) >= 0.1
      const hasMutedChanged = state.muted !== nextMuted
      const hasFullscreenChanged = state.isFullscreen !== isFullscreen

      if (
        !hasPlayingChanged
        && !hasTimeChanged
        && !hasDurationChanged
        && !hasVolumeChanged
        && !hasMutedChanged
        && !hasFullscreenChanged
      ) {
        return state
      }

      return {
        isPlaying,
        currentTime: nextTime,
        duration: nextDuration,
        volume: nextVolume,
        muted: nextMuted,
        isFullscreen,
      }
    }),
  reset: () => set({ ...initialState }),
}))
