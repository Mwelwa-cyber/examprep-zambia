/**
 * Client-side wrapper around the teacher-tools Cloud Functions.
 *
 * Mirrors the pattern used in src/utils/aiAssistant.js so error handling is
 * consistent across the app.
 */

import { getFunctions, httpsCallable } from 'firebase/functions'
import app from '../firebase/config'

const functions = getFunctions(app, 'us-central1')

const generateLessonPlanCallable = httpsCallable(functions, 'generateLessonPlan', {
  timeout: 120_000, // server: 120s
})

export const TEACHER_GRADES = [
  { value: 'ECE', label: 'Early Childhood Education' },
  { value: 'G1', label: 'Grade 1' },
  { value: 'G2', label: 'Grade 2' },
  { value: 'G3', label: 'Grade 3' },
  { value: 'G4', label: 'Grade 4' },
  { value: 'G5', label: 'Grade 5' },
  { value: 'G6', label: 'Grade 6' },
  { value: 'G7', label: 'Grade 7' },
  { value: 'G8', label: 'Grade 8' },
  { value: 'G9', label: 'Grade 9' },
  { value: 'G10', label: 'Grade 10' },
  { value: 'G11', label: 'Grade 11' },
  { value: 'G12', label: 'Grade 12' },
]

export const TEACHER_SUBJECTS = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'english', label: 'English' },
  { value: 'integrated_science', label: 'Integrated Science' },
  { value: 'social_studies', label: 'Social Studies' },
  { value: 'literacy', label: 'Literacy' },
  { value: 'zambian_language', label: 'Zambian Language' },
  { value: 'creative_and_technology_studies', label: 'Creative & Technology Studies' },
  { value: 'physical_education', label: 'Physical Education' },
  { value: 'religious_education', label: 'Religious Education' },
  { value: 'civic_education', label: 'Civic Education' },
  { value: 'biology', label: 'Biology' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'physics', label: 'Physics' },
  { value: 'geography', label: 'Geography' },
  { value: 'history', label: 'History' },
]

export const TEACHER_LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'bemba', label: 'Bemba' },
  { value: 'nyanja', label: 'Nyanja' },
  { value: 'tonga', label: 'Tonga' },
  { value: 'lozi', label: 'Lozi' },
  { value: 'kaonde', label: 'Kaonde' },
  { value: 'lunda', label: 'Lunda' },
  { value: 'luvale', label: 'Luvale' },
]

export const DURATION_PRESETS = [
  { value: 30, label: '30 min — short lesson' },
  { value: 40, label: '40 min — standard (recommended)' },
  { value: 60, label: '60 min — double period' },
  { value: 80, label: '80 min — extended' },
]

function messageFromError(error) {
  const code = error?.code || ''
  const detail = error?.message || ''
  if (code.includes('unauthenticated')) {
    return 'Please sign in to generate a lesson plan.'
  }
  if (code.includes('permission-denied')) {
    return 'Teacher tools are available to approved teachers only. Apply to become a verified teacher to continue.'
  }
  if (code.includes('not-found')) {
    return detail || 'That topic isn\'t in the syllabus yet. Try a different one.'
  }
  if (code.includes('failed-precondition')) {
    return detail || 'You have reached your monthly limit. Upgrade to continue.'
  }
  if (code.includes('resource-exhausted')) {
    return 'The AI is busy right now. Please wait a moment and try again.'
  }
  if (code.includes('invalid-argument')) {
    return detail || 'Please check your inputs and try again.'
  }
  return detail || 'The lesson plan generator is unavailable right now. Please try again.'
}

// Safety net — if the httpsCallable promise hasn't resolved in 130s, we
// reject with a clear message instead of leaving the spinner running forever.
// 130s > the 120s server timeout so the server's own error surfaces first when
// it's just slow; this only triggers on genuine client-side hangs (network,
// unreachable function, CORS misfire, etc.).
const HARD_CLIENT_TIMEOUT_MS = 130_000

function withTimeout(promise, ms, label = 'request') {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      const err = new Error(
        `Client-side timeout: ${label} did not respond within ${Math.round(ms / 1000)}s. ` +
        `This usually means the Cloud Function is not deployed or not reachable. ` +
        `Check: (1) 'firebase functions:list' includes generateLessonPlan, ` +
        `(2) ANTHROPIC_API_KEY secret is set, (3) you are signed in as a teacher/admin. ` +
        `See DEBUG_LESSON_PLAN.md.`
      )
      err.code = 'client-timeout'
      reject(err)
    }, ms)
    promise.then(
      (v) => { clearTimeout(t); resolve(v) },
      (e) => { clearTimeout(t); reject(e) },
    )
  })
}

export async function generateLessonPlan(inputs) {
  // Log the outgoing request so it's visible in DevTools → Console.
  console.info('[zedexams] generateLessonPlan →', {
    grade: inputs?.grade,
    subject: inputs?.subject,
    topic: inputs?.topic,
    durationMinutes: inputs?.durationMinutes,
  })
  const startedAt = Date.now()
  try {
    const result = await withTimeout(
      generateLessonPlanCallable(inputs),
      HARD_CLIENT_TIMEOUT_MS,
      'generateLessonPlan',
    )
    console.info(
      '[zedexams] generateLessonPlan ← ok in',
      Date.now() - startedAt, 'ms',
      { generationId: result?.data?.generationId, warning: result?.data?.warning },
    )
    return { ok: true, data: result.data }
  } catch (error) {
    // Verbose dev-console error so we can see exactly what failed.
    console.error('[zedexams] generateLessonPlan ← FAILED after',
      Date.now() - startedAt, 'ms',
      {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        httpErrorCode: error?.httpErrorCode?.status,
      },
    )
    return {
      ok: false,
      error: messageFromError(error),
      code: error?.code || 'unknown',
      rawMessage: error?.message || '',
    }
  }
}
