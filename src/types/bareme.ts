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
  hideTotalsUntilAllScored?: boolean
  criteria: Criterion[]
  categoryColors?: Record<string, string>
  totalPoints: number
  createdAt: string
  updatedAt: string
}

export const OFFICIAL_BAREME: Bareme = {
  id: 'official-amv-2026',
  name: 'Barème Officiel AMV',
  description: 'Barème standard pour les compétitions AMV (Level Up 2025)',
  isOfficial: true,
  hideTotalsUntilAllScored: true,
  totalPoints: 50,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  categoryColors: {
    MONTAGE: '#fb923c',
    VFX: '#a78bfa',
    'CHOIX ARTISTIQUE': '#34d399',
    ENCODAGE: '#f59e0b',
    'MIX AUDIO': '#38bdf8',
  },
  criteria: [
    // MONTAGE /20
    {
      id: 'rythme-synchro',
      name: 'Rythme / Synchro',
      type: 'numeric',
      min: 0,
      max: 10,
      step: 0.5,
      required: true,
      category: 'MONTAGE',
    },
    {
      id: 'selection-scene',
      name: 'Sélection de scène',
      type: 'numeric',
      min: 0,
      max: 10,
      step: 0.5,
      required: true,
      category: 'MONTAGE',
    },
    // VFX /15
    {
      id: 'incrustation',
      name: 'Incrust / Intégration',
      type: 'numeric',
      min: 0,
      max: 5,
      step: 0.5,
      required: true,
      category: 'VFX',
    },
    {
      id: 'coherence',
      name: 'Cohérence / Logique',
      type: 'numeric',
      min: 0,
      max: 5,
      step: 0.5,
      required: true,
      category: 'VFX',
    },
    {
      id: 'complexite',
      name: 'Complexité technique',
      type: 'numeric',
      min: 0,
      max: 5,
      step: 0.5,
      required: true,
      category: 'VFX',
    },
    // CHOIX ARTISTIQUE /11
    {
      id: 'cc-colorimetrie',
      name: 'CC / Colorimétrie',
      type: 'numeric',
      min: 0,
      max: 4,
      step: 0.5,
      required: true,
      category: 'CHOIX ARTISTIQUE',
    },
    {
      id: 'concept-story',
      name: 'Concept / Story',
      type: 'numeric',
      min: 0,
      max: 4,
      step: 0.5,
      required: true,
      category: 'CHOIX ARTISTIQUE',
    },
    {
      id: 'choix-jury',
      name: 'Choix du jury',
      type: 'numeric',
      min: 0,
      max: 3,
      step: 0.5,
      required: true,
      category: 'CHOIX ARTISTIQUE',
    },
    // ENCODAGE /2
    {
      id: 'encodage',
      name: 'Encodage',
      type: 'numeric',
      min: 0,
      max: 2,
      step: 0.5,
      required: true,
      category: 'ENCODAGE',
    },
    // MIX AUDIO /2
    {
      id: 'mix-audio',
      name: 'Mix Audio',
      type: 'numeric',
      min: 0,
      max: 2,
      step: 0.5,
      required: true,
      category: 'MIX AUDIO',
    },
  ],
}
