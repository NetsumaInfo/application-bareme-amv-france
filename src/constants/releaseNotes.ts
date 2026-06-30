/**
 * Per-version "what's new" highlights shown once after an update.
 *
 * Highlight strings are French source text and are mirrored in
 * `src/i18n/seed.ts` so the sync script harvests them for translation.
 * Render them through `t(highlight)`.
 *
 * Keep the newest release first.
 */
export interface ReleaseNote {
  version: string
  highlights: string[]
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '1.0.5',
    highlights: [
      'Affichage des totaux au quart de point près (fini les 0,75 affichés en 0,8).',
      'Bouton de mise à jour stabilisé : le header ne se décale plus pendant le téléchargement.',
      'Panneau « Nouveautés » affiché une fois après chaque mise à jour.',
    ],
  },
  {
    version: '1.0.4',
    highlights: [
      'VU-mètre audio optionnel avec mémorisation des préférences.',
      'Mise à jour intégrée plus fiable (signature et déverrouillage de l’application).',
    ],
  },
]

export const LATEST_RELEASE: ReleaseNote | null = RELEASE_NOTES[0] ?? null

/**
 * Returns the release notes to show when moving from `previousVersion` to
 * `currentVersion`, or null when nothing newer should be surfaced.
 * Falls back to the latest entry when the exact version has no dedicated note.
 */
export function getReleaseNoteToShow(
  currentVersion: string,
  previousVersion: string | null,
): ReleaseNote | null {
  if (!previousVersion) return null
  if (compareVersions(currentVersion, previousVersion) <= 0) return null
  return RELEASE_NOTES.find((note) => note.version === currentVersion) ?? LATEST_RELEASE
}

/** Numeric semver-ish compare. Returns >0 if a is newer than b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0)
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i += 1) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}
