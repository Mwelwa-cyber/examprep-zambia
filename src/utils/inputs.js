// Input coercion helpers.
//
// History: across the app we had several `Number(event.target.value) || N`
// patterns that silently accepted negatives (because `Number(-5) || 30` is
// `-5`, not `30`). These helpers fix that by clamping explicitly.

/**
 * Coerce a value to an integer and clamp it to [min, max].
 * Returns `fallback` when the value is not a finite number.
 *
 * Useful for `onChange` handlers on bounded numeric inputs:
 *   onChange={e => setDuration(clampInt(e.target.value, 5, 180, 30))}
 */
export function clampInt(value, min, max, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, Math.trunc(n)))
}

/**
 * Coerce a value to a finite number and clamp it to [min, max].
 * Returns `fallback` when the value is not a finite number.
 *
 * Use when fractional values are allowed (e.g. scores as percentages).
 */
export function clampNumber(value, min, max, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, n))
}
