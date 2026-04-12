/**
 * aiChecker.js  (OpenAI ChatGPT)
 *
 * Uses OpenAI GPT-4o Mini to evaluate a student's short-answer response
 * against the expected correct answer.
 *
 * Requires:  VITE_OPENAI_API_KEY in your .env file
 * Get a key at: https://platform.openai.com/api-keys
 */

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

/**
 * Ask ChatGPT whether a student's answer is correct.
 *
 * @param {object} opts
 * @param {string} opts.question       - The question text
 * @param {string} opts.correctAnswer  - The expected correct answer (set by teacher)
 * @param {string} opts.studentAnswer  - What the student typed
 * @param {string} [opts.subject]      - Subject (for context)
 * @param {string} [opts.grade]        - Grade level (for context)
 *
 * @returns {Promise<{correct: boolean, feedback: string}>}
 */
export async function checkAnswerWithAI({ question, correctAnswer, studentAnswer, subject = '', grade = '' }) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('VITE_OPENAI_API_KEY is not set. Add it to your .env file.')
  }

  if (!studentAnswer?.trim()) {
    return { correct: false, feedback: 'You did not enter an answer.' }
  }

  const systemPrompt = `You are a helpful exam marker for Zambian primary school students${grade ? ` (Grade ${grade}` : ''}${subject ? `, ${subject})` : ')'}.
Mark answers as correct if they match the expected answer — including minor spelling mistakes, synonyms, equivalent terms, different but correct phrasing, or valid abbreviations.
Always respond with ONLY valid JSON. No extra text.`

  const userPrompt = `Question: "${question}"
Expected answer: "${correctAnswer}"
Student's answer: "${studentAnswer.trim()}"

Respond in this exact JSON format:
{"correct": true, "feedback": "Short encouraging message (max 15 words)"}
or
{"correct": false, "feedback": "Short explanation of correct answer (max 15 words)"}`

  const res = await fetch(OPENAI_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:       'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      temperature:      0.1,
      max_tokens:       120,
      response_format:  { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `OpenAI API error ${res.status}`)
  }

  const data = await res.json()
  const raw  = data?.choices?.[0]?.message?.content || ''

  try {
    const result = JSON.parse(raw)
    return {
      correct:  Boolean(result.correct),
      feedback: String(result.feedback || ''),
    }
  } catch {
    throw new Error('Could not parse ChatGPT response')
  }
}
