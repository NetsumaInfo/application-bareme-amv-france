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
    }),
  setSubtitleTracks: (tracks) => set({ subtitleTracks: tracks }),
  setAudioTracks: (tracks) => set({ audioTracks: tracks }),
  setCurrentSubtitleId: (id) => set({ currentSubtitleId: id }),
  setCurrentAudioId: (id) => set({ currentAudioId: id }),
  setFullscreen: (fs) => set({ isFullscreen: fs }),
  reset: () => set({ ...initialState }),
}))
