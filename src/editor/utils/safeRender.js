import { generateHTML } from '@tiptap/core'
import katex from 'katex'
import { renderExtensions } from '../extensions/buildExtensions.js'
import { sanitizeHTML } from './sanitize.js'
import { isTiptapJSON } from './migration.js'

export function toHTML(content) {
  if (!content) return ''

  if (typeof content === 'string') {
    return sanitizeHTML(content)
  }

  if (isTiptapJSON(content)) {
    try {
      const raw = generateHTML(content, renderExtensions)
      return sanitizeHTML(raw)
    } catch (err) {
      console.error('[safeRender] generateHTML failed:', err)
      return ''
    }
  }

  console.warn('[safeRender] Unknown content format:', typeof content)
  return sanitizeHTML(String(content))
}

export function hydrateKatex(container) {
  if (!container) return
  const nodes = container.querySelectorAll('span[data-math-latex]')
  nodes.forEach((span) => {
    if (span.querySelector('.katex')) return
    const latex = span.getAttribute('data-math-latex')
    if (!latex) return
    try {
      katex.render(latex, span, { throwOnError: false, displayMode: false })
    } catch {
      // keep text fallback
    }
  })
}
