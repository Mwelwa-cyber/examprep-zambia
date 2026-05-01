/**
 * Teacher AI Co-Pilot 2.0 — conversational client service.
 *
 * Thin wrapper around the `chatWithTeacherAssistant` callable Cloud
 * Function. The chat experience built on top of this service is a true
 * ChatGPT-style assistant — the teacher types in plain English and the
 * server classifies intent, so the client never sends a `contentType`.
 *
 * History reads (chat list, chat messages) reuse the same Firestore
 * helpers as the legacy generator-style co-pilot, so existing chats
 * still appear in the sidebar.
 */

import { getFunctions, httpsCallable } from 'firebase/functions'
import app from '../firebase/config'
import {
  GRADES,
  SUBJECTS,
  LEARNER_LEVELS,
  listMyAiChats,
  listAiChatMessages,
  getAiChat,
} from './teacherAICopilotService'

const functions = getFunctions(app, 'us-central1')
const callable = httpsCallable(functions, 'chatWithTeacherAssistant')

/**
 * Static fallback chips. Used only when nothing about the teacher's
 * class is known yet — once we have grade/subject/recent topics, the
 * UI swaps these out for context-aware variants from
 * `buildContextChips()` below.
 */
export const SUGGESTION_CHIPS = [
  { id: 'prepare_tomorrow',  label: "Prepare tomorrow's lesson",  prompt: "Prepare tomorrow's lesson. Give me everything I need to teach it well." },
  { id: 'continue_last',     label: 'Continue from last lesson',  prompt: "Continue from where we left off in the last lesson. Recap briefly, then take the class to the next step." },
  { id: 'create_revision',   label: 'Create revision work',       prompt: "Create a revision session for what we've been learning recently — quick recap, mixed practice, and a short exit ticket." },
  { id: 'help_weak_learners',label: 'Help weak learners',         prompt: "My learners are struggling. Give me a remedial plan with re-teaching, simple practice, and a confidence check." },
  { id: 'quick_test',        label: 'Make a quick test',          prompt: "Make a short classroom test (8-10 questions, mixed types) with a marking key." },
]

/**
 * Universal smart follow-up set. Matches the four buttons the UI
 * shows under every AI reply: Create test · Simplify · Expand · Save.
 * The server tailors this list per-intent (see followUpsForIntent in
 * the Cloud Function); this is only a fallback for older messages
 * that were saved before the server returned a list.
 */
export const DEFAULT_FOLLOW_UPS = [
  { label: 'Create test', actionId: 'create_test' },
  { label: 'Simplify',    actionId: 'simplify' },
  { label: 'Expand',      actionId: 'expand' },
  { label: 'Save',        actionId: 'save' },
]

function gradeLabel(grade) {
  if (!grade) return ''
  return (GRADES.find((g) => g.id === grade)?.label || grade).replace(/^Pre-school.*/i, 'Pre-school')
}
function subjectLabel(subject) {
  if (!subject) return ''
  return (SUBJECTS.find((s) => s.id === subject)?.label || subject).replace(/_/g, ' ')
}

/**
 * Build context-aware suggestion chips for the composer. The chips
 * change as the teacher fills in class context (or as we learn from
 * recent chats). Always returns 3-5 chips so the strip stays tidy.
 */
