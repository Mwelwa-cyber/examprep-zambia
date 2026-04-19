/**
 * src/editor/utils/migration.js
 *
 * SAFE MIGRATION — converts any old quiz content to Tiptap JSON.
 *
 * Handles every possible legacy format:
 *   1. null / undefined        → null  (field was empty)
 *   2. Already Tiptap JSON     → pass through unchanged
 *   3. HTML string             → sanitize → generateJSON
 *   4. Plain text string       → wrap in <p> tags → generateJSON
 *   5. Unknown object          → JSON.stringify → treat as plain text
 *
 * NEVER throws. NEVER loses data.
 *
 * ── How old quizzes continue working ──────────────────────────────
 *
 * Your old quizzes stored in the database have content as plain strings
 * or raw HTML. They will continue to render correctly because:
 *
 *   1. On LOAD: migrateContent() converts them to Tiptap JSON on the fly.
 *      The editor initialises with the migrated JSON. No database write
 *      happens until the teacher clicks Save.
 *
 *   2. On SAVE: the teacher saves the question → Tiptap JSON is written
 *      to the database. The question is now in the new format.
 *
 *   3. On RENDER (learner): safeRender.js checks whether the field is
 *      a Tiptap JSON object or a legacy string and handles both.
 *      The learner sees correctly rendered content in either case.
 *
 *   4. Database migration (optional): run migrateQuestion() on every
 *      record in a one-time script to pre-convert your entire database.
 *      See the example at the bottom of this file.
 *
 * ── Compatibility with your content_version column ────────────────
 *
 *   Set content_version = 1 for old records, content_version = 2 for
 *   records already in Tiptap JSON format.
 *   Your API can pass content_version along with the question data and
 *   conditionally skip migration for already-migrated records.
 */

import { generateJSON } from '@tiptap/core'
import { renderExtensions } from '../extensions/buildExtensions.js'
import { sanitizeHTML } from './sanitize.js'

/**
 * Detect whether a value is already valid Tiptap JSON.
 * @param {*} value
 * @returns {boolean}
 */
export function isTiptapJSON(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    value.type === 'doc' &&
    Array.isArray(value.content)
  )
}

/**
 * Convert HTML → Tiptap JSON using the same extension set as the editor.
 * Sanitizes first to prevent XSS.
 *
 * @param {string} html
 * @returns {object} Tiptap JSON doc node
 */
function htmlToJSON(html) {
  const clean = sanitizeHTML(html)
  return generateJSON(clean || '<p></p>', renderExtensions)
}

/**
 * Convert plain text → Tiptap JSON.
 * Preserves paragraph breaks (double newlines) and line breaks (single newlines).
 *
 * @param {string} text
 * @returns {object} Tiptap JSON doc node
 */
function plainTextToJSON(text) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const html = escaped
    .split(/\n\n+/)
    .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('')

  return generateJSON(html || '<p></p>', renderExtensions)
}

/**
 * Absolute fallback: wrap any string as a plain text paragraph.
 * Used when generateJSON fails (malformed HTML, unsupported nodes, etc.)
 *
 * @param {string} text
 * @returns {object}
 */
function fallbackJSON(text) {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: text ? [{ type: 'text', text: String(text) }] : [],
      },
    ],
  }
}

/**
 * Migrate a single content field to Tiptap JSON.
 *
 * @param {string|object|null|undefined} content
 * @returns {object|null} Tiptap JSON doc, or null if content is empty
 */
export function migrateContent(content) {
  // Empty / null
  if (content === null || content === undefined) return null
  if (typeof content === 'string' && !content.trim()) return null

  // Already Tiptap JSON — pass through
  if (isTiptapJSON(content)) return content

  // String content
  if (typeof content === 'string') {
    // Looks like HTML?
    if (/<[a-z][\s\S]*>/i.test(content)) {
      try { return htmlToJSON(content) } catch { /* fall through */ }
    }
    // Plain text
    try { return plainTextToJSON(content) } catch { /* fall through */ }
    // Absolute fallback
    return fallbackJSON(content)
  }

  // Unknown object (shouldn't happen, but protect anyway)
  if (typeof content === 'object') {
    try { return plainTextToJSON(JSON.stringify(content)) } catch { /* fall through */ }
  }

  return fallbackJSON(String(content))
}

