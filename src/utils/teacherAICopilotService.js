/**
 * Teacher AI Co-Pilot — client service.
 *
 * Thin wrapper around:
 *   - the `generateTeacherAIContent` callable Firebase Function (the AI
 *     orchestration lives server-side; the API key never touches the
 *     browser).
 *   - Firestore reads for the chat list / messages, so existing AuthContext
 *     security applies.
 *
 * This module is intentionally self-contained so the new feature does not
 * have to touch the existing teacher-tool services.
 */

import { getFunctions, httpsCallable } from 'firebase/functions'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import app, { db } from '../firebase/config'

const functions = getFunctions(app, 'us-central1')
const callable = httpsCallable(functions, 'generateTeacherAIContent')

export const CONTENT_TYPES = [
  { id: 'lesson_plan',     label: 'Lesson Plan',     emoji: '🦊', accent: '#fde2c4', shortLabel: 'Lesson' },
  { id: 'notes',           label: 'Notes',           emoji: '🦉', accent: '#dbe7f4', shortLabel: 'Notes' },
  { id: 'test',            label: 'Test',            emoji: '🦅', accent: '#e8d8f0', shortLabel: 'Test' },
  { id: 'homework',        label: 'Homework',        emoji: '📝', accent: '#fde9b8', shortLabel: 'HW' },
  { id: 'scheme_of_work',  label: 'Scheme of Work',  emoji: '🦁', accent: '#faecb8', shortLabel: 'SoW' },
  { id: 'remedial',        label: 'Remedial Work',   emoji: '🛟', accent: '#ffd9d2', shortLabel: 'Remedial' },
  { id: 'everything',      label: 'Create Everything', emoji: '✨', accent: '#0e2a32', shortLabel: 'All', dark: true },
]

export const GRADES = [
  { id: 'ECE', label: 'Pre-school' },
  ...Array.from({ length: 12 }).map((_, i) => ({ id: `G${i + 1}`, label: `Grade ${i + 1}` })),
]

export const SUBJECTS = [
  { id: 'mathematics',                label: 'Mathematics' },
  { id: 'english',                    label: 'English' },
  { id: 'literacy',                   label: 'Literacy' },
  { id: 'numeracy',                   label: 'Numeracy' },
  { id: 'integrated_science',         label: 'Integrated Science' },
  { id: 'environmental_science',      label: 'Environmental Science' },
  { id: 'social_studies',             label: 'Social Studies' },
  { id: 'civic_education',            label: 'Civic Education' },
  { id: 'religious_education',        label: 'Religious Education' },
  { id: 'creative_and_technology_studies', label: 'Creative & Technology Studies' },
  { id: 'expressive_arts',            label: 'Expressive Arts' },
  { id: 'physical_education',         label: 'Physical Education' },
  { id: 'home_economics',             label: 'Home Economics' },
  { id: 'zambian_language',           label: 'Zambian Language' },
  { id: 'biology',                    label: 'Biology' },
  { id: 'chemistry',                  label: 'Chemistry' },
  { id: 'physics',                    label: 'Physics' },
  { id: 'geography',                  label: 'Geography' },
  { id: 'history',                    label: 'History' },
  { id: 'technology_studies',         label: 'Technology Studies' },
]

export const LEARNER_LEVELS = [
  { id: 'mixed',     label: 'Mixed ability' },
  { id: 'below',     label: 'Below grade level' },
  { id: 'on',        label: 'On grade level' },
  { id: 'above',     label: 'Above grade level' },
]

/**
 * Send a message to the Teacher AI Co-Pilot.
 * Returns: { chatId, messageId, content, contentDocId? }
 */
export async function sendTeacherAIMessage(payload) {
  const result = await callable(payload)
  return result.data
}

/**
 * List chats owned by the current teacher, newest first.
 * Server-side rules limit reads to the owner — see firestore.rules.
 */
export async function listMyAiChats(uid, max = 30) {
  if (!uid) return []
  const q = query(
    collection(db, 'aiChats'),
    where('ownerUid', '==', uid),
    orderBy('updatedAt', 'desc'),
    limit(max),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getAiChat(chatId) {
  if (!chatId) return null
  const ref = doc(db, 'aiChats', chatId)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function listAiChatMessages(chatId, max = 200) {
  if (!chatId) return []
  const q = query(
    collection(db, 'aiChats', chatId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(max),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Find a content type by id; falls back to a generic shape so the chat UI
 * never crashes if a stored chat references a content type we removed.
 */
export function lookupContentType(id) {
  return CONTENT_TYPES.find((c) => c.id === id) || {
    id: id || 'unknown',
    label: id ? id.replace(/_/g, ' ') : 'Item',
    emoji: '📄',
    accent: '#f0e9d6',
  }
}
