import DOMPurify from 'dompurify'

const ALLOWED_TAGS = [
  'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'strike',
  'ul', 'ol', 'li',
  'h1', 'h2', 'h3',
  'blockquote',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
  'span', 'sup', 'sub', 'code',
]

const ALLOWED_ATTR = [
  'colspan', 'rowspan',
  'data-math-latex',
  'class',
]

export function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    KEEP_CONTENT: true,
    FORCE_BODY: false,
  })
}

export function sanitizePastedHTML(html) {
  return sanitizeHTML(html)
}
