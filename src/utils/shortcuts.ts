export type ShortcutAction =
  | 'togglePause'
  | 'seekBack'
  | 'seekForward'
  | 'seekBackLong'
  | 'seekForwardLong'
  | 'nextClip'
  | 'prevClip'
  | 'tabNotation'
  | 'tabResultats'
  | 'tabExport'
  | 'fullscreen'
  | 'exitFullscreen'
  | 'save'
  | 'saveAs'
  | 'newProject'
  | 'openProject'
  | 'zoomIn'
  | 'zoomOut'
  | 'resetZoom'
  | 'undo'
  | 'frameForward'
  | 'frameBack'
  | 'screenshot'
  | 'toggleMiniatures'
  | 'setMiniatureFrame'
  | 'insertTimecode'
  | 'notesPrevField'
  | 'notesNextField'
  | 'notesFieldUp'
  | 'notesFieldDown'

export interface ShortcutDefinition {
  action: ShortcutAction
  label: string
  defaultShortcut: string
}

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  { action: 'togglePause', label: 'Lecture / Pause', defaultShortcut: 'space' },
  { action: 'seekBack', label: 'Reculer 5s', defaultShortcut: 'arrowleft' },
  { action: 'seekForward', label: 'Avancer 5s', defaultShortcut: 'arrowright' },
  { action: 'seekBackLong', label: 'Reculer 30s', defaultShortcut: 'shift+arrowleft' },
  { action: 'seekForwardLong', label: 'Avancer 30s', defaultShortcut: 'shift+arrowright' },
  { action: 'nextClip', label: 'Clip suivant', defaultShortcut: 'n' },
  { action: 'prevClip', label: 'Clip précédent', defaultShortcut: 'p' },
  { action: 'tabNotation', label: 'Onglet Notation', defaultShortcut: 'ctrl+1' },
  { action: 'tabResultats', label: 'Onglet Résultat', defaultShortcut: 'ctrl+2' },
  { action: 'tabExport', label: 'Onglet Export', defaultShortcut: 'ctrl+3' },
  { action: 'fullscreen', label: 'Plein écran vidéo', defaultShortcut: 'f11' },
  { action: 'exitFullscreen', label: 'Quitter le plein écran', defaultShortcut: 'escape' },
  { action: 'save', label: 'Sauvegarder', defaultShortcut: 'ctrl+s' },
  { action: 'saveAs', label: 'Sauvegarder sous...', defaultShortcut: 'ctrl+alt+s' },
  { action: 'newProject', label: 'Nouveau projet', defaultShortcut: 'ctrl+n' },
  { action: 'openProject', label: 'Ouvrir un projet', defaultShortcut: 'ctrl+o' },
  { action: 'zoomIn', label: 'Zoom +', defaultShortcut: 'ctrl+=' },
  { action: 'zoomOut', label: 'Zoom -', defaultShortcut: 'ctrl+-' },
  { action: 'resetZoom', label: 'Réinitialiser le zoom', defaultShortcut: 'ctrl+0' },
  { action: 'undo', label: 'Annuler (Undo)', defaultShortcut: 'ctrl+z' },
  { action: 'frameForward', label: 'Image suivante', defaultShortcut: '.' },
  { action: 'frameBack', label: 'Image précédente', defaultShortcut: ',' },
  { action: 'screenshot', label: "Capture d'écran", defaultShortcut: 'ctrl+shift+s' },
  { action: 'toggleMiniatures', label: 'Activer / masquer miniatures', defaultShortcut: 'ctrl+m' },
  { action: 'setMiniatureFrame', label: 'Définir frame miniature', defaultShortcut: 'ctrl+shift+m' },
  { action: 'insertTimecode', label: 'Insérer timecode dans les notes', defaultShortcut: 'ctrl+t' },
  { action: 'notesPrevField', label: 'Champ précédent (notes)', defaultShortcut: 'ctrl+arrowleft' },
  { action: 'notesNextField', label: 'Champ suivant (notes)', defaultShortcut: 'ctrl+arrowright' },
  { action: 'notesFieldUp', label: 'Champ au-dessus (notes)', defaultShortcut: 'ctrl+arrowup' },
  { action: 'notesFieldDown', label: 'Champ en-dessous (notes)', defaultShortcut: 'ctrl+arrowdown' },
]

export const DEFAULT_SHORTCUT_BINDINGS = SHORTCUT_DEFINITIONS.reduce<Record<ShortcutAction, string>>(
  (acc, entry) => {
    acc[entry.action] = entry.defaultShortcut
    return acc
  },
  {} as Record<ShortcutAction, string>,
)

function normalizeKeyToken(rawKey: string): string | null {
  const key = rawKey.toLowerCase()
  if (key === 'control' || key === 'shift' || key === 'alt' || key === 'meta') return null
  if (key === ' ' || key === 'spacebar') return 'space'
  if (key === 'esc') return 'escape'
  if (key === 'add') return '='
  if (key === 'subtract') return '-'
  if (key === '+') return '='
  return key
}

function normalizeKeyTokenFromCode(rawCode: string): string | null {
  if (!rawCode) return null

  if (rawCode.startsWith('Key') && rawCode.length === 4) {
    return rawCode.slice(3).toLowerCase()
  }
  if (rawCode.startsWith('Digit') && rawCode.length === 6) {
    return rawCode.slice(5)
  }
  if (/^F\d{1,2}$/i.test(rawCode)) {
    return rawCode.toLowerCase()
  }

  switch (rawCode) {
    case 'Space':
      return 'space'
    case 'Escape':
      return 'escape'
    case 'ArrowLeft':
      return 'arrowleft'
    case 'ArrowRight':
      return 'arrowright'
    case 'ArrowUp':
      return 'arrowup'
    case 'ArrowDown':
      return 'arrowdown'
    case 'Minus':
    case 'NumpadSubtract':
      return '-'
    case 'Equal':
    case 'NumpadAdd':
      return '='
    case 'Comma':
      return ','
    case 'Period':
    case 'NumpadDecimal':
      return '.'
    default:
      return null
  }
}

export function normalizeShortcutFromEvent(event: KeyboardEvent): string | null {
  const key = normalizeKeyTokenFromCode(event.code) ?? normalizeKeyToken(event.key)
  if (!key) return null

  const isPlusKey = event.code === 'Equal' || event.code === 'NumpadAdd' || event.key === '+'
  let shortcut = ''
  if (event.ctrlKey) shortcut += 'ctrl+'
  if (event.shiftKey && !isPlusKey) shortcut += 'shift+'
  if (event.altKey) shortcut += 'alt+'
  if (event.metaKey) shortcut += 'meta+'
  shortcut += key
  return shortcut
}

const DISPLAY_TOKEN_MAP: Record<string, string> = {
  ctrl: 'Ctrl',
  shift: 'Shift',
  alt: 'Alt',
  meta: 'Meta',
  '=': '+',
  arrowleft: '←',
  arrowright: '→',
  arrowup: '↑',
  arrowdown: '↓',
  escape: 'Échap',
  space: 'Espace',
}

export function formatShortcutDisplay(shortcut: string): string {
  if (!shortcut) return '-'
  return shortcut
    .split('+')
    .map((token) => DISPLAY_TOKEN_MAP[token] ?? token.toUpperCase())
    .join(' + ')
}