export function buildContextChips({
  grade,
  subject,
  term,
  week,
  learnerLevel,
  weakAreas,
  recentTopic,
} = {}) {
  const gLabel = gradeLabel(grade)
  const sLabel = subjectLabel(subject)
  const ctx = [gLabel, sLabel].filter(Boolean).join(' ')

  const out = []

  if (recentTopic) {
    out.push({
      id: 'continue_topic',
      label: `Continue "${recentTopic}"`,
      prompt: `Continue from where we left off on ${recentTopic}. Recap briefly, then take the class to the next sub-topic.`,
    })
  } else {
    out.push({
      id: 'prepare_tomorrow',
      label: ctx ? `Prepare tomorrow's ${ctx} lesson` : "Prepare tomorrow's lesson",
      prompt: `Prepare tomorrow's ${ctx ? ctx + ' ' : ''}lesson. Give me everything I need to teach it well.`,
    })
  }

  if (weakAreas) {
    out.push({
      id: 'help_weak_topic',
      label: `Help with: ${weakAreas}`,
      prompt: `My learners are struggling with ${weakAreas}. Build a remedial loop with re-teaching, scaffolded practice, and a confidence check.`,
    })
  } else {
    out.push({
      id: 'help_weak_learners',
      label: 'Help weak learners',
      prompt: "My learners are struggling. Give me a remedial plan with re-teaching, simple practice, and a confidence check.",
    })
  }

  out.push({
    id: 'quick_test',
    label: ctx ? `Quick test for ${ctx}` : 'Make a quick test',
    prompt: `Make a short ${ctx ? ctx + ' ' : ''}classroom test (8-10 questions, mixed types) with a marking key.`,
  })

  if (term && week) {
    out.push({
      id: 'plan_week',
      label: `Plan week ${week} of term ${term}`,
      prompt: `Plan a complete ${sLabel || ''} lesson for week ${week} of term ${term}.`.replace(/\s+/g, ' '),
    })
  } else {
    out.push({
      id: 'create_revision',
      label: 'Create revision work',
      prompt: "Create a revision session for what we've been learning recently — quick recap, mixed practice, and a short exit ticket.",
    })
  }

  if (learnerLevel === 'below') {
    out.push({
      id: 'simpler_lesson',
      label: 'Simpler lesson plan',
      prompt: "Plan a lesson that's easy to follow for below-grade learners. Use small steps and simple language.",
    })
  }

  // Dedup by id, cap at 5.
  const seen = new Set()
  return out.filter((o) => {
    if (seen.has(o.id)) return false
    seen.add(o.id)
    return true
  }).slice(0, 5)
}

/**
 * Empty-state starter cards shown in place of the welcome screen
 * when we know something useful about this teacher already (their
 * recent chats, prior weak areas, current grade/subject).
 */
export function buildStarterSuggestions({
  recentChats = [],
  weakAreas = '',
  grade = '',
  subject = '',
} = {}) {
  const gLabel = gradeLabel(grade)
  const sLabel = subjectLabel(subject)
  const ctx = [gLabel, sLabel].filter(Boolean).join(' ')
  const out = []

  const lastChat = recentChats[0]
  const lastTopic = recentChats.find((c) => c?.topic)?.topic
  const rememberedWeak = recentChats
    .flatMap((c) => (Array.isArray(c?.weakAreas) ? c.weakAreas : [c?.weakAreas]))
    .filter(Boolean)[0]

  if (lastTopic) {
    out.push({
      id: 'continue_topic',
      icon: '↻',
      label: `Continue ${lastTopic}`,
      sub: 'Pick up from your last lesson',
      prompt: `Continue teaching ${lastTopic}. Recap the key idea, then move to the next sub-topic with two practice items.`,
    })
  } else if (lastChat?.title) {
    out.push({
      id: 'continue_chat',
      icon: '↻',
      label: 'Pick up where we left off',
      sub: lastChat.title,
      prompt: `Pick up where we left off — ${lastChat.title}. Recap briefly, then take the class to the next step.`,
    })
  }

  if (weakAreas) {
    out.push({
      id: 'address_weak',
      icon: '🛟',
      label: `Address weak area`,
      sub: weakAreas,
      prompt: `Build remedial support for ${weakAreas}. Re-teach the concept, then add 5 graded practice items.`,
    })
  } else if (rememberedWeak) {
    out.push({
      id: 'address_remembered_weak',
      icon: '🛟',
      label: `Help again with weak area`,
      sub: rememberedWeak,
      prompt: `My learners still struggle with ${rememberedWeak}. Give me a fresh angle and three new practice items.`,
    })
  }

  out.push({
    id: 'prepare_tomorrow',
    icon: '🦊',
    label: ctx ? `Prepare tomorrow's ${ctx} lesson` : "Prepare tomorrow's lesson",
    sub: 'Lesson plan + materials',
    prompt: `Prepare tomorrow's ${ctx ? ctx + ' ' : ''}lesson. Give me everything I need to teach it well.`,
  })

  out.push({
    id: 'quick_test',
    icon: '🦅',
    label: ctx ? `Quick ${ctx} test` : 'Make a quick test',
    sub: '8-10 questions with marking key',
    prompt: `Make a short ${ctx ? ctx + ' ' : ''}classroom test (8-10 questions, mixed types) with a marking key.`,
  })

  out.push({
    id: 'create_revision',
    icon: '🦉',
    label: 'Create revision work',
    sub: 'Recap + mixed practice',
    prompt: "Create a revision session for what we've been learning recently — quick recap, mixed practice, and a short exit ticket.",
  })

  // Dedup, cap at 4.
  const seen = new Set()
  return out.filter((o) => {
    if (seen.has(o.id)) return false
    seen.add(o.id)
    return true
  }).slice(0, 4)
}

