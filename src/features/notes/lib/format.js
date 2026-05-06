// src/features/notes/lib/format.js
//
// Tiny formatting helpers shared by note UI.

/** Turn a Firestore Timestamp (or anything timestamp-like) into "Apr 28, 2026". */
export function formatDate(value) {
  if (!value) return ''
  // Firestore Timestamp has a toDate(); plain Dates and ISO strings work too.
  const d = typeof value?.toDate === 'function'
    ? value.toDate()
    : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Build a short excerpt from a note's HTML content. Returns up to ~140 chars of plain text. */
export function buildExcerpt(html, maxLen = 140) {
  if (!html) return ''
  const text = html
    .replace(/<[^>]+>/g, ' ')   // strip tags
    .replace(/\s+/g, ' ')       // collapse whitespace
    .trim()
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen).trimEnd() + '…'
}
