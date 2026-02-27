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
  name: 'Japan Expo 2025',
  description: 'Barème officiel Japan Expo 2025',
  isOfficial: true,
  hideTotalsUntilAllScored: true,
  totalPoints: 60,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  categoryColors: {
    MONTAGE: '#fb923c',
    VFX: '#a78bfa',
    'CHOIX ARTISTIQUE': '#34d399',
    FINITION: '#f59e0b',
  },
  criteria: [
    // MONTAGE /24
    {
      id: 'rhythm-synchronization',
      name: 'Rythme / Synchronisation',
      type: 'numeric',
      min: 0,
      max: 12,
      step: 0.5,
      required: true,
      category: 'MONTAGE',
    },
    {
      id: 'scene-selection',
      name: 'Sélection de scènes',
      type: 'numeric',
      min: 0,
      max: 12,
      step: 0.5,
      required: true,
      category: 'MONTAGE',
    },
    // VFX /18
    {
      id: 'compositing-integration',
      name: 'Composition / Intégration',
      type: 'numeric',
      min: 0,
      max: 6,
      step: 0.5,
      required: true,
      category: 'VFX',
    },
    {
      id: 'consistency-logic',
      name: 'Cohérence / Logique',
      type: 'numeric',
      min: 0,
      max: 6,
      step: 0.5,
      required: true,
      category: 'VFX',
    },
    {
      id: 'technical-complexity',
      name: 'Complexité technique',
      type: 'numeric',
      min: 0,
      max: 6,
      step: 0.5,
      required: true,
      category: 'VFX',
    },
    // CHOIX ARTISTIQUE /12
    {
      id: 'cc-colorimetrie',
      name: 'CC / Colorimétrie',
      type: 'numeric',
      min: 0,
      max: 6,
      step: 0.5,
      required: true,
      category: 'CHOIX ARTISTIQUE',
    },
    {
      id: 'concept-narrative',
      name: 'Concept / Narratif',
      type: 'numeric',
      min: 0,
      max: 6,
      step: 0.5,
      required: true,
      category: 'CHOIX ARTISTIQUE',
    },
    // FINITION /6
    {
      id: 'encoding',
      name: 'Encodage',
      type: 'numeric',
      min: 0,
      max: 3,
      step: 0.5,
      required: true,
      category: 'FINITION',
    },
    {
      id: 'mixing',
      name: 'Mixage',
      type: 'numeric',
      min: 0,
      max: 3,
      step: 0.5,
      required: true,
      category: 'FINITION',
    },
  ],
}
