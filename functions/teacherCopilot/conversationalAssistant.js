/**
 * chatWithTeacherAssistant — HTTPS callable Cloud Function.
 *
 * The "AI Co-Pilot 2.0" backend. Unlike `generateTeacherAIContent`, this
 * function takes ONLY a free-form teacher message plus light context
 * settings — there are no `contentType` buttons in the UI. The function
 * classifies the teacher's intent, then produces a conversational response
 * that may include a lesson plan, notes, a test, homework, a scheme of
 * work, remedial work, revision, general teaching help, or — when asked
 * broadly — a full lesson package.
 *
 *   const fn = httpsCallable(functions, 'chatWithTeacherAssistant');
 *   const { chatId, messageId, content, intent, followUps } = await fn({
 *     chatId: null,                 // null on the very first turn
 *     message: "I'm teaching Grade 5 fractions tomorrow.",
 *     grade: 'G5',
 *     subject: 'mathematics',
 *     term: '1', week: '4', duration: '40',
 *     learnerLevel: 'mixed',
 *     weakAreas: 'simplifying fractions',
 *   });
 *
 * Persists to:
 *   aiChats/{chatId}                            — chat metadata (shared with v1)
 *   aiChats/{chatId}/messages/{messageId}       — both user and AI turns
 *
 * Reuses the same Firestore rules that already gate `aiChats` to the
 * owning teacher. Generated artefacts are NOT auto-saved to
 * `generatedContent` here — the teacher uses the chat-side "Save" button
 * (which writes via the client + existing rules) when they want to
 * keep something. That keeps short conversational replies from polluting
 * the saved-content library.
 */

const admin = require("firebase-admin");
const {onCall, HttpsError} = require("firebase-functions/v2/https");

const {
  assertDailyLimit,
  getAnthropicApiKey,
  getUserRole,
  isStaffRole,
} = require("../aiService");
const {callClaude} = require("../teacherTools/anthropicClient");
const {PROMPT_VERSION, contentTypeBrief} = require("./prompts");

const COPILOT_MODEL = process.env.COPILOT_MODEL || "claude-sonnet-4-5";
const MAX_HISTORY = 16;
const MAX_USER_MESSAGE = 1600;
const MAX_WEAK = 300;

const ALLOWED_GRADES = new Set([
  "ECE",
  "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9",
  "G10", "G11", "G12",
]);
const ALLOWED_SUBJECTS = new Set([
  "mathematics", "english", "literacy", "numeracy",
  "integrated_science", "environmental_science", "social_studies",
  "civic_education", "religious_education",
  "creative_and_technology_studies", "expressive_arts",
  "physical_education", "home_economics", "zambian_language",
  "biology", "chemistry", "physics",
  "geography", "history", "technology_studies",
  "", // optional — teacher can chat without a subject set
]);
const ALLOWED_LEVELS = new Set(["mixed", "below", "on", "above"]);

// Recognised intents the assistant can act on. Keep this list in sync
// with the front-end's smart-suggestion / follow-up buttons.
const INTENTS = [
  "lesson_plan",
  "notes",
  "test",
  "homework",
  "scheme_of_work",
  "remedial",
  "revision",
  "full_package",
  "general_help",
];

function clean(value, max) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/ /g, "").trim().slice(0, max || 200);
}

function sanitizeInputs(raw = {}) {
  const grade = clean(raw.grade, 10).toUpperCase().replace(/\s+/g, "");
  const subject = clean(raw.subject, 60).toLowerCase().replace(/[^a-z_]/g, "_");
  const learnerLevel = clean(raw.learnerLevel, 16).toLowerCase();

  return {
    chatId: clean(raw.chatId, 64),
    message: clean(raw.message, MAX_USER_MESSAGE),
    grade,
    subject,
    term: clean(raw.term, 4),
    week: clean(raw.week, 4),
    duration: clean(raw.duration, 6),
    learnerLevel: ALLOWED_LEVELS.has(learnerLevel) ? learnerLevel : "mixed",
    weakAreas: clean(raw.weakAreas, MAX_WEAK),
    previousChatContext: clean(raw.previousChatContext, 4000),
  };
}

function validateInputs(inputs) {
  const errs = [];
  if (!inputs.message) {
    errs.push("Type a message so the assistant knows how to help.");
  }
  if (inputs.grade && !ALLOWED_GRADES.has(inputs.grade)) {
    errs.push("That grade isn't supported yet.");
  }
  if (inputs.subject && !ALLOWED_SUBJECTS.has(inputs.subject)) {
    errs.push("That subject isn't supported yet.");
  }
  return errs;
}

