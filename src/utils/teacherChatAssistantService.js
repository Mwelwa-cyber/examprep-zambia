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
 * Smart suggestion chips shown above the composer. They are plain
 * natural-language prompts — NOT contentType ids — so the server's
 * intent classifier can decide what to produce.
 */
export const SUGGESTION_CHIPS = [
  { id: 'prepare_tomorrow',  label: "Prepare tomorrow's lesson",  prompt: "Prepare tomorrow's lesson. Give me everything I need to teach it well." },
  { id: 'continue_last',     label: 'Continue from last lesson',  prompt: "Continue from where we left off in the last lesson. Recap briefly, then take the class to the next step." },
  { id: 'create_revision',   label: 'Create revision work',       prompt: "Create a revision session for what we've been learning recently — quick recap, mixed practice, and a short exit ticket." },
  { id: 'help_weak_learners',label: 'Help weak learners',         prompt: "My learners are struggling. Give me a remedial plan with re-teaching, simple practice, and a confidence check." },
  { id: 'quick_test',        label: 'Make a quick test',          prompt: "Make a short classroom test (8-10 questions, mixed types) with a marking key." },
]

/**
 * Smart follow-up actions used as a fallback when the server doesn't
 * return its own list. The server normally tailors these to the intent
 * — see followUpsForIntent in the Cloud Function.
 */
export const DEFAULT_FOLLOW_UPS = [
  { label: 'Make it shorter',          actionId: 'shorter' },
  { label: 'Add learner activities',    actionId: 'add_activities' },
  { label: 'Create test from this',     actionId: 'create_test' },
  { label: 'Simplify for slow learners',actionId: 'simplify' },
  { label: 'Download / Save',           actionId: 'save' },
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
