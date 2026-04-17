import { generateJSON } from '@tiptap/core'
import { renderExtensions } from '../extensions/buildExtensions.js'
import { sanitizeHTML } from './sanitize.js'

export function isTiptapJSON(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    value.type === 'doc' &&
    Array.isArray(value.content)
  )
}

function htmlToJSON(html) {
  const clean = sanitizeHTML(html)
  return generateJSON(clean || '<p></p>', renderExtensions)
}

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

export function migrateContent(content) {
  if (content === null || content === undefined) return null
  if (typeof content === 'string' && !content.trim()) return null
  if (isTiptapJSON(content)) return content
  if (typeof content === 'string') {
    if (/<[a-z][\s\S]*>/i.test(content)) {
      try { return htmlToJSON(content) } catch { /* fall through */ }
    }
    try { return plainTextToJSON(content) } catch { /* fall through */ }
    return fallbackJSON(content)
  }
  if (typeof content === 'object') {
    try { return plainTextToJSON(JSON.stringify(content)) } catch { /* fall through */ }
  }
  return fallbackJSON(String(content))
}

export function migrateQuestion(oldQuestion) {
  if (!oldQuestion) return null

  const {
    question, questionText,
    instructions, instruction,
    passage, story,
    explanation, answer, modelAnswer,
    id, _id,
    type, question_type, questionType,
    topic, subject, strand,
    marks, score, points,
    difficulty,
    options, choices,
    correct, correct_answer, correctAnswer, correctIndex,
    content_version, contentVersion,
    ...rest
  } = oldQuestion

  return {
    id:    id ?? _id ?? `q_${Date.now()}`,
    type:  type ?? question_type ?? questionType ?? 'mcq',
    topic: topic ?? subject ?? strand ?? '',
    marks: marks ?? score ?? points ?? 2,
    difficulty: difficulty ?? 'medium',
    instructions: migrateContent(instructions ?? instruction ?? null),
    passage:      migrateContent(passage ?? story ?? null),
    questionText: migrateContent(questionText ?? question ?? null),
    explanation:  migrateContent(explanation ?? answer ?? modelAnswer ?? null),
    options:  Array.isArray(options) ? options : Array.isArray(choices) ? choices : [],
    correct:  correct ?? correct_answer ?? correctAnswer ?? correctIndex ?? 0,
    contentVersion: 2,
    ...rest,
  }
}

export function migrateQuestions(questions) {
  return questions.map((q, index) => {
    try {
      return migrateQuestion(q)
    } catch (err) {
      console.error(`[migration] Failed on question index ${index} (id: ${q?.id}):`, err)
      return q
    }
  })
}
