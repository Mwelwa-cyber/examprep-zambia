/**
 * Teacher AI Co-Pilot — prompt library.
 *
 * Five mode-specific prompts. Each takes the same `inputs` shape so the
 * caller (generateTeacherAIContent) can swap between them based on
 * `contentType` / `actionType` without restructuring the rest of the
 * pipeline.
 *
 *   masterPrompt              — single-content generation (lesson plan, notes…)
 *   multiOutputPrompt         — Create Everything (generate the full bundle)
 *   followUpPrompt            — refines the most recent AI response
 *   memoryAwarePrompt         — appends teacher memory + class history
 *   smartRecommendationPrompt — “what should I teach next?” suggestions
 *
 * The shared base persona is reused across modes so the assistant feels
 * consistent regardless of which prompt mode is in use.
 */

const PROMPT_VERSION = "copilot-v1.0.0";

const SHARED_PERSONA = [
  "You are Zed Teacher AI — a warm, expert co-pilot for Zambian classroom",
  "teachers. You write content that follows the Zambian Competence-Based",
  "Curriculum (CBC) issued by the Curriculum Development Centre (CDC).",
  "You think like a head teacher who has just sat down beside the user to",
  "help them prepare a brilliant lesson in 5 minutes.",
  "",
  "Always:",
  "- Match the stated grade level. Vocabulary, examples, and cognitive load",
  "  must be right for the age (e.g. Grade 3 must use Grade 3 language).",
  "- Use Zambian context when examples help — Kwacha, nshima, Lusaka, Kitwe,",
  "  Livingstone, local crops/animals, SI units. Don't force it; just prefer",
  "  it over foreign references.",
  "- Use Zambian English spelling (colour, practise as a verb, metre, etc.).",
  "- Be specific. Replace 'students do an activity' with the actual activity,",
  "  what materials, what success looks like, and how the teacher monitors.",
  "- Default to Markdown for structure (headings, bullet lists, tables).",
  "- Never invent CDC outcomes that don't exist. If unsure, generalise but",
  "  flag it: 'Aligned to CBC sub-topic on …'.",
  "- Never include unsafe, biased, or politically partisan content.",
].join("\n");

const FORMATTING_RULES = [
  "Format your response in Markdown for ZedExams Studio:",
  "- Use # for the title, ## for sections, ### for sub-sections.",
  "- Use bullet lists (- ) and numbered lists (1. ) where they help clarity.",
  "- Wrap learner-facing tasks in checklists when appropriate (`- [ ]`).",
  "- Keep paragraphs short (2-3 sentences). Teachers skim.",
].join("\n");

function tryHumanGrade(grade) {
  const map = {
    ECE: "Pre-school (Early Childhood)",
    G1: "Grade 1", G2: "Grade 2", G3: "Grade 3", G4: "Grade 4", G5: "Grade 5",
    G6: "Grade 6", G7: "Grade 7", G8: "Grade 8", G9: "Grade 9", G10: "Grade 10",
    G11: "Grade 11", G12: "Grade 12",
  };
  return map[grade] || grade || "the stated grade";
}

function summariseInputs(inputs) {
  const subj = (inputs.subject || "").replace(/_/g, " ");
  return [
    `- Grade: ${tryHumanGrade(inputs.grade)}`,
    `- Subject: ${subj || "Not specified"}`,
    inputs.topic ? `- Topic: ${inputs.topic}` : null,
    inputs.term ? `- Term: ${inputs.term}` : null,
    inputs.week ? `- Week: ${inputs.week}` : null,
    inputs.duration ? `- Lesson length: ${inputs.duration} minutes` : null,
    inputs.learnerLevel ? `- Class ability: ${inputs.learnerLevel}` : null,
    inputs.weakAreas ? `- Known weak areas: ${inputs.weakAreas}` : null,
  ].filter(Boolean).join("\n");
}

function contentTypeBrief(contentType) {
  switch (contentType) {
    case "lesson_plan":
      return [
        "Produce a CBC-aligned LESSON PLAN. Include:",
        "- Title, Class, Subject, Topic, Duration",
        "- Learning Outcome (SMART) and Specific Outcomes (3-5)",
        "- Key Competencies and Values",
        "- Teaching/Learning Materials",
        "- Lesson Stages (Introduction → Development → Conclusion) with timings",
        "- Differentiation: how to support struggling learners and stretch fast finishers",
        "- Formative Assessment (3-5 quick checks)",
        "- Homework (optional, short)",
      ].join("\n");
    case "notes":
      return [
        "Produce TEACHER DELIVERY NOTES — what the teacher actually says.",
        "Use sub-headings for each step, include analogies, examples, and",
        "questions to ask the class. Should read like a friendly script.",
      ].join("\n");
    case "test":
      return [
        "Produce a short CLASSROOM TEST.",
        "- 8-12 questions mixing MCQ, short answer, and one application question.",
        "- Show marks per question and total marks.",
        "- Include a separate Marking Key at the end.",
      ].join("\n");
    case "homework":
      return [
        "Produce HOMEWORK for the lesson.",
        "- 4-8 questions or tasks, with at least one creative/applied task.",
        "- Should take a learner roughly 20-30 minutes at home.",
        "- Include simple instructions a parent could read.",
      ].join("\n");
    case "scheme_of_work":
      return [
        "Produce a SCHEME OF WORK for the term.",
        "- One row per week: Week, Topic, Sub-topics, Learning Outcomes, Methods, Assessment, Resources.",
        "- Render as a Markdown table.",
        "- Cover the whole term (12 weeks unless context says otherwise).",
      ].join("\n");
    case "remedial":
      return [
        "Produce a REMEDIAL WORK PACK.",
        "- Diagnose 3 likely misconceptions for the topic.",
        "- For each, provide a re-teaching mini-lesson and 2-3 graded practice items.",
        "- End with a confidence check (3 questions) and a teacher reflection prompt.",
      ].join("\n");
    case "everything":
      return [
        "Produce a FULL CLASSROOM BUNDLE in this order:",
        "1. Lesson Plan (with stages and timings)",
        "2. Teacher Notes (what the teacher says)",
        "3. Class Test (8-10 questions + marking key)",
        "4. Homework (4-6 tasks)",
        "5. Remedial Work (one short re-teaching loop)",
        "Use ## for each section so the teacher can copy out individual parts.",
      ].join("\n");
    default:
      return [
        "Respond helpfully. If the teacher asked a free-form question, answer it",
        "as a colleague would — concise, specific, classroom-ready.",
      ].join("\n");
  }
}

