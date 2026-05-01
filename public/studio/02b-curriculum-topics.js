// Clean, easily-extensible curriculum topics map for the Lesson Plan Studio's
// Topic + Sub-topic dropdowns. Keyed by grade label exactly as it appears in
// the Class dropdown (e.g. "Grade 4"). When a grade is present here, it takes
// priority over the legacy hardcoded syllabi in 02-syllabus-new.js /
// 03-syllabus-old.js for populating the topic + subtopic <select>s.
//
// To add more topics: just add another grade key, then list its topics with
// their subtopics. No other file needs to change.
//
//   curriculumTopics["Grade 6"] = {
//     "Light": ["Reflection", "Refraction"],
//     ...
//   };

const curriculumTopics = {
  "Grade 4": {
    "The Human Body": [
      "Circulatory system",
      "Digestive system",
      "Sense organs"
    ],
    "Plants": [
      "Parts of a plant",
      "Uses of plants"
    ]
  },
  "Grade 5": {
    "Matter": [
      "States of matter",
      "Changes in matter"
    ]
  }
};

// Expose globally so 04-syllabus-router.js (loaded next) can read it.
window.curriculumTopics = curriculumTopics;
