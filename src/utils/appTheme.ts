const APP_THEME_PRESETS = ['absolute', 'black', 'midnight', 'graphite', 'studio', 'abyss', 'porcelain', 'pearl', 'ivory', 'sand'] as const
export type AppThemePreset = typeof APP_THEME_PRESETS[number]

const PRIMARY_COLOR_PRESETS = ['ocean', 'sky', 'petrol', 'turquoise', 'indigo', 'lavender', 'plum', 'cranberry', 'sage', 'emerald', 'forest', 'honey', 'marigold', 'brown', 'slate'] as const
export type PrimaryColorPreset = typeof PRIMARY_COLOR_PRESETS[number]

export const APP_THEME_OPTIONS: Array<{
  value: AppThemePreset
  label: string
  description: string
  group: 'dark' | 'light'
  previewBackground: string
  previewSurfaces: [string, string, string]
}> = [
  {
    value: 'absolute',
    label: 'Noir absolu',
    description: 'Noir pur sans teinte',
    group: 'dark',
    previewBackground: 'linear-gradient(180deg, #000000 0%, #030507 100%)',
    previewSurfaces: ['#090c12', '#121720', '#1a2230'],
  },
  {
    value: 'black',
    label: 'Carbone',
    description: 'Noir dense légèrement bleuté',
    group: 'dark',
    previewBackground: 'linear-gradient(180deg, #05070c 0%, #0b0f17 100%)',
    previewSurfaces: ['#0f141d', '#171d28', '#202938'],
  },
  {
    value: 'midnight',
    label: 'Nuit bleue',
    description: 'Bleu nuit équilibré',
    group: 'dark',
    previewBackground: 'linear-gradient(180deg, #0f0f23 0%, #0a0b1a 100%)',
    previewSurfaces: ['#1a1a2e', '#1b2646', '#24345c'],
  },
  {
    value: 'graphite',
    label: 'Ardoise',
    description: 'Gris froid et propre',
    group: 'dark',
    previewBackground: 'linear-gradient(180deg, #11141c 0%, #0b0e14 100%)',
    previewSurfaces: ['#1d222d', '#273040', '#344055'],
  },
  {
    value: 'studio',
    label: 'Studio',
    description: 'Charbon avec reflets bleus',
    group: 'dark',
    previewBackground: 'linear-gradient(180deg, #10131b 0%, #131826 100%)',
    previewSurfaces: ['#161d2c', '#1f2940', '#293558'],
  },
  {
    value: 'abyss',
    label: 'Abysse',
    description: 'Bleu pétrole profond',
    group: 'dark',
    previewBackground: 'linear-gradient(180deg, #08131a 0%, #0a1720 100%)',
    previewSurfaces: ['#0d1d26', '#132935', '#1c3a47'],
  },
  {
    value: 'porcelain',
    label: 'Porcelaine',
    description: 'Clair doux et structuré',
    group: 'light',
    previewBackground: 'linear-gradient(180deg, #e7edf4 0%, #d9e1eb 100%)',
    previewSurfaces: ['#edf2f7', '#dde5ef', '#cbd5e1'],
  },
  {
    value: 'pearl',
    label: 'Perle',
    description: 'Gris clair satiné',
    group: 'light',
    previewBackground: 'linear-gradient(180deg, #e3e7eb 0%, #d7dce2 100%)',
    previewSurfaces: ['#eceff2', '#dde2e7', '#c8d0d9'],
  },
  {
    value: 'ivory',
    label: 'Ivoire',
    description: 'Clair chaud et mat',
    group: 'light',
    previewBackground: 'linear-gradient(180deg, #ece6d9 0%, #e1d9ca 100%)',
    previewSurfaces: ['#f1ecdf', '#e4dccd', '#d4c9b4'],
  },
  {
    value: 'sand',
    label: 'Sable',
    description: 'Beige pierre doux',
    group: 'light',
    previewBackground: 'linear-gradient(180deg, #e5ded2 0%, #d8cebf 100%)',
    previewSurfaces: ['#ece5d8', '#ddd4c6', '#cabdaa'],
  },
]

export const PRIMARY_COLOR_OPTIONS: Array<{
  value: PrimaryColorPreset
  label: string
  color: string
  group: 'cool' | 'natural' | 'warm'
}> = [
  { value: 'ocean', label: 'Océan', color: '#3b82f6', group: 'cool' },
  { value: 'sky', label: 'Azur', color: '#0ea5e9', group: 'cool' },
  { value: 'petrol', label: 'Encre', color: '#243f63', group: 'cool' },
  { value: 'turquoise', label: 'Turquoise', color: '#14b8a6', group: 'cool' },
  { value: 'indigo', label: 'Indigo', color: '#6366f1', group: 'cool' },
  { value: 'lavender', label: 'Lavande', color: '#8b5cf6', group: 'cool' },
  { value: 'plum', label: 'Prune', color: '#8b5fbf', group: 'cool' },
  { value: 'cranberry', label: 'Cranberry', color: '#be445f', group: 'cool' },
  { value: 'sage', label: 'Sauge', color: '#22c55e', group: 'natural' },
  { value: 'emerald', label: 'Émeraude', color: '#10b981', group: 'natural' },
  { value: 'forest', label: 'Forêt', color: '#3f6f52', group: 'natural' },
  { value: 'brown', label: 'Brun', color: '#8b5e3c', group: 'warm' },
  { value: 'honey', label: 'Miel', color: '#c8892d', group: 'warm' },
  { value: 'marigold', label: 'Bourgogne', color: '#6b3248', group: 'warm' },
  { value: 'slate', label: 'Acier', color: '#64748b', group: 'warm' },
]

const APP_THEME_BACKGROUND_COLORS: Record<AppThemePreset, string> = {
  absolute: '#000000',
  black: '#05070c',
  midnight: '#0f0f23',
  graphite: '#11141c',
  studio: '#10131b',
  abyss: '#08131a',
  porcelain: '#e7edf4',
  pearl: '#e3e7eb',
  ivory: '#ece6d9',
  sand: '#e5ded2',
}

function isAppThemePreset(value: unknown): value is AppThemePreset {
  return typeof value === 'string' && APP_THEME_PRESETS.includes(value as AppThemePreset)
}

export function normalizeAppThemePreset(value: unknown): AppThemePreset | null {
  if (isAppThemePreset(value)) return value
  if (value === 'light') return 'porcelain'
  if (value === 'mist') return 'pearl'
  if (value === 'linen') return 'sand'
  return null
}

function isPrimaryColorPreset(value: unknown): value is PrimaryColorPreset {
  return typeof value === 'string' && PRIMARY_COLOR_PRESETS.includes(value as PrimaryColorPreset)
}

export function normalizePrimaryColorPreset(value: unknown): PrimaryColorPreset | null {
  if (isPrimaryColorPreset(value)) return value
  if (value === 'blue') return 'ocean'
  if (value === 'teal') return 'turquoise'
  if (value === 'coral' || value === 'copper') return 'brown'
  if (value === 'raspberry') return 'emerald'
  if (value === 'indigo') return 'indigo'
  return null
}

export function applyAppearanceToDocument(theme: AppThemePreset, primaryColor: PrimaryColorPreset) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.appTheme = theme
  document.documentElement.dataset.primaryColor = primaryColor
}

export function getAppThemeBackgroundColor(theme: AppThemePreset): string {
  return APP_THEME_BACKGROUND_COLORS[theme]
}