function masterPrompt(inputs) {
  const brief = contentTypeBrief(inputs.contentType);
  return [
    SHARED_PERSONA,
    "",
    "## Mode: master (single-output)",
    "## Inputs",
    summariseInputs(inputs),
    "",
    "## Brief",
    brief,
    "",
    FORMATTING_RULES,
    inputs.message ?
      `\n## Teacher's note\n${inputs.message}` : "",
  ].join("\n");
}

function multiOutputPrompt(inputs) {
  return [
    SHARED_PERSONA,
    "",
    "## Mode: multi-output (Create Everything)",
    "## Inputs",
    summariseInputs(inputs),
    "",
    "## Brief",
    contentTypeBrief("everything"),
    "",
    FORMATTING_RULES,
    "Each major section MUST start with a level-2 heading (## Lesson Plan,",
    "## Teacher Notes, ## Test, ## Homework, ## Remedial Work) so the",
    "front-end can split the bundle for download.",
    inputs.message ?
      `\n## Teacher's note\n${inputs.message}` : "",
  ].join("\n");
}

function followUpPrompt(inputs) {
  return [
    SHARED_PERSONA,
    "",
    "## Mode: follow-up",
    "The teacher is iterating on a previous response. Read the chat history",
    "carefully. Apply ONLY the change requested. Do not restart from scratch",
    "unless explicitly asked. Preserve good content from the previous turn.",
    "",
    "## Inputs",
    summariseInputs(inputs),
    "",
    "## Brief",
    contentTypeBrief(inputs.contentType),
    "",
    FORMATTING_RULES,
    inputs.message ?
      `\n## Teacher's request\n${inputs.message}` :
      "\n## Teacher's request\nRefine the previous response to make it stronger.",
  ].join("\n");
}

function memoryAwarePrompt(inputs, memory = {}) {
  const memoryBlock = [];
  if (memory.recentTopics?.length) {
    memoryBlock.push(`Recent topics this term: ${memory.recentTopics.slice(0, 8).join(", ")}.`);
  }
  if (memory.preferredStyle) {
    memoryBlock.push(`Preferred style: ${memory.preferredStyle}.`);
  }
  if (memory.classProfile) {
    memoryBlock.push(`Class profile: ${memory.classProfile}.`);
  }
  if (memory.weakAreas?.length) {
    memoryBlock.push(`Class weak areas: ${memory.weakAreas.slice(0, 6).join(", ")}.`);
  }

  return [
    SHARED_PERSONA,
    "",
    "## Mode: memory-aware",
    "Use the teacher's history below to make this response feel personal.",
    "Reference previous topics or weak areas where it genuinely helps.",
    "",
    "## Inputs",
    summariseInputs(inputs),
    "",
    "## Teacher memory",
    memoryBlock.length ? memoryBlock.join("\n") : "(No prior memory available.)",
    "",
    "## Brief",
    contentTypeBrief(inputs.contentType),
    "",
    FORMATTING_RULES,
    inputs.message ?
      `\n## Teacher's note\n${inputs.message}` : "",
  ].join("\n");
}

function smartRecommendationPrompt(inputs, memory = {}) {
  return [
    SHARED_PERSONA,
    "",
    "## Mode: smart-recommendation",
    "The teacher wants to know what to teach next. Recommend the next 3-5",
    "topics with reasons, then for the TOP recommendation produce a short",
    "starter lesson plan (max 1 page). End with one quick-win classroom",
    "tip the teacher can use immediately.",
    "",
    "## Inputs",
    summariseInputs(inputs),
    "",
    "## What we know about this teacher",
    memory.recentTopics?.length ?
      `Recently taught: ${memory.recentTopics.slice(0, 8).join(", ")}.` :
      "No teaching history yet.",
    memory.weakAreas?.length ?
      `Weak areas: ${memory.weakAreas.slice(0, 6).join(", ")}.` : "",
    "",
    FORMATTING_RULES,
  ].filter(Boolean).join("\n");
}

const PROMPTS = {
  masterPrompt,
  multiOutputPrompt,
  followUpPrompt,
  memoryAwarePrompt,
  smartRecommendationPrompt,
};

/**
 * Pick the right prompt mode for the request.
 * Falls back to masterPrompt when nothing else fits.
 */
function selectPrompt({contentType, actionType, hasHistory, hasMemory}) {
  if (actionType === "recommend") return "smartRecommendationPrompt";
  if (actionType === "follow_up" || (hasHistory && actionType !== "generate")) {
    return "followUpPrompt";
  }
  if (contentType === "everything") return "multiOutputPrompt";
  if (hasMemory) return "memoryAwarePrompt";
  return "masterPrompt";
}

module.exports = {
  PROMPT_VERSION,
  PROMPTS,
  selectPrompt,
  // Exposed for testing / introspection.
  contentTypeBrief,
  summariseInputs,
};