/**
 * Migrate a complete quiz question object.
 *
 * Converts all rich-content fields (instructions, passage, questionText,
 * explanation) from any legacy format to Tiptap JSON.
 *
 * Plain answer fields (options, correct, marks, topic, type, id) are
 * passed through unchanged.
 *
 * @param {object} oldQuestion   Legacy question from your database
 * @returns {object}             Question with Tiptap JSON content fields
 */
export function migrateQuestion(oldQuestion) {
  if (!oldQuestion) return null

  const {
    // Content fields — multiple legacy naming conventions supported
    question,       questionText,
    instructions,   instruction,
    passage,        story,
    explanation,    answer,        modelAnswer,
    // Meta fields — plain values, passed through
    id,             _id,
    type,           question_type, questionType,
    topic,          subject,       strand,
    marks,          score,         points,
    difficulty,
    options,        choices,
    correct,        correct_answer,correctAnswer, correctIndex,
    // content_version helps your API skip already-migrated records
    content_version, contentVersion,
    // anything else
    ...rest
  } = oldQuestion

  return {
    id:    id ?? _id ?? `q_${Date.now()}`,
    type:  type ?? question_type ?? questionType ?? 'mcq',
    topic: topic ?? subject ?? strand ?? '',
    marks: marks ?? score ?? points ?? 2,
    difficulty: difficulty ?? 'medium',

    // Content → migrate each field
    instructions: migrateContent(instructions ?? instruction ?? null),
    passage:      migrateContent(passage ?? story ?? null),
    questionText: migrateContent(questionText ?? question ?? null),
    explanation:  migrateContent(explanation ?? answer ?? modelAnswer ?? null),

    // Answer fields — plain strings/numbers, not rich-edited
    options:  Array.isArray(options)  ? options
            : Array.isArray(choices)  ? choices
            : [],
    correct:  correct ?? correct_answer ?? correctAnswer ?? correctIndex ?? 0,

    contentVersion: 2,

    // Preserve any extra fields your schema has
    ...rest,
  }
}

/**
 * Batch-migrate an array of questions.
 * Individual failures are caught and logged — never abort the batch.
 *
 * @param {object[]} questions
 * @returns {object[]}
 */
export function migrateQuestions(questions) {
  return questions.map((q, index) => {
    try {
      return migrateQuestion(q)
    } catch (err) {
      console.error(`[migration] Failed on question index ${index} (id: ${q?.id}):`, err)
      return q  // return original — never lose data
    }
  })
}

/*
 * ── One-time database migration script (Node.js / server-side) ──
 *
 * import { migrateQuestions } from './migration.js'
 * import db from './db.js'
 *
 * async function runMigration() {
 *   const { rows } = await db.query(
 *     `SELECT * FROM questions WHERE content_version < 2 OR content_version IS NULL`
 *   )
 *   console.log(`Migrating ${rows.length} questions…`)
 *
 *   for (const q of migrateQuestions(rows)) {
 *     await db.query(
 *       `UPDATE questions SET
 *          question_text = $1,
 *          instructions  = $2,
 *          passage       = $3,
 *          explanation   = $4,
 *          content_version = 2
 *        WHERE id = $5`,
 *       [
 *         JSON.stringify(q.questionText),
 *         JSON.stringify(q.instructions),
 *         JSON.stringify(q.passage),
 *         JSON.stringify(q.explanation),
 *         q.id,
 *       ]
 *     )
 *   }
 *   console.log('Migration complete.')
 * }
 */
