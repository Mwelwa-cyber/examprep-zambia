/**
 * CBC Knowledge Base — lookup, suggest, and context-rendering logic.
 *
 * Two sources of topic data:
 *   1. Firestore — `cbcKnowledgeBase/{KB_VERSION}/topics/*` — admin-editable.
 *   2. In-code — `cbcTopics.js` — hand-curated seed (G1-9). Acts as fallback
 *      when a topic isn't in Firestore yet.
 *
 * We merge both on every generation call. Firestore entries win on
 * grade+subject+topic collision. In-process cache holds the merged set for
 * 60 seconds to keep Firestore costs negligible.
 */

const admin = require("firebase-admin");
const {TOPICS: SEED_TOPICS} = require("./cbcTopics");
const {
  invalidatePrivateCurriculumCache,
  resolvePrivateCurriculumContext,
} = require("./privateCurriculum");

const KB_VERSION = "cbc-kb-2026-04-seed";

// Module-level cache to avoid hitting Firestore on every generation.
let _cache = null;
let _cacheAt = 0;
const CACHE_TTL_MS = 60_000;

/**
 * Fetch topics from Firestore for the active KB version. Returns [] if the
 * collection doesn't exist yet or the request fails — the in-code fallback
 * still works.
 */
async function fetchFirestoreTopics() {
  try {
    const db = admin.firestore();
    const snap = await db
      .collection("cbcKnowledgeBase")
      .doc(KB_VERSION)
      .collection("topics")
      .get();
    return snap.docs.map((d) => ({id: d.id, ...d.data()}));
  } catch (err) {
    console.error("fetchFirestoreTopics failed", err);
    return [];
  }
}

/**
 * Return the merged topic list (Firestore + in-code). Firestore wins on
 * matching grade+subject+topic-name triplets.
 */
async function getAllTopics() {
  const now = Date.now();
  if (_cache && (now - _cacheAt) < CACHE_TTL_MS) return _cache;

  const fromFirestore = await fetchFirestoreTopics();
  const byKey = new Map();
  // Seed first...
  for (const t of SEED_TOPICS) {
    byKey.set(topicKey(t), {...t, _source: "seed"});
  }
  // ...then Firestore overrides.
  for (const t of fromFirestore) {
    byKey.set(topicKey(t), {...t, _source: "firestore"});
  }
  _cache = Array.from(byKey.values());
  _cacheAt = now;
  return _cache;
}

function topicKey(t) {
  const grade = String(t.grade || "").toUpperCase();
  const subject = String(t.subject || "").toLowerCase();
  const topic = String(t.topic || "").toLowerCase().trim();
  return `${grade}|${subject}|${topic}`;
}

/** Force the next getAllTopics() call to bypass the cache. Used after writes. */
function invalidateKbCache() {
  _cache = null;
  _cacheAt = 0;
  try {
    invalidatePrivateCurriculumCache();
  } catch {
    // Best effort only — the editable seed cache is the important part here.
  }
}

// Legacy synchronous reference used by the older lookup functions. Now a
// getter that returns the cached set (may be empty on cold start — the async
// paths above are preferred).
const TOPICS = SEED_TOPICS;

/**
 * Look up a topic. Fuzzy-matches on the topic string within a grade+subject.
 * Returns null if no confident match.
 *
 * Now async — pulls merged topic set (Firestore + seed).
 */
async function lookupTopic({grade, subject, topic}) {
  if (!grade || !subject || !topic) return null;
  const gradeNorm = String(grade).toUpperCase().replace(/\s+/g, "");
  const subjectNorm = String(subject).toLowerCase().replace(/[^a-z]/g, "_");
  const topicNorm = String(topic).toLowerCase().trim();
  const allTopics = await getAllTopics();
  const candidates = allTopics.filter((t) =>
    String(t.grade || "").toUpperCase() === gradeNorm &&
    String(t.subject || "").toLowerCase() === subjectNorm,
  );
  if (candidates.length === 0) return null;

  // Exact topic match wins.
  const exact = candidates.find(
    (t) => t.topic.toLowerCase() === topicNorm,
  );
  if (exact) return exact;

  // Contains-match — either direction (topic contains candidate, or vice versa).
  const contains = candidates.find((t) => {
    const cand = t.topic.toLowerCase();
    return cand.includes(topicNorm) || topicNorm.includes(cand);
  });
  if (contains) return contains;

  // Sub-topic match.
  const subMatch = candidates.find((t) =>
    t.subtopics.some(
      (s) => s.toLowerCase().includes(topicNorm) ||
             topicNorm.includes(s.toLowerCase()),
    ),
  );
  if (subMatch) return subMatch;

  // Token-overlap fallback (>= 1 shared non-stopword token).
  const STOP = new Set([
    "the", "and", "of", "a", "an", "to", "with", "in", "for", "on",
  ]);
  const topicTokens = topicNorm
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t));
  const partial = candidates.find((t) => {
    const candTokens = t.topic.toLowerCase().split(/\s+/);
    return topicTokens.some((tok) => candTokens.includes(tok));
  });
  return partial || null;
}

