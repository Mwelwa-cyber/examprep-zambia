const {HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const LIMITS = {
  message: 1600,
  context: 900,
  question: 1200,
  answer: 700,
  subject: 80,
  grade: 20,
  topic: 120,
  quizCount: 10,
};

function cleanString(value, maxLength = 600) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim()
    .slice(0, maxLength);
}

function cleanContext(context = {}) {
  const allowed = [
    "area",
    "path",
    "subject",
    "grade",
    "topic",
    "lessonTitle",
    "quizTitle",
    "paperTitle",
    "role",
  ];
  const cleaned = {};
  allowed.forEach((key) => {
    const value = cleanString(context[key], 120);
    if (value) cleaned[key] = value;
  });
  return cleaned;
}

function getApiKey(openAiApiKey) {
  const apiKey = openAiApiKey.value() || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new HttpsError(
      "failed-precondition",
      "AI is not configured yet.",
    );
  }
  return apiKey;
}

async function getUserRole(uid) {
  const snap = await admin.firestore().doc(`users/${uid}`).get();
  return snap.exists ? cleanString(snap.data()?.role, 30) : "learner";
}

function isStaffRole(role) {
  return role === "teacher" || role === "admin";
}

async function assertDailyLimit(uid, role, action) {
  const day = new Date().toISOString().slice(0, 10);
  const limit = isStaffRole(role) ? 150 : 60;
  const ref = admin.firestore().doc(`aiUsage/${uid}_${day}`);

  await admin.firestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : {};
    const total = Number(data.total || 0);
    if (total >= limit) {
      throw new HttpsError(
        "resource-exhausted",
        "Daily AI limit reached. Please try again tomorrow.",
      );
    }
    const actions = data.actions || {};
    tx.set(ref, {
      uid,
      day,
      total: total + 1,
      actions: {
        ...actions,
        [action]: Number(actions[action] || 0) + 1,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});
  });
}

async function callOpenAI(apiKey, {
  messages,
  maxTokens = 500,
  temperature = 0.3,
  json = false,
}) {
  let res;
  try {
    res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(json && {response_format: {type: "json_object"}}),
      }),
    });
  } catch {
    throw new HttpsError(
      "unavailable",
      "AI is temporarily unavailable. Please try again.",
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error("OpenAI assistant error", {
      status: res.status,
      message: body?.error?.message,
    });
    throw new HttpsError(
      "unavailable",
      "AI is temporarily unavailable. Please try again.",
    );
  }

  const data = await res.json();
  return cleanString(data?.choices?.[0]?.message?.content, 4000);
}

function educationSystemPrompt(role, context = {}) {
  const page = context.area ? ` Current page: ${context.area}.` : "";
  const staff = isStaffRole(role)
    ? " Staff can ask for quiz-writing support."
    : " Learners should receive scaffolded help, hints, and explanations.";
  return [
    "You are Zed, the friendly study assistant for ZedExams.",
    "Help with Grade 4 to 6 school learning, quizzes, lessons, revision,",
    "past papers, and teacher content preparation.",
    "Use simple, age-appropriate language. Keep answers short and clear.",
    "If a request is unrelated to learning, reply exactly:",
    "\"I can help with lessons, quizzes, topics, and study support.\"",
    "Do not invent facts. Ask for the topic or question when context is",
    "missing. For quiz help, prefer hints before giving full answers.",
    page,
    staff,
  ].join(" ");
}

function buildChatMessages({message, context, role}) {
  const cleanedContext = cleanContext(context);
  return [
    {role: "system", content: educationSystemPrompt(role, cleanedContext)},
    {
      role: "user",
      content: [
        `Page context: ${JSON.stringify(cleanedContext)}`,
        `Student or staff message: ${message}`,
      ].join("\n"),
    },
  ];
}

