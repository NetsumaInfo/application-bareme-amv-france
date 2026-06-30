/**
 * Format a numeric score/total for display.
 *
 * Scores are quantized to 0.25 steps, so a total can legitimately end in
 * .25/.5/.75. Rounding to a single decimal (toFixed(1)) misrepresents those
 * values (e.g. XX.75 -> XX.8). This keeps up to 2 decimals and trims trailing
 * zeros so integers stay clean while quarter values display exactly.
 */
export function formatScore(value: number): string {
  if (!Number.isFinite(value)) return '0'
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(2).replace(/\.?0+$/, '')
}
