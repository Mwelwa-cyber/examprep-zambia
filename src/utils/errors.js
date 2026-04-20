// Error-to-message helper.
//
// History: `show(error.message, true)` showed `undefined` when a handler
// threw a non-Error value (string, number, or plain object). This helper
// guarantees a human-readable fallback.

/**
 * Return a user-facing message from a caught error.
 * - Real Error objects → the `.message` string.
 * - Strings → the string itself (trimmed).
 * - Plain objects with a `.message` → that message.
 * - Everything else → the fallback.
 */
export function getErrorMessage(error, fallback = 'Something went wrong.') {
  if (!error) return fallback
  if (typeof error === 'string') {
    const trimmed = error.trim()
    return trimmed.length ? trimmed : fallback
  }
  const msg = error?.message
  if (typeof msg === 'string' && msg.trim().length) return msg
  return fallback
}