function buildExplainMessages(payload) {
  const subject = cleanString(payload.subject, LIMITS.subject);
  const grade = cleanString(payload.grade, LIMITS.grade);
  const topic = cleanString(payload.topic, LIMITS.topic);
  const context = [grade && `Grade ${grade}`, subject, topic]
    .filter(Boolean)
    .join(", ");
  return [
    {
      role: "system",
      content: [
        "You explain quiz answers for Zambian Grade 4 to 6 learners.",
        "Use kind, simple language. Keep it under 90 words.",
        "Explain the idea, why the correct answer works, and one memory tip.",
        "Do not shame the learner.",
      ].join(" "),
    },
    {
      role: "user",
      content: [
        context ? `Context: ${context}` : "",
        `Question: ${cleanString(payload.question, LIMITS.question)}`,
        `Learner answer: ${cleanString(payload.learnerAnswer, LIMITS.answer)}`,
        `Correct answer: ${cleanString(payload.correctAnswer, LIMITS.answer)}`,
      ].filter(Boolean).join("\n"),
    },
  ];
}

function buildQuizMessages(payload) {
  const subject = cleanString(payload.subject, LIMITS.subject);
  const grade = cleanString(payload.grade, LIMITS.grade);
  const topic = cleanString(payload.topic, LIMITS.topic);
  const count = Math.min(
    Math.max(Number(payload.count) || 5, 1),
    LIMITS.quizCount,
  );
  return {
    count,
    messages: [
      {
        role: "system",
        content: [
          "You create safe, curriculum-friendly quiz questions for",
          "ZedExams teachers. Target Grades 4 to 6. Return only valid JSON.",
          "Questions must be age-appropriate, school-focused, and clear.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          `Create ${count} multiple-choice questions.`,
          `Subject: ${subject}`,
          `Grade: ${grade}`,
          `Topic: ${topic}`,
          "Return JSON in this shape:",
          "{\"questions\":[{\"text\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],",
          "\"correctAnswer\":0,\"explanation\":\"...\",\"topic\":\"...\",",
          "\"marks\":1,\"type\":\"mcq\"}]}",
        ].join("\n"),
      },
    ],
  };
}

function normalizeCorrectAnswer(value, options) {
  const numeric = Number(value);
  if (Number.isInteger(numeric) && numeric >= 0 && numeric < options.length) {
    return numeric;
  }

  const letterIndex = ["A", "B", "C", "D"].indexOf(
    cleanString(value, 10).toUpperCase(),
  );
  if (letterIndex >= 0 && letterIndex < options.length) return letterIndex;

  const valueText = cleanString(value, 160).toLowerCase();
  const optionIndex = options.findIndex((option) =>
    option.toLowerCase() === valueText,
  );
  return optionIndex >= 0 ? optionIndex : 0;
}

function parseGeneratedQuiz(raw, fallbackTopic) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new HttpsError(
      "internal",
      "The generated quiz could not be read. Please try again.",
    );
  }

  const source = Array.isArray(parsed.questions) ? parsed.questions : [];
  const questions = source.map((q) => {
    const options = Array.isArray(q.options)
      ? q.options.map((o) => cleanString(o, 160)).filter(Boolean).slice(0, 4)
      : [];
    return {
      text: cleanString(q.text, LIMITS.question),
      options,
      correctAnswer: normalizeCorrectAnswer(q.correctAnswer, options),
      explanation: cleanString(q.explanation, 500),
      topic: cleanString(q.topic || fallbackTopic, LIMITS.topic),
      marks: Math.min(Math.max(Number(q.marks) || 1, 1), 10),
      type: "mcq",
    };
  }).filter((q) => q.text && q.options.length === 4);

  if (!questions.length) {
    throw new HttpsError(
      "internal",
      "No usable quiz questions were generated. Please try again.",
    );
  }
  return questions;
}

module.exports = {
  LIMITS,
  assertDailyLimit,
  buildChatMessages,
  buildExplainMessages,
  buildQuizMessages,
  callOpenAI,
  cleanContext,
  cleanString,
  getApiKey,
  getUserRole,
  isStaffRole,
  parseGeneratedQuiz,
};
