import { useState, useEffect } from 'react'

function parseTiptapValue(value) {
  if (!value) return null
  if (typeof value === 'object' && value.type === 'doc') return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (parsed && parsed.type === 'doc') return parsed
    } catch { /* not JSON */ }
    return value  // return raw string for legacy rendering
  }
  return null
}

function extractPlainText(value) {
  if (!value) return ''
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (parsed?.type === 'doc') return extractFromDoc(parsed)
    } catch { /* not JSON */ }
    return value
  }
  if (typeof value === 'object' && value.type === 'doc') return extractFromDoc(value)
  return ''
}

function extractFromDoc(doc) {
  if (!doc?.content) return ''
  return doc.content.map(extractFromNode).join(' ').trim()
}

function extractFromNode(node) {
  if (!node) return ''
  if (node.type === 'text') return node.text || ''
  if (node.type === 'mathInline') return node.attrs?.latex || ''
  if (node.content) return node.content.map(extractFromNode).join('')
  return ''
}

export function getRichPlainText(value) {
  return extractPlainText(value)
}

export default function RichContent({ value, className = '', fallback = null }) {
  const [html, setHtml] = useState(null)

  useEffect(() => {
    if (!value) return
    const parsed = parseTiptapValue(value)
    if (!parsed) return

    import('./utils/safeRender.js').then(({ toHTML, hydrateKatex }) => {
      const rendered = toHTML(parsed)
      if (rendered && rendered !== '<p></p>') {
        setHtml(rendered)
        // Hydrate after next paint so the DOM is ready
        setTimeout(() => {
          const container = document.querySelector('[data-rich-content-pending]')
          if (container) {
            container.removeAttribute('data-rich-content-pending')
            hydrateKatex(container)
          }
        }, 0)
      }
    }).catch(() => {})
  }, [value])

  if (!value) return fallback

  if (!html) {
    const plain = extractPlainText(value)
    if (!plain) return fallback
    return <span className={className}>{plain}</span>
  }

  return (
    <div
      className={className}
      data-rich-content-pending=""
      dangerouslySetInnerHTML={{ __html: html }}
      ref={(el) => {
        if (el) {
          import('./utils/safeRender.js').then(({ hydrateKatex }) => {
            hydrateKatex(el)
          }).catch(() => {})
        }
      }}
    />
  )
}
