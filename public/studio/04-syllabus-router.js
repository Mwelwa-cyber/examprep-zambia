// Active syllabus router — returns the right gradeLevel/subjects/topics based on version
function activeGradeLevel() { return syllabusVersion === 'old' ? oldGradeLevel : gradeLevel; }
function activeSubjectsByLevel() { return syllabusVersion === 'old' ? oldSubjectsByLevel : subjectsByLevel; }
function activeSyllabus() { return syllabusVersion === 'old' ? oldSyllabus : syllabus; }
function activeClassOptions() { return syllabusVersion === 'old' ? oldClassOptions : newClassOptions; }

// Populate the class dropdown based on active syllabus version
function populateClasses() {
  const sel = $('#f-class');
  const opts = activeClassOptions();
  const current = sel.value;
  // Default: Grade 4 (new) or Grade 5 (old, since old is mainly used for G5+)
  const defaultClass = syllabusVersion === 'old' ? 'Grade 5' : 'Grade 4';
  sel.innerHTML = opts.map(c => {
    const sel = c === current ? ' selected' : (current === '' && c === defaultClass ? ' selected' : '');
    return `<option${sel}>${esc(c)}</option>`;
  }).join('');
  // If previously selected class isn't in the new list, fall back to default
  if (!opts.includes(current)) {
    sel.value = opts.includes(defaultClass) ? defaultClass : opts[0];
  }
}

function updateSubjects() {
  const klass = $('#f-class').value;
  const level = activeGradeLevel()[klass];
  // Show every subject the curriculum lists for this level. Previously we
  // filtered out subjects without hardcoded topic data — but topics now
  // also come from the dynamic CBC KB, and the topic input is a free-text
  // <input list="..."> anyway, so an empty dropdown is harmless.
  const subjects = activeSubjectsByLevel()[level] || [];
  const sel = $('#f-subject');
  const current = sel.value;
  // For Lower Primary (new syllabus): split into 2 optgroups (official 3 learning areas vs individual components)
  let html;
  if (level === 'lp') {
    const areas = subjects.filter(s => s.includes('(Learning Area)'));
    const components = subjects.filter(s => !s.includes('(Learning Area)'));
    const opt = s => `<option value="${esc(s)}"${s === current ? ' selected' : ''}>${esc(s)}</option>`;
    html = `<optgroup label="Official Learning Areas (3)">${areas.map(opt).join('')}</optgroup>` +
           `<optgroup label="Individual Component Subjects">${components.map(opt).join('')}</optgroup>`;
  } else {
    html = subjects.map(s => `<option value="${esc(s)}"${s === current ? ' selected' : ''}>${esc(s)}</option>`).join('');
  }
  sel.innerHTML = html;
  if (!subjects.includes(current) && subjects.length) sel.value = subjects[0];
  updateTopics();
}

// Grade-aware lookup: syllabus[level][subject] can be either:
//   1. Grade-keyed: { 'G4': {topic: [...]}, 'G5': {...}, 'G6': {...} } — grade-specific
//   2. Mixed: { 'G4': {...}, '_all': {...} } — grade-specific + shared topics
//   3. Flat: { topic: [...] } — same for all grades in this level (backwards-compat)
function classToGradeTag(klass) {
  if (klass.startsWith('Grade ')) return 'G' + klass.slice(6);
  if (klass.startsWith('Form ')) return 'F' + klass.slice(5);
  return '';
}
function getTopicsForClass(level, subj, klass) {
  const syl = activeSyllabus();
  const block = (syl[level] && syl[level][subj]) || {};
  const gradeTag = classToGradeTag(klass);
  const isGradeKeyed = Object.keys(block).some(k => /^[GF]\d+$/.test(k) || k === '_all');
  if (!isGradeKeyed) return block;
  const merged = {};
  if (block['_all']) Object.assign(merged, block['_all']);
  if (block[gradeTag]) Object.assign(merged, block[gradeTag]);
  return merged;
}

// ---- Dynamic CBC KB bridge ----
//
// The hardcoded syllabus in 02-syllabus-new.js / 03-syllabus-old.js is
// incomplete (entire Grade 8/9 old-syllabus secondary curriculum is empty,
// plus a few language-subject gaps in primary). updateTopics() now consults
// the React-side bridge first — which queries the same Firestore CBC KB
// the React Lesson Plan Studio uses for AI grounding — and falls back to
// the hardcoded data when the KB has no entry for the (grade, subject)
// pair. Net effect: any topic admins add via the CbcKbAdmin admin UI
// shows up in the studio's topic + subtopic dropdowns automatically.

// Maps a static-studio class label (e.g. "Form 1", "Grade 8") to the
// canonical G-prefix grade ID the Firestore CBC KB stores. The KB only
// uses G1-G12; Form 1-5 are aliases for G8-G12 in the Zambian system.
function classToCbcGrade(klass) {
  if (klass.startsWith('Grade ')) return 'G' + klass.slice(6).trim();
  const formMap = { 'Form 1': 'G8', 'Form 2': 'G9', 'Form 3': 'G10', 'Form 4': 'G11', 'Form 5': 'G12' };
  return formMap[klass] || '';
}