/**
 * Lightweight rule-based intent classifier. Cheap, deterministic, and
 * runs server-side so the LLM doesn't need a separate classification
 * pass. The LLM still receives the raw message and may treat the
 * suggested intent as a *hint* — see buildSystemPrompt below.
 *
 * Order matters: more specific patterns must come first so a phrase
 * like "homework test" is treated as a test, not as homework.
 */
function classifyIntent(message) {
  const m = (message || "").toLowerCase();

  if (/\b(everything|full lesson|prepare everything|complete pack|lesson pack|full package|all (?:the )?materials|whole lesson)\b/.test(m)) {
    return "full_package";
  }
  if (/\b(scheme of work|schemes? of work|term plan|weekly plan|term breakdown|term scheme)\b/.test(m)) {
    return "scheme_of_work";
  }
  if (/\b(remedial|re-?teach|struggling|slow learner|weak learner|behind|extra help|misconception|simplify (?:this |it )?for slow)\b/.test(m)) {
    return "remedial";
  }
  if (/\b(revision|revise|recap|review session|exam prep|past paper)\b/.test(m)) {
    return "revision";
  }
  if (/\b(homework|home work|take[- ]home|assignment to take home)\b/.test(m)) {
    return "homework";
  }
  if (/\b(test|quiz|cat\b|continuous assessment|exam\b|examination|assessment)\b/.test(m)) {
    return "test";
  }
  if (/\b(notes|delivery notes|teacher notes|what to say|teaching script|lesson script)\b/.test(m)) {
    return "notes";
  }
  if (/\b(lesson plan|prepare (?:the |a |my |tomorrow'?s? )?lesson|teaching tomorrow|teaching today|prepare tomorrow|i'?m teaching)\b/.test(m)) {
    return "lesson_plan";
  }
  return "general_help";
}

function intentLabel(intent) {
  switch (intent) {
    case "lesson_plan": return "Lesson preparation";
    case "notes": return "Teacher notes";
    case "test": return "Classroom test";
    case "homework": return "Homework";
    case "scheme_of_work": return "Scheme of work";
    case "remedial": return "Remedial support";
    case "revision": return "Revision";
    case "full_package": return "Full lesson package";
    case "general_help":
    default:
      return "General teaching help";
  }
}

/**
 * Map a recognised intent to the corresponding contentType brief in
 * prompts.js. We deliberately reuse the existing briefs so the
 * conversational assistant keeps the same CBC quality bar as the
 * generators it replaces in the UI.
 */
function briefForIntent(intent) {
  switch (intent) {
    case "lesson_plan": return contentTypeBrief("lesson_plan");
    case "notes": return contentTypeBrief("notes");
    case "test": return contentTypeBrief("test");
    case "homework": return contentTypeBrief("homework");
    case "scheme_of_work": return contentTypeBrief("scheme_of_work");
    case "remedial": return contentTypeBrief("remedial");
    case "full_package": return contentTypeBrief("everything");
    case "revision":
      return [
        "Produce a REVISION SESSION the teacher can run as-is:",
        "- 3-5 quick recap points (bulleted)",
        "- 6-8 mixed practice questions (with brief answer key)",
        "- One application / past-paper-style question",
        "- A 5-minute reflection or exit-ticket prompt",
      ].join("\n");
    case "general_help":
    default:
      return [
        "Reply conversationally as a teaching colleague. Be specific and",
        "classroom-ready: name examples, suggest activities, predict where",
        "learners get stuck, and offer a small next step. If a useful",
        "artefact (mini-lesson, exit ticket, set of questions) helps,",
        "produce it in-line. Ask one focused clarifying question only when",
        "it would meaningfully change your answer.",
      ].join("\n");
  }
}

function tryHumanGrade(grade) {
  const map = {
    ECE: "Pre-school (Early Childhood)",
    G1: "Grade 1", G2: "Grade 2", G3: "Grade 3", G4: "Grade 4", G5: "Grade 5",
    G6: "Grade 6", G7: "Grade 7", G8: "Grade 8", G9: "Grade 9", G10: "Grade 10",
    G11: "Grade 11", G12: "Grade 12",
  };
  return map[grade] || grade || "the stated grade";
}

function summariseClassContext(inputs) {
  const subj = (inputs.subject || "").replace(/_/g, " ");
  const lines = [
    inputs.grade ? `- Grade: ${tryHumanGrade(inputs.grade)}` : null,
    subj ? `- Subject: ${subj}` : null,
    inputs.term ? `- Term: ${inputs.term}` : null,
    inputs.week ? `- Week: ${inputs.week}` : null,
    inputs.duration ? `- Lesson length: ${inputs.duration} minutes` : null,
    inputs.learnerLevel ? `- Class ability: ${inputs.learnerLevel}` : null,
    inputs.weakAreas ? `- Known weak areas: ${inputs.weakAreas}` : null,
  ].filter(Boolean);
  return lines.length ? lines.join("\n") : "(No class context provided yet.)";
}

const SHARED_PERSONA = [
  "You are Zed Teacher AI — a warm, expert co-pilot for Zambian classroom",
  "teachers. The teacher chats with you in plain English; you decide what",
  "to produce. You think like a head teacher who has just sat down beside",
  "the user to help them prepare a brilliant lesson in 5 minutes.",
  "",
  "Always:",
  "- Match the stated grade level. Vocabulary, examples, and cognitive load",
  "  must be right for the age (e.g. Grade 3 must use Grade 3 language).",
  "- Use Zambian context when examples help — Kwacha, nshima, Lusaka, Kitwe,",
  "  Livingstone, local crops/animals, SI units. Don't force it; just prefer",
  "  it over foreign references.",
  "- Use Zambian English spelling (colour, practise as a verb, metre, etc.).",
  "- Be specific. Replace vague phrases with the actual activity, materials,",
  "  what success looks like, and how the teacher monitors learners.",
  "- Format responses as readable Markdown (## headings, short paragraphs,",
  "  bullet/numbered lists, tables when helpful). Teachers skim — keep it",
  "  scannable.",
  "- Follow the Zambian Competence-Based Curriculum (CBC) issued by the",
  "  Curriculum Development Centre (CDC). Never invent CDC outcomes that",
  "  don't exist; if uncertain, generalise and flag it.",
  "- Sound like a friendly colleague, not a form-filler. It's fine to open",
  "  with a one-line acknowledgement before producing the artefact.",
  "- Never include unsafe, biased, or politically partisan content.",
].join("\n");

function buildSystemPrompt({inputs, intent, memory}) {
  const brief = briefForIntent(intent);
  const memoryBlock = [];
  if (memory.recentTopics?.length) {
    memoryBlock.push(`Recent topics this term: ${memory.recentTopics.slice(0, 6).join(", ")}.`);
  }
  if (memory.weakAreas?.length) {
    memoryBlock.push(`Class weak areas the teacher has flagged: ${memory.weakAreas.slice(0, 4).join(", ")}.`);
  }

  return [
    SHARED_PERSONA,
    "",
    "## How to interpret the conversation",
    "The teacher does NOT pick a content type from a menu. They just talk.",
    "Read the latest message and decide what is most useful to produce.",
    "",
    `Detected intent (server hint): ${intent} — ${intentLabel(intent)}.`,
    "Use the hint as a tie-breaker, not a command. If the message clearly",
    "asks for something different, follow the message.",
    "",
    "Possible intents:",
    "- lesson_plan          — preparing a lesson",
    "- notes                — teacher delivery notes / script",
    "- test                 — short classroom test or quiz",
    "- homework             — take-home tasks",
    "- scheme_of_work       — termly scheme",
    "- remedial             — support for struggling learners",
    "- revision             — recap / revision session",
    "- full_package         — lesson plan + notes + test + homework + remedial",
    "- general_help         — answer a question, give advice, brainstorm",
    "",
    "If the teacher asks broadly (\"prepare everything I need\", \"make this",
    "lesson ready\"), default to a FULL PACKAGE.",
    "",
    "## Class context",
    summariseClassContext(inputs),
    memoryBlock.length ? `\n## Teacher memory\n${memoryBlock.join("\n")}` : "",
    "",
    "## What to produce now",
    brief,
    "",
    "## Output rules",
    "- Use Markdown. Start with a level-2 heading (## ...) describing what",
    "  you are giving the teacher (e.g. \"## Lesson Plan — Fractions of",
    "  Shapes\").",
    "- For full packages, separate sections with `## Lesson Plan`,",
    "  `## Teacher Notes`, `## Test`, `## Homework`, `## Remedial Work` so",
    "  the teacher can copy any one part out.",
    "- Keep paragraphs to 2-3 sentences. Lists over walls of text.",
    "- Never wrap your reply in JSON or code fences.",
    "- Do NOT mention the words \"intent\" or \"contentType\" in the reply.",
    "- Do NOT prepend the reply with \"As an AI…\". Just help.",
  ].filter(Boolean).join("\n");
}

async function loadChatHistory(uid, chatId) {
  if (!chatId) return {chat: null, messages: []};
  const chatRef = admin.firestore().collection("aiChats").doc(chatId);
  const chatSnap = await chatRef.get();
  if (!chatSnap.exists) return {chat: null, messages: []};
  if (chatSnap.data().ownerUid !== uid) {
    throw new HttpsError(
      "permission-denied",
      "That chat belongs to a different account.",
    );
  }
  const msgsSnap = await chatRef.collection("messages")
    .orderBy("createdAt", "asc")
    .limitToLast(MAX_HISTORY)
    .get()
    .catch(async () => {
      return chatRef.collection("messages")
        .orderBy("createdAt", "asc")
        .get();
    });
  const messages = msgsSnap.docs.map((d) => {
    const data = d.data();
    return {
      role: data.role === "assistant" ? "assistant" : "user",
      content: clean(data.content, 4000),
    };
  }).filter((m) => m.content);
  return {chat: chatSnap.data(), messages};
}

async function loadTeacherMemory(uid) {
  const recentChats = await admin.firestore()
    .collection("aiChats")
    .where("ownerUid", "==", uid)
    .orderBy("updatedAt", "desc")
    .limit(8)
    .get()
    .catch(() => null);

  const recentTopics = [];
  const weakAreas = [];
  if (recentChats) {
    recentChats.forEach((doc) => {
      const data = doc.data();
      if (data.topic) recentTopics.push(clean(data.topic, 80));
      if (Array.isArray(data.weakAreas)) {
        data.weakAreas.forEach((w) => weakAreas.push(clean(w, 80)));
      } else if (typeof data.weakAreas === "string" && data.weakAreas) {
        weakAreas.push(clean(data.weakAreas, 80));
      }
    });
  }

  return {
    recentTopics: Array.from(new Set(recentTopics)).slice(0, 8),
    weakAreas: Array.from(new Set(weakAreas)).slice(0, 6),
  };
}

function buildAnthropicMessages(history, userMessage) {
  const cleaned = [];
  for (const m of history) {
    if (!m.content) continue;
    const last = cleaned[cleaned.length - 1];
    if (last && last.role === m.role) {
      last.content = `${last.content}\n\n${m.content}`;
    } else {
      cleaned.push({role: m.role, content: m.content});
    }
  }
  while (cleaned.length && cleaned[0].role !== "user") cleaned.shift();

  const tail = cleaned[cleaned.length - 1];
  if (tail && tail.role === "user") {
    tail.content = `${tail.content}\n\n${userMessage}`;
  } else {
    cleaned.push({role: "user", content: userMessage});
  }
  return cleaned;
}

function deriveTitle(inputs, intent) {
  const subj = inputs.subject ? inputs.subject.replace(/_/g, " ") : "";
  const grade = inputs.grade ? inputs.grade.replace(/^G/, "Grade ") : "";
  const head = inputs.message?.slice(0, 60).trim() || intentLabel(intent);
  const tail = [grade, subj].filter(Boolean).join(" · ");
  return tail ? `${head} (${tail})` : head;
}

/**
 * Extract phrases like "struggling with X", "stuck on Y", "having
 * trouble with Z" from the teacher's message. Best-effort and
 * conservative — we only return short noun phrases, deduped and
 * lowercased so the UI can render them as small chips.
 */
function extractWeakAreasFromMessage(message) {
  if (!message) return [];
  const out = [];
  const patterns = [
    /(?:struggling|stuck|having (?:a lot of )?trouble|finding it hard|weak)\s+(?:with|on|in|at)\s+([a-z0-9'\- ,&/]{3,80})/gi,
    /can'?t (?:do|understand|grasp|remember)\s+([a-z0-9'\- ,&/]{3,80})/gi,
    /not getting\s+([a-z0-9'\- ,&/]{3,80})/gi,
    /weak (?:area|areas|spot|spots) (?:are|is|include[s]?)?\s*[:\- ]\s*([a-z0-9'\- ,&/]{3,120})/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(message)) !== null) {
      const raw = m[1].split(/[.;!?]/)[0].trim()
        .replace(/^(the|a|an)\s+/i, "")
        .replace(/\s+(yet|still|now|today|tomorrow)$/i, "");
      if (raw && raw.length >= 3 && raw.length <= 80) {
        out.push(raw.toLowerCase());
      }
    }
  }
  // Dedup, cap.
  return Array.from(new Set(out)).slice(0, 3);
}

/**
 * Build the "memory feedback" badges shown under the assistant header
 * — small, glanceable notes that explain what the assistant noticed
 * and how it adapted. Strictly server-derived, never invented by the
 * model.
 */
function buildAdjustments({inputs, intent, memory, detectedWeakAreas}) {
  const out = [];
  if (detectedWeakAreas.length) {
    out.push(`Detected concern: ${detectedWeakAreas[0]}`);
  }
  if (inputs.weakAreas) {
    out.push(`Anchored to weak area: ${inputs.weakAreas}`);
  } else if (memory.weakAreas?.length) {
    out.push(`Remembered weak area: ${memory.weakAreas[0]}`);
  }
  switch (inputs.learnerLevel) {
    case "below":
      out.push("Adjusted pace for below-grade learners");
      break;
    case "above":
      out.push("Stretched for above-grade learners");
      break;
    case "mixed":
      out.push("Differentiated for mixed ability");
      break;
    default:
      break;
  }
  if (inputs.duration) {
    out.push(`Sized for a ${inputs.duration}-minute lesson`);
  }
  if (intent === "remedial") {
    out.push("Added scaffolding for slow learners");
  } else if (intent === "full_package") {
    out.push("Bundled lesson + notes + test + homework");
  } else if (intent === "revision") {
    out.push("Built as a recap session");
  }
  if (memory.recentTopics?.length && intent !== "general_help") {
    out.push(`Continued from recent topics: ${memory.recentTopics.slice(0, 2).join(", ")}`);
  }
  // Dedup while preserving order, cap at 4 so the UI stays calm.
  const seen = new Set();
  return out.filter((s) => {
    if (seen.has(s)) return false;
    seen.add(s);
    return true;
  }).slice(0, 4);
}

/**
 * Universal smart follow-up actions: Create test, Simplify, Expand,
 * Save. Kept short and predictable so the chat doesn't feel
 * form-filling. Per-intent extras are appended sparingly only when
 * they meaningfully change what the teacher might want next.
 */
function followUpsForIntent(intent) {
  const universal = [
    {label: "Create test", actionId: "create_test"},
    {label: "Simplify", actionId: "simplify"},
    {label: "Expand", actionId: "expand"},
    {label: "Save", actionId: "save"},
  ];
  switch (intent) {
    case "test":
      // "Create test from a test" is meaningless — swap for an easier-test variant.
      return [
        {label: "Make it easier", actionId: "easier"},
        {label: "Simplify", actionId: "simplify"},
        {label: "Expand with more questions", actionId: "expand"},
        {label: "Save", actionId: "save"},
      ];
    case "scheme_of_work":
      return [
        {label: "Expand week 1 into a lesson", actionId: "expand_week"},
        {label: "Simplify", actionId: "simplify"},
        {label: "Create test", actionId: "create_test"},
        {label: "Save", actionId: "save"},
      ];
    default:
      return universal;
  }
}

async function persistTurn({uid, chatId, inputs, intent, userText, aiText, modelUsed, usage}) {
  const dbRef = admin.firestore();
  const chatColl = dbRef.collection("aiChats");

  let resolvedChatId = chatId;
  const title = deriveTitle(inputs, intent);

  const chatPatch = {
    ownerUid: uid,
    title,
    grade: inputs.grade || null,
    subject: inputs.subject || null,
    topic: null,
    term: inputs.term || null,
    week: inputs.week || null,
    duration: inputs.duration || null,
    learnerLevel: inputs.learnerLevel,
    weakAreas: inputs.weakAreas || null,
    lastIntent: intent,
    lastContentType: "freeform",
    lastActionType: "chat",
    promptVersion: PROMPT_VERSION,
    mode: "conversational",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (!resolvedChatId) {
    const newRef = chatColl.doc();
    resolvedChatId = newRef.id;
    await newRef.set({
      ...chatPatch,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      messageCount: 0,
    });
  } else {
    await chatColl.doc(resolvedChatId).set(chatPatch, {merge: true});
  }

  const chatRef = chatColl.doc(resolvedChatId);
  const userMsgRef = chatRef.collection("messages").doc();
  const aiMsgRef = chatRef.collection("messages").doc();

  const batch = dbRef.batch();
  batch.set(userMsgRef, {
    role: "user",
    content: userText,
    intent,
    contentType: "freeform",
    actionType: "chat",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  batch.set(aiMsgRef, {
    role: "assistant",
    content: aiText,
    intent,
    contentType: "freeform",
    actionType: "chat",
    promptVersion: PROMPT_VERSION,
    modelUsed,
    usage: usage || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  batch.set(chatRef, {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    messageCount: admin.firestore.FieldValue.increment(2),
    lastMessagePreview: aiText.slice(0, 240),
  }, {merge: true});
  await batch.commit();

  return {chatId: resolvedChatId, userMessageId: userMsgRef.id, aiMessageId: aiMsgRef.id};
}

function createChatWithTeacherAssistant(anthropicApiKeyParam) {
  return onCall(
    {
      secrets: [anthropicApiKeyParam],
      region: "us-central1",
      timeoutSeconds: 120,
      memory: "512MiB",
    },
    async (request) => {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Please sign in first.");
      }
      const uid = request.auth.uid;
      const role = await getUserRole(uid);
      if (!isStaffRole(role)) {
        throw new HttpsError(
          "permission-denied",
          "The Teacher AI Co-Pilot is only available to teachers and admins.",
        );
      }

      const inputs = sanitizeInputs(request.data || {});
      const errs = validateInputs(inputs);
      if (errs.length) {
        throw new HttpsError("invalid-argument", errs.join(" "));
      }

      await assertDailyLimit(uid, role, "teacher_copilot");

      const intent = classifyIntent(inputs.message);
      const detectedWeakAreas = extractWeakAreasFromMessage(inputs.message);
      const [{messages: history}, memory] = await Promise.all([
        loadChatHistory(uid, inputs.chatId),
        loadTeacherMemory(uid),
      ]);

      const systemPrompt = buildSystemPrompt({inputs, intent, memory});
      let userText = inputs.message;
      if (inputs.previousChatContext) {
        // Optional client-supplied recap (e.g. "we were working on ...")
        // appended so the assistant gets it without needing extra
        // round-trips. Trimmed and clearly labelled so the model treats
        // it as background.
        userText = `${userText}\n\n[Background from earlier work]\n${inputs.previousChatContext}`;
      }
      const messages = buildAnthropicMessages(history, userText);

      const apiKey = getAnthropicApiKey(anthropicApiKeyParam);
      let result;
      try {
        result = await callClaude(apiKey, {
          systemPrompt,
          messages,
          maxTokens: intent === "full_package" ? 6000 : 3500,
          temperature: 0.45,
          model: COPILOT_MODEL,
          mode: "json", // disables tool-use; output is plain text/markdown
        });
      } catch (err) {
        console.error("[chatAssistant] Claude call failed", {
          code: err?.code,
          message: err?.message,
        });
        if (err instanceof HttpsError) throw err;
        throw new HttpsError(
          "unavailable",
          "AI is temporarily unavailable. Please try again.",
        );
      }

      const aiText = clean(result?.text, 100000);
      if (!aiText) {
        throw new HttpsError(
          "internal",
          "AI returned an empty response. Please try again.",
        );
      }

      const persisted = await persistTurn({
        uid,
        chatId: inputs.chatId || null,
        inputs,
        intent,
        userText: inputs.message,
        aiText,
        modelUsed: result?.model || COPILOT_MODEL,
        usage: result?.usage || null,
      });

      const adjustments = buildAdjustments({
        inputs,
        intent,
        memory,
        detectedWeakAreas,
      });

      return {
        chatId: persisted.chatId,
        messageId: persisted.aiMessageId,
        userMessageId: persisted.userMessageId,
        content: aiText,
        intent,
        intentLabel: intentLabel(intent),
        followUps: followUpsForIntent(intent),
        detectedWeakAreas,
        adjustments,
        rememberedWeakAreas: memory.weakAreas || [],
        rememberedTopics: memory.recentTopics || [],
        promptVersion: PROMPT_VERSION,
        modelUsed: result?.model || COPILOT_MODEL,
      };
    },
  );
}

module.exports = {
  createChatWithTeacherAssistant,
  // exposed for tests
  classifyIntent,
  intentLabel,
  followUpsForIntent,
  extractWeakAreasFromMessage,
  buildAdjustments,
  INTENTS,
};
