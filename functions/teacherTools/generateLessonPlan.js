/**
 * generateLessonPlan — HTTPS callable Cloud Function.
 *
 * Usage from client (after import):
 *   const fn = httpsCallable(functions, 'generateLessonPlan');
 *   const result = await fn({
 *     grade: 'G5', subject: 'mathematics', topic: 'Fractions',
 *     subtopic: 'Adding Fractions with Unlike Denominators',
 *     durationMinutes: 40, teacherName: 'Mr. Banda', school: 'Lusaka Primary',
 *     numberOfPupils: 42, instructions: ''
 *   });
 *   // result.data -> { generationId, lessonPlan, usage: {plan, used, limit} }
 */

const admin = require("firebase-admin");
const {onCall, HttpsError} = require("firebase-functions/v2/https");

const {
  getAnthropicApiKey,
  getUserRole,
  isStaffRole,
  stripJsonFences,
} = require("../aiService");
const {callClaude, DEFAULT_MODEL} = require("./anthropicClient");

const {resolveCbcContext, KB_VERSION} = require("./cbcKnowledge");
const {validateLessonPlan} = require("./lessonPlanSchema");
const {PROMPT_VERSION, SYSTEM_PROMPT, buildUserPrompt} =
  require("./lessonPlanPrompt");
const {assertAndIncrement} = require("./usageMeter");

// Override at deploy-time without a code change. Set LESSON_PLAN_MODEL=claude-haiku-4-5
// to drop generation time roughly in half at the cost of some reasoning depth.
const LESSON_PLAN_MODEL = process.env.LESSON_PLAN_MODEL || DEFAULT_MODEL;

// Output scales roughly with lesson length. A 20-min lesson rarely fills 4000
// tokens; a 90-min lesson sometimes truncates at 4000. Scaling cuts wall-clock
// for short lessons (generation time is ~linear in output tokens) while giving
// long ones room. Capped at 5000 to keep runaway lessons in check.
function lessonPlanMaxTokens(durationMinutes) {
  const scaled = 2200 + Math.round(Number(durationMinutes || 40) * 35);
  return Math.min(5000, Math.max(2500, scaled));
}

const ALLOWED_GRADES = new Set([
  "ECE", "G1", "G2", "G3", "G4", "G5", "G6", "G7",
  "G8", "G9", "G10", "G11", "G12",
]);
const ALLOWED_SUBJECTS = new Set([
  "mathematics", "english", "integrated_science", "social_studies",
  "literacy", "zambian_language", "creative_and_technology_studies",
  "physical_education", "religious_education", "civic_education",
  "biology", "chemistry", "physics", "geography", "history",
]);
const ALLOWED_LANGUAGES = new Set([
  "english", "bemba", "nyanja", "tonga", "lozi", "kaonde", "lunda", "luvale",
]);

function sanitizeInputs(raw = {}) {
  const str = (v, max) => (typeof v === "string" ?
    v.replace(/\u0000/g, "").trim().slice(0, max) : "");
  const num = (v, def) => (Number.isFinite(Number(v)) ? Number(v) : def);

  const grade = str(raw.grade, 10).toUpperCase().replace(/\s+/g, "");
  const subject = str(raw.subject, 40).toLowerCase().replace(/[^a-z_]/g, "_");
  const language = str(raw.language || "english", 20).toLowerCase();

  return {
    grade,
    subject,
    topic: str(raw.topic, 120),
    subtopic: str(raw.subtopic, 160),
    durationMinutes: Math.min(120, Math.max(20, Math.round(num(raw.durationMinutes, 40)))),
    language: ALLOWED_LANGUAGES.has(language) ? language : "english",
    teacherName: str(raw.teacherName, 80),
    school: str(raw.school, 120),
    numberOfPupils: Math.min(200, Math.max(1, Math.round(num(raw.numberOfPupils, 40)))),
    instructions: str(raw.instructions, 500),
  };
}

function validateInputs(inputs) {
  const errs = [];
  if (!inputs.grade || !ALLOWED_GRADES.has(inputs.grade)) {
    errs.push("Please select a grade from ECE–G12.");
  }
  if (!inputs.subject || !ALLOWED_SUBJECTS.has(inputs.subject)) {
    errs.push("Please select a supported subject.");
  }
  if (!inputs.topic) {
    errs.push("Please enter a topic.");
  }
  return errs;
}

/**
 * Factory so we can inject the secret parameter from index.js (following
 * the existing pattern in functions/index.js for MoMo + Anthropic).
 */
