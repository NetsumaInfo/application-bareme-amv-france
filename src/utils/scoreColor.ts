// Subtle per-column score highlighting.
// Highlights only the highest and lowest score of a comparable column
// (criterion column / category column), leaving everything else untouched.
// Kept minimal on purpose: callers tint the number's text color only.

export interface ScoreExtreme {
  min: number
  max: number
}

export const DEFAULT_SCORE_COLOR_HIGH = '#34d399'
export const DEFAULT_SCORE_COLOR_LOW = '#fb923c'

/**
 * Builds the {min,max} extreme of a pool of scored values.
 * Returns null when fewer than two scored entries exist or when every value is
 * identical (no meaningful highest/lowest to distinguish).
 */
export function buildScoreExtreme(values: number[]): ScoreExtreme | null {
  let min = Infinity
  let max = -Infinity
  let count = 0
  for (const value of values) {
    if (!Number.isFinite(value)) continue
    count += 1
    if (value < min) min = value
    if (value > max) max = value
  }
  if (count < 2 || max <= min) return null
  return { min, max }
}

/**
 * Returns the highlight color for a value against a precomputed extreme.
 * High color for the column maximum, low color for the column minimum,
 * undefined for everything in between (and when coloring does not apply).
 */
export function colorForExtreme(
  value: number,
  extreme: ScoreExtreme | null | undefined,
  highHex: string,
  lowHex: string,
): string | undefined {
  if (!extreme || !Number.isFinite(value)) return undefined
  if (value >= extreme.max) return highHex
  if (value <= extreme.min) return lowHex
  return undefined
}
