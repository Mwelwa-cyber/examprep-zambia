/**
 * Scheme of Work runtime validator.
 */

const SCHEMA_VERSION = "1.0";

function isNonEmptyString(v) { return typeof v === "string" && v.trim().length > 0; }
function isStringArray(v) { return Array.isArray(v) && v.every(isNonEmptyString); }
function isPositiveNumber(v) { return typeof v === "number" && Number.isFinite(v) && v > 0; }

function validateSchemeOfWork(input) {
  const errors = [];

  if (!input || typeof input !== "object") {
    return {ok: false, errors: ["Top-level payload must be an object."]};
  }

  // ── header ─────────────────────────────────────────────────
  const h = input.header || {};
  const header = {
    school: isNonEmptyString(h.school) ? h.school : "",
    teacherName: isNonEmptyString(h.teacherName) ? h.teacherName : "",
    class: isNonEmptyString(h.class) ? h.class : "",
    subject: isNonEmptyString(h.subject) ? h.subject : "",
    term: isPositiveNumber(h.term) ? Math.round(h.term) : 1,
    numberOfWeeks: isPositiveNumber(h.numberOfWeeks) ? Math.round(h.numberOfWeeks) : 12,
    academicYear: isNonEmptyString(h.academicYear) ? h.academicYear :
      String(new Date().getUTCFullYear()),
    mediumOfInstruction: isNonEmptyString(h.mediumOfInstruction) ?
      h.mediumOfInstruction : "English",
  };
  if (!header.class) errors.push("header.class is required");
  if (!header.subject) errors.push("header.subject is required");

  // ── overview ──────────────────────────────────────────────
  const o = input.overview || {};
  const overview = {
    termTheme: isNonEmptyString(o.termTheme) ? o.termTheme : "",
    overallCompetencies: isStringArray(o.overallCompetencies) ? o.overallCompetencies : [],
    overallValues: isStringArray(o.overallValues) ? o.overallValues : [],
  };

  // ── weeks ─────────────────────────────────────────────────
  const rawWeeks = Array.isArray(input.weeks) ? input.weeks : [];
  const weeks = rawWeeks
    .filter((w) => w && typeof w === "object")
    .map((w, idx) => ({
      weekNumber: isPositiveNumber(w.weekNumber) ? Math.round(w.weekNumber) : idx + 1,
      topic: isNonEmptyString(w.topic) ? w.topic : `Week ${idx + 1}`,
      subtopics: isStringArray(w.subtopics) ? w.subtopics : [],
      specificOutcomes: isStringArray(w.specificOutcomes) ? w.specificOutcomes : [],
      keyCompetencies: isStringArray(w.keyCompetencies) ? w.keyCompetencies : [],
      values: isStringArray(w.values) ? w.values : [],
      teachingLearningActivities: isStringArray(w.teachingLearningActivities) ?
        w.teachingLearningActivities : [],
      materials: isStringArray(w.materials) ? w.materials : [],
      assessment: isNonEmptyString(w.assessment) ? w.assessment : "",
      references: isNonEmptyString(w.references) ? w.references : "",
    }));

  if (weeks.length === 0) {
    errors.push("The scheme has no weeks.");
  }

  return errors.length === 0 ?
    {ok: true, value: {schemaVersion: SCHEMA_VERSION, header, overview, weeks}} :
    {ok: false, errors, value: {schemaVersion: SCHEMA_VERSION, header, overview, weeks}};
}

module.exports = {SCHEMA_VERSION, validateSchemeOfWork};