function createGenerateLessonPlan(anthropicApiKeySecret) {
  return onCall(
    {secrets: [anthropicApiKeySecret], timeoutSeconds: 120, memory: "512MiB"},
    async (request) => {
      const uid = request.auth && request.auth.uid;
      if (!uid) {
        throw new HttpsError("unauthenticated", "Please sign in.");
      }
      const role = await getUserRole(uid);
      if (!isStaffRole(role)) {
        throw new HttpsError(
          "permission-denied",
          "Teacher tools are available to approved teachers only.",
        );
      }

      // 1. Sanitise + validate inputs.
      const inputs = sanitizeInputs(request.data || {});
      const inputErrors = validateInputs(inputs);
      if (inputErrors.length > 0) {
        throw new HttpsError("invalid-argument", inputErrors.join(" "));
      }

      // 2. Resolve CBC context + enforce per-tool monthly quota in parallel.
      //    These are independent reads/writes; running them sequentially added
      //    ~100-300ms of latency on cold paths. resolveCbcContext never throws
      //    (unknown topics surface as a soft warning, not an error), so the
      //    only failure path is assertAndIncrement throwing on quota overflow.
      const [{contextBlock, kbMatch, kbWarning}, usage] = await Promise.all([
        resolveCbcContext({
          grade: inputs.grade,
          subject: inputs.subject,
          topic: inputs.topic,
          subtopic: inputs.subtopic,
        }),
        assertAndIncrement(uid, "lesson_plan"),
      ]);

      // 3. Resolve API key (sync — just reads the secret) and reserve a
      //    generation document. The Firestore write runs in parallel with the
      //    Claude call below: it's just a status doc, the result write at the
      //    end is the one teachers care about.
      const apiKey = getAnthropicApiKey(anthropicApiKeySecret);

      const genRef = admin.firestore().collection("aiGenerations").doc();
      const reservePromise = genRef.set({
        ownerUid: uid,
        tool: "lesson_plan",
        inputs,
        output: null,
        outputText: "",
        modelUsed: LESSON_PLAN_MODEL,
        promptVersion: PROMPT_VERSION,
        kbVersion: KB_VERSION,
        tokensIn: 0,
        tokensOut: 0,
        costUsdCents: 0,
        status: "generating",
        errorMessage: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: null,
        teacherEdited: false,
        exportedFormats: [],
        visibility: "private",
      }).catch((err) => {
        // Don't block generation on the status-doc write. Log and continue;
        // the final write at the end will create the doc if this one missed.
        console.warn("Failed to reserve generation doc", err);
      });

      // 4. Call Claude. The reservation write runs in parallel; by the time
      //    we reach any genRef.update below, the reservation has resolved.
      const userPrompt = buildUserPrompt(inputs);
      let raw = "";
      let usageInfo = {inputTokens: 0, outputTokens: 0};
      let modelUsed = LESSON_PLAN_MODEL;
      try {
        const [response] = await Promise.all([
          callClaude(apiKey, {
            systemPrompt: SYSTEM_PROMPT,
            cbcContextBlock: contextBlock,
            messages: [{role: "user", content: userPrompt}],
            maxTokens: lessonPlanMaxTokens(inputs.durationMinutes),
            temperature: 0.3,
            model: LESSON_PLAN_MODEL,
          }),
          reservePromise,
        ]);
        raw = response.text || "";
        usageInfo = response.usage || usageInfo;
        modelUsed = response.model || modelUsed;
      } catch (err) {
        await reservePromise;
        await genRef.set({
          status: "failed",
          errorMessage: String(err && err.message || err).slice(0, 500),
        }, {merge: true}).catch(() => {});
        throw err;
      }

      // 5. Parse JSON (Claude is instructed to emit raw JSON, but we strip
      //    fences defensively).
      let parsed;
      try {
        parsed = JSON.parse(stripJsonFences(raw));
      } catch (err) {
        await genRef.set({
          status: "failed",
          errorMessage: "AI returned non-JSON output",
          outputText: String(raw || "").slice(0, 12000),
        }, {merge: true}).catch(() => {});
        throw new HttpsError(
          "internal",
          "The AI returned an unexpected response. Please try again.",
        );
      }

      // 6. Validate + normalise against our schema.
      const validation = validateLessonPlan(parsed);
      const lessonPlan = validation.value;
      if (!validation.ok) {
        // We still store the partial, but flag the document.
        await genRef.set({
          status: "flagged",
          errorMessage: `Schema errors: ${validation.errors.join("; ")}`,
          output: lessonPlan,
          outputText: String(raw || "").slice(0, 20000),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          tokensIn: Number(usageInfo.inputTokens || 0),
          tokensOut: Number(usageInfo.outputTokens || 0),
          modelUsed,
        }, {merge: true});
        // Still return what we have — better than erroring. The teacher can
        // regenerate or edit.
        return {
          generationId: genRef.id,
          lessonPlan,
          usage,
          warning: [
            "Some fields were incomplete — please review carefully.",
            kbWarning,
          ].filter(Boolean).join(" "),
          kbGrounded: Boolean(kbMatch),
        };
      }

      // 7. Happy path — finalise the generation doc.
      const tokensIn = Number(usageInfo.inputTokens || 0);
      const tokensOut = Number(usageInfo.outputTokens || 0);
      // Claude Sonnet 4.5 approx pricing: $3/M input, $15/M output.
      const costUsdCents = Math.round(
        ((tokensIn / 1e6) * 300) + ((tokensOut / 1e6) * 1500),
      );
      await genRef.set({
        status: "complete",
        output: lessonPlan,
        outputText: String(raw || "").slice(0, 20000),
        tokensIn,
        tokensOut,
        costUsdCents,
        modelUsed,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});

      return {
        generationId: genRef.id,
        lessonPlan,
        usage,
        warning: kbWarning || null,
        kbGrounded: Boolean(kbMatch),
      };
    },
  );
}

module.exports = {createGenerateLessonPlan};
