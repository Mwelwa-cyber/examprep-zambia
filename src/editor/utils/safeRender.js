/**
 * src/editor/utils/safeRender.js
 *
 * Safe HTML generation from Tiptap JSON for the learner view.
 *
 * NEVER use dangerouslySetInnerHTML with raw DB content.
 * ALWAYS go through this module.
 *
 * Pipeline:
 *   1. Accept Tiptap JSON (preferred) or legacy string (backward compat)
 *   2. generateHTML(json, extensions) → controlled HTML output
 *      (only tags allowed by the extension list can appear)
 *   3. DOMPurify.sanitize() → defence-in-depth XSS protection
 *   4. Return safe HTML string → pass to dangerouslySetInnerHTML
 *
 * Additionally, this module exports hydrateKatex() which must be called
 * after the HTML is mounted in the DOM to render math nodes visually.
 */

import { generateHTML } from '@tiptap/core'
import katex from 'katex'
import { renderExtensions } from '../extensions/buildExtensions.js'
import { sanitizeHTML } from './sanitize.js'
import { isTiptapJSON } from './migration.js'

/**
 * Convert Tiptap JSON (or legacy HTML/text string) to a safe HTML string.
 *
 * Use the return value in:
 *   <div dangerouslySetInnerHTML={{ __html: toHTML(json) }} />
 *
 * Then call hydrateKatex(containerRef.current) after the DOM mounts
 * to render the math visually.
 *
 * @param {object|string|null} content  Tiptap JSON object or legacy string
 * @returns {string}                    Safe HTML string, or '' if empty
 */
export function toHTML(content) {
  if (!content) return ''

  // Legacy string content (old records not yet migrated)
  if (typeof content === 'string') {
    return sanitizeHTML(content)
  }

  // Tiptap JSON
  if (isTiptapJSON(content)) {
    try {
      const raw = generateHTML(content, renderExtensions)
      return sanitizeHTML(raw)
    } catch (err) {
      console.error('[safeRender] generateHTML failed:', err)
      return ''
    }
  }

  // Unknown format — stringify and sanitize
  console.warn('[safeRender] Unknown content format:', typeof content)
  return sanitizeHTML(String(content))
}

/**
 * Hydrate all math nodes inside a mounted DOM container.
 *
 * After toHTML() produces HTML and you render it into the DOM, the
 * math nodes are plain <span data-math-latex="..."> elements with text
 * fallback. Call this to render them visually with KaTeX.
 *
 * Usage (React):
 *   const containerRef = useRef(null)
 *   useEffect(() => {
 *     if (containerRef.current) hydrateKatex(containerRef.current)
 *   }, [html])
 *
 *   <div ref={containerRef} dangerouslySetInnerHTML={{ __html: html }} />
 *
 * @param {HTMLElement} container  The DOM element containing the HTML
 */
export function hydrateKatex(container) {
  if (!container) return
  const nodes = container.querySelectorAll('span[data-math-latex]')
  nodes.forEach((span) => {
    // Skip if already hydrated (has a .katex child)
    if (span.querySelector('.katex')) return
    const latex = span.getAttribute('data-math-latex')
    if (!latex) return
    try {
      katex.render(latex, span, { throwOnError: false, displayMode: false })
    } catch {
      // Keep the text fallback
    }
  })
}