/**
 * Suggest up to 5 topic strings for a grade + subject. Used when we can't
 * find a confident match — teacher sees: "Did you mean one of these?"
 */
async function suggestTopics({grade, subject}) {
  const gradeNorm = String(grade || "").toUpperCase().replace(/\s+/g, "");
  const subjectNorm = String(subject || "").toLowerCase().replace(/[^a-z]/g, "_");
  const allTopics = await getAllTopics();
  return allTopics
    .filter((t) =>
      String(t.grade || "").toUpperCase() === gradeNorm &&
      String(t.subject || "").toLowerCase() === subjectNorm,
    )
    .map((t) => t.topic)
    .slice(0, 5);
}

/**
 * Render a topic entry as the `<cbc_context>` block we inject into the prompt.
 */
function renderContextBlock(entry) {
  if (!entry) return "";
  const subs = entry.subtopics.map((s) => `- ${s}`).join("\n");
  const outcomes = entry.specificOutcomes.map((s) => `- ${s}`).join("\n");
  const comps = entry.keyCompetencies.map((s) => `- ${s}`).join("\n");
  const vals = entry.values.map((s) => `- ${s}`).join("\n");
  const mats = entry.suggestedMaterials.map((s) => `- ${s}`).join("\n");
  return [
    "<cbc_context>",
    `Grade: ${entry.grade}`,
    `Subject: ${entry.subject}`,
    `Term: ${entry.term}`,
    `Topic: ${entry.topic}`,
    "",
    "Official sub-topics covered under this topic in the CDC syllabus:",
    subs,
    "",
    "Typical Specific Outcomes:",
    outcomes,
    "",
    "Key Competencies most relevant here:",
    comps,
    "",
    "Values typically emphasised:",
    vals,
    "",
    "Suggested Teaching/Learning Materials:",
    mats,
    "</cbc_context>",
  ].join("\n");
}

/**
 * Fallback context used when the KB has no confident match. Rather than
 * rejecting the request, give Claude a structured brief that leans on its
 * general knowledge of the Zambian CBC.
 */
function renderFallbackContext({grade, subject, topic, subtopic}) {
  return [
    "<cbc_context>",
    `Grade: ${grade}`,
    `Subject: ${subject}`,
    `Topic: ${topic}`,
    subtopic ? `Sub-topic: ${subtopic}` : "",
    "",
    "NOTE: This specific topic is not in our curated Zambian CBC topic list",
    "yet. Produce the lesson plan using your expert knowledge of the Zambian",
    "Competence-Based Curriculum (2013 framework, CDC) for this grade and",
    "subject. Guidelines:",
    "",
    "- Use authentic Zambian CDC terminology: Specific Outcomes, Key",
    "  Competencies, Values, Pupils' Activities, Teacher's Activities,",
    "  Teacher's Reflection.",
    "- Align Specific Outcomes, Key Competencies and Values with what CDC",
    "  typically emphasises at this grade level.",
    "- If you are unsure whether this exact topic is part of the official",
    "  Zambian syllabus at this grade, still produce a usable lesson plan,",
    "  adapting the sub-topic breakdown to the closest CBC-aligned concept.",
    "- Cite the appropriate grade-and-subject Pupil's Book (CDC) when listing",
    "  teaching materials.",
    "</cbc_context>",
  ].filter(Boolean).join("\n");
}

/**
 * High-level resolver used by the Cloud Function. Returns:
 *   { contextBlock, kbMatch, kbWarning }
 * where kbMatch is the KB topic entry (or null) and kbWarning is either null
 * or a human-readable string to surface in the UI.
 */
async function resolveCbcContext({grade, subject, topic, subtopic}) {
  const privateResult = await resolvePrivateCurriculumContext({
    grade,
    subject,
    topic,
    subtopic,
  });
  if (privateResult) {
    return {
      contextBlock: privateResult.contextBlock,
      kbMatch: privateResult.match,
      kbWarning: null,
    };
  }

  const match = await lookupTopic({grade, subject, topic});
  if (match) {
    return {
      contextBlock: renderContextBlock(match),
      kbMatch: match,
      kbWarning: null,
    };
  }
  const suggestions = await suggestTopics({grade, subject});
  return {
    contextBlock: renderFallbackContext({grade, subject, topic, subtopic}),
    kbMatch: null,
    kbWarning: suggestions.length ?
      `"${topic}" isn't in our verified syllabus list yet — used general ` +
      `CBC knowledge. Nearby verified topics for this grade+subject: ` +
      `${suggestions.join(", ")}.` :
      `"${topic}" used general CBC knowledge (no verified syllabus data for ` +
      `this grade+subject yet).`,
  };
}

module.exports = {
  KB_VERSION,
  lookupTopic,
  suggestTopics,
  renderContextBlock,
  renderFallbackContext,
  resolveCbcContext,
  invalidateKbCache,
  getAllTopics,
  _topics: TOPICS,
};
