// Public share links for teacher-generated content.
//
// Design: a shared plan lives in /shares/{token} as a frozen snapshot of
// the plan at share-time. The token IS the share URL — knowing it is
// permission to view. Later edits to the original generation do NOT
// change what the share URL shows. To update the share, the teacher
// republishes (which creates a new token).
//
// Firestore rules (see firestore.rules):
//   • public read while revokedAt is null
//   • owner creates; owner can only revoke or retitle

import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase/config'

/**
 * Publish a snapshot of a generation. Returns { token, url, shareId }.
 * The share URL is suitable for sending in WhatsApp / email.
 */
export async function publishShare({ tool, ownerUid, title, plan, subject, grade, topic }) {
  if (!ownerUid) throw new Error('Must be signed in to share.')
  if (!plan || typeof plan !== 'object') throw new Error('Nothing to share — plan is empty.')

  const ref = await addDoc(collection(db, 'shares'), {
    tool: String(tool || 'lesson_plan').slice(0, 40),
    ownerUid,
    title: String(title || 'Shared lesson plan').slice(0, 200),
    plan,
    subject: subject || null,
    grade: grade || null,
    topic: topic || null,
    createdAt: serverTimestamp(),
  })
  const token = ref.id
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return {
    token,
    shareId: ref.id,
    url: `${origin}/share/${token}`,
  }
}

/**
 * Revoke a previously-published share. The public URL immediately stops
 * working — set via `revokedAt` rather than delete, so existing links
 * fail with a clear "revoked" message instead of a generic 404.
 */
export async function revokeShare(token) {
  await updateDoc(doc(db, 'shares', token), { revokedAt: serverTimestamp() })
}
