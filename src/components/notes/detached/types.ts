import type { Clip } from '@/types/project'
import type { Bareme } from '@/types/bareme'
import type { Note } from '@/types/notation'
import type { Criterion } from '@/types/bareme'

export interface ActiveNoteField {
  kind: 'category' | 'global'
  category?: string
}

export interface ClipPayload {
  clip: Clip | null
  bareme: Bareme | null
  note: Note | null
  clipIndex: number
  totalClips: number
  hideTotals?: boolean
}

export interface CategoryGroup {
  category: string
  criteria: Criterion[]
  color: string
  totalMax: number
}
