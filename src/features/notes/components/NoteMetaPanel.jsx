// src/features/notes/components/NoteMetaPanel.jsx
//
// The meta strip at the top of the editor: title, subject, grade, term, week.
// Subject options are filtered by grade band so primary teachers only see
// primary subjects, and so on.

import { getActiveGrades, getSubjectsForGrade } from '../../../config/curriculum'

export function NoteMetaPanel({
  title, onTitleChange,
  subject, onSubjectChange,
  grade,   onGradeChange,
  term,    onTermChange,
  week,    onWeekChange,
}) {
  const activeGrades = getActiveGrades()
  const subjectsForGrade = getSubjectsForGrade(grade)

  // If the current subject isn't valid for the chosen grade, blank it out
  // so the teacher consciously picks a new one.
  const subjectValid = subjectsForGrade.includes(subject)

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 mb-4">
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Note title…"
        className="w-full font-display text-3xl md:text-4xl tracking-tight bg-transparent border-none outline-none mb-4 text-neutral-900 placeholder:text-neutral-300"
      />

      <div className="flex flex-wrap gap-3">
        <Field label="Grade">
          <select
            value={grade}
            onChange={(e) => onGradeChange(Number(e.target.value))}
            className="text-sm bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
          >
            {activeGrades.map(g => (
              <option key={g.value} value={g.value}>Grade {g.value}</option>
            ))}
          </select>
        </Field>

        <Field label="Subject">
          <select
            value={subjectValid ? subject : ''}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="text-sm bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="" disabled>Choose a subject…</option>
            {subjectsForGrade.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>

        <Field label="Term">
          <select
            value={term ?? ''}
            onChange={(e) => onTermChange(e.target.value === '' ? null : Number(e.target.value))}
            className="text-sm bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="">— optional —</option>
            <option value="1">Term 1</option>
            <option value="2">Term 2</option>
            <option value="3">Term 3</option>
          </select>
        </Field>

        <Field label="Week">
          <select
            value={week ?? ''}
            onChange={(e) => onWeekChange(e.target.value === '' ? null : Number(e.target.value))}
            className="text-sm bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="">— optional —</option>
            {Array.from({ length: 14 }, (_, i) => i + 1).map(w => (
              <option key={w} value={w}>Week {w}</option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] tracking-[0.15em] uppercase text-neutral-500">{label}</span>
      {children}
    </div>
  )
}
