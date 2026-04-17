import { useState, useEffect } from 'react'

/**
 * Renders rich text (plain string or Tiptap JSON) without eagerly loading Tiptap.
 * Falls back to plain text until Tiptap loads, then upgrades to rich HTML.
 * This keeps the student-facing bundle light.
 */
export default function RichContent({ value, className = '', fallback = null }) {
  const [html, setHtml] = useState(null)

  useEffect(() => {
    if (!value) return
    const json = parseTiptapValue(value)
    if (!json) return

    import('./RichEditor').then(({ tiptapToHTML }) => {
      const rendered = tiptapToHTML(json)
      if (rendered && rendered !== '<p></p>') setHtml(rendered)
    }).catch(() => {})
  }, [value])

  if (!value) return fallback

  // While Tiptap is loading (or for plain strings), render plain text
  if (html) {
    return (
      <div
        className={`rich-content ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  // Plain text fallback (immediate, no loading state)
  const plain = getRichPlainText(value)
  if (!plain) return fallback
  return <span className={className}>{plain}</span>
}

function parseTiptapValue(value) {
  if (typeof value === 'object' && value?.type === 'doc') return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (parsed?.type === 'doc') return parsed
    } catch {
      // plain string
    }
  }
  return null
}

/**
 * Extracts plain text from a plain string or Tiptap JSON.
 * Synchronous — safe to call anywhere without importing Tiptap.
 */
export function getRichPlainText(value) {
  if (!value) return ''
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (parsed?.type === 'doc') return extractText(parsed)
    } catch {
      // plain string
    }
    return value
  }
  if (typeof value === 'object' && value.type === 'doc') return extractText(value)
  return String(value)
}

function extractText(node) {
  if (!node) return ''
  if (node.type === 'text') return node.text || ''
  if (Array.isArray(node.content)) return node.content.map(extractText).join(' ')
  return ''
}