// Maps the studio's display subject names to the snake_case IDs the CBC
// KB stores. Some are approximations (Literature in English → english,
// Additional Mathematics → mathematics) — the KB doesn't have separate
// entries for every secondary subject yet, so closely related ones share
// a base entry. When the KB returns nothing the router falls back to the
// hardcoded syllabus, so an inexact alias is strictly better than missing.
const SUBJECT_ALIAS = {
  'Mathematics': 'mathematics',
  'Additional Mathematics': 'mathematics',
  'Advanced Mathematics': 'mathematics',
  'Further Mathematics': 'mathematics',
  'English Language': 'english',
  'Literature in English': 'english',
  'Zambian Languages': 'zambian_language',
  'Integrated Science': 'integrated_science',
  'Environmental Science': 'environmental_science',
  'Science 5124': 'integrated_science',
  'Biology': 'biology',
  'Chemistry': 'chemistry',
  'Physics': 'physics',
  'Religious Education': 'religious_education',
  'Creative and Technology Studies': 'creative_and_technology_studies',
  'Social Studies': 'social_studies',
  'Physical Education and Sport': 'physical_education',
  'Physical Education': 'physical_education',
  'Civic Education': 'civic_education',
  'Computer Studies': 'technology_studies',
  'Computer Science': 'technology_studies',
  'Design and Technology': 'technology_studies',
  'Geography': 'geography',
  'History': 'history',
  'Home Management': 'home_economics',
  'Food and Nutrition': 'home_economics',
  'Fashion and Fabrics': 'home_economics',
  'Agricultural Science': 'integrated_science',
  'Art and Design': 'expressive_arts',
  'Music': 'expressive_arts',
  'Commerce': 'social_studies',
  'Principles of Accounts': 'social_studies',
  'Economics': 'social_studies',
};
function subjectToCbcSubject(name) {
  if (!name) return '';
  // Strip the "(Learning Area)" suffix used by Lower-Primary subject groups.
  const cleaned = String(name).replace(/\s*\(Learning Area\)\s*$/, '').trim();
  if (SUBJECT_ALIAS[cleaned]) return SUBJECT_ALIAS[cleaned];
  return cleaned.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// Cache of the topics map for the currently-selected (class, subject), so
// updateSubtopics() doesn't re-query Firestore on every keystroke.
// Populated by updateTopics().
let currentTopicsMap = {};

async function fetchTopicsForCurrentSelection() {
  const klass = $('#f-class').value;
  const level = activeGradeLevel()[klass];
  const subj = $('#f-subject').value;

  // Prefer the dynamic CBC KB. Bridge contract:
  //   - non-empty object → KB has data, use it.
  //   - empty object {}  → KB has no rows; fall through to hardcoded.
  //   - null             → fetch errored; fall through to hardcoded.
  if (typeof window.__studioFetchSyllabusTopics === 'function') {
    const grade = classToCbcGrade(klass);
    const subject = subjectToCbcSubject(subj);
    if (grade && subject) {
      const remote = await window.__studioFetchSyllabusTopics({ grade, subject });
      if (remote && Object.keys(remote).length > 0) return remote;
    }
  }
  return getTopicsForClass(level, subj, klass);
}

async function updateTopics() {
  currentTopicsMap = await fetchTopicsForCurrentSelection();
  $('#topic-list').innerHTML = Object.keys(currentTopicsMap)
    .map(t => `<option value="${esc(t)}"></option>`).join('');
  updateSubtopics();
}
function updateSubtopics() {
  const topic = $('#f-topic').value.trim();
  const subs = currentTopicsMap[topic] || [];
  $('#subtopic-list').innerHTML = subs.map(s => `<option value="${esc(s)}"></option>`).join('');
}

// Bind syllabus controls and seed the dropdowns. Runs on every React mount,
// since the <select> elements (#f-class, #f-subject) are fresh DOM each time
// and need to be re-populated.
function __studioInitSyllabus() {
  if (!$('#f-class')) return;

  document.querySelectorAll('#syllabus-toggle .seg').forEach(btn => {
    // Reflect the current syllabusVersion in the segmented toggle UI
    btn.classList.toggle('active', btn.dataset.version === syllabusVersion);
    btn.addEventListener('click', () => {
      const newVersion = btn.dataset.version;
      if (newVersion === syllabusVersion) return;
      syllabusVersion = newVersion;
      document.querySelectorAll('#syllabus-toggle .seg').forEach(b => b.classList.toggle('active', b === btn));
      populateClasses();
      updateSubjects();
    });
  });

  $('#f-class').addEventListener('change', updateSubjects);
  $('#f-subject').addEventListener('change', updateTopics);
  $('#f-topic').addEventListener('input', updateSubtopics);
  $('#f-topic').addEventListener('change', updateSubtopics);

  // Initial population
  populateClasses();
  updateSubjects();
}

window.__studioRebinders = window.__studioRebinders || [];
window.__studioRebinders.push(__studioInitSyllabus);
