export interface SubtitleTrack {
  id: number
  lang?: string
  title?: string
  codec?: string
  external: boolean
}

export interface AudioTrack {
  id: number
  lang?: string
  title?: string
  codec?: string
  channels?: number
}

export interface PlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  playbackSpeed: number
  subtitleTracks: SubtitleTrack[]
  audioTracks: AudioTrack[]
  currentSubtitleId: number | null
  currentAudioId: number | null
}
