export interface ClipInfo {
  name: string
  index: number
  total: number
  hasVideo?: boolean
  miniaturesEnabled?: boolean
}

export interface OverlayTimecodeMarker {
  key: string
  raw: string
  seconds: number
  color: string
  previewText?: string
  source?: string | null
  category?: string | null
  criterionId?: string | null
}

export interface MarkerTooltip {
  left: number
  text: string
}