/**
 * Rotating "thinking" phases shown in the pending bubble while the
 * AI is generating. Cycled by the UI; the last entry is held until
 * the response arrives so the chat always feels alive even on slow
 * Anthropic calls.
 */
export const THINKING_PHASES = [
  'Reading your message…',
  'Picking the right approach…',
  'Pulling CBC context…',
  'Drafting your reply…',
  'Polishing the wording…',
]

/**
 * Map a follow-up actionId to a natural-language instruction the AI
 * understands. Keeps the UI buttons human, while the assistant still
 * sees a clear request.
 */
export function buildFollowUpPrompt(actionId, originalContent = '') {
  const ctx = originalContent ? `\n\nOriginal content for reference:\n${originalContent.slice(0, 1500)}` : ''
  switch (actionId) {
    case 'shorter':         return `Make the previous response shorter and tighter. Keep the most important parts only.${ctx}`
    case 'shorter_plan':    return `Shorten just the lesson plan section from the previous response. Keep everything else as-is.${ctx}`
    case 'add_activities':  return `Add 3 concrete learner activities to the previous response — name them, describe how they run, and what success looks like.${ctx}`
    case 'create_test':     return `Turn the previous response into a short classroom test of 8-10 questions with a marking key.${ctx}`
    case 'simplify':        return `Simplify the previous response for slow learners. Use easier words, smaller steps, and one example per idea.${ctx}`
    case 'expand':          return `Expand the previous response with more depth — add an extra worked example, a stretch question, and one extension activity for fast finishers.${ctx}`
    case 'easier':          return `Make the previous test easier. Reduce the cognitive load and add scaffolding hints.${ctx}`
    case 'easier_test':     return `Make the test in the previous response easier without changing the rest of the package.${ctx}`
    case 'marking_key':     return `Add a clear marking key with mark allocations for the previous test.${ctx}`
    case 'to_homework':     return `Turn the previous response into homework — short instructions, 4-6 tasks, and one creative task.${ctx}`
    case 'to_lesson_plan':  return `Turn the previous response into a CBC-aligned lesson plan with stages, timings, and differentiation.${ctx}`
    case 'parent_note':     return `Add a short parent-friendly note explaining how to support the learner with this homework.${ctx}`
    case 'expand_week':     return `Expand week 1 of the scheme into a full lesson plan I can teach.${ctx}`
    case 'more_resources':  return `Add more specific resources for each week — including local materials available in Zambia.${ctx}`
    case 'more_practice':   return `Add 5 more graded practice items to the remedial pack.${ctx}`
    case 'remedial':        return `Help me support weak learners on this — give me a short remedial loop with re-teaching and practice.${ctx}`
    case 'more_remedial':   return `Add more remedial practice to the previous package, with three difficulty steps.${ctx}`
    case 'exit_ticket':     return `Add a 3-question exit ticket the teacher can use to check understanding at the end.${ctx}`
    case 'save':            return ''
    default:                return `Refine the previous response: ${actionId}.${ctx}`
  }
}

/**
 * Send a conversational message. Returns:
 *   { chatId, messageId, content, intent, intentLabel, followUps,
 *     promptVersion, modelUsed }
 */
export async function sendChatMessage(payload) {
  const result = await callable(payload)
  return result.data
}

// Re-export light context helpers so the chat assistant has a single
// import surface and we don't duplicate constants.
export { GRADES, SUBJECTS, LEARNER_LEVELS, listMyAiChats, listAiChatMessages, getAiChat }
