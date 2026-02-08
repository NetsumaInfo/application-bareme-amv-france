export type CriterionType = 'numeric' | 'slider' | 'boolean' | 'select' | 'text'

export interface ValidationRule {
  type: 'min' | 'max' | 'required' | 'step'
  value: number | boolean
  message: string
}

export interface Criterion {
  id: string
  name: string
  description?: string
  type: CriterionType
  weight: number
  min?: number
  max?: number
  step?: number
  options?: string[]
  required: boolean
  category?: string
  validationRules?: ValidationRule[]
}

export interface Bareme {
  id: string
  name: string
  description?: string
  isOfficial: boolean
  criteria: Criterion[]
  totalPoints: number
  createdAt: string
  updatedAt: string
}

export const OFFICIAL_BAREME: Bareme = {
  id: 'official-amv-2026',
  name: 'Barème Officiel AMV 2026',
  description: 'Barème standard pour les compétitions AMV',
  isOfficial: true,
  totalPoints: 50,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  criteria: [
    {
      id: 'sync',
      name: 'Synchronisation',
      description: 'Qualité de la synchronisation entre la musique et les images',
      type: 'numeric',
      weight: 1,
      min: 0,
      max: 10,
      step: 0.5,
      required: true,
      category: 'Technique',
    },
    {
      id: 'editing',
      name: 'Editing / Montage',
      description: 'Qualité technique du montage, transitions, rythme',
      type: 'numeric',
      weight: 1,
      min: 0,
      max: 10,
      step: 0.5,
      required: true,
      category: 'Technique',
    },
    {
      id: 'effects',
      name: 'Effets visuels',
      description: 'Utilisation et qualité des effets spéciaux',
      type: 'numeric',
      weight: 1,
      min: 0,
      max: 10,
      step: 0.5,
      required: true,
      category: 'Technique',
    },
    {
      id: 'storytelling',
      name: 'Narration / Storytelling',
      description: 'Cohérence narrative, progression, émotion transmise',
      type: 'numeric',
      weight: 1,
      min: 0,
      max: 10,
      step: 0.5,
      required: true,
      category: 'Artistique',
    },
    {
      id: 'overall',
      name: 'Impression générale',
      description: 'Impression globale, originalité, impact émotionnel',
      type: 'numeric',
      weight: 1,
      min: 0,
      max: 10,
      step: 0.5,
      required: true,
      category: 'Artistique',
    },
  ],
}
