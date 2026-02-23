import type { Criterion } from '@/types/bareme'

export interface NotationCategory {
  category: string
  criteria: Criterion[]
  color: string
  totalMax: number
}
