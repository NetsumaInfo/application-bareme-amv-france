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
  external?: boolean
}
