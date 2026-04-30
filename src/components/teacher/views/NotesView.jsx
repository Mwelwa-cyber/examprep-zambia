import { Link } from 'react-router-dom'

/**
 * Read-only rendering of a validated teacher-notes JSON object.
 * Shared by the Notes Studio and the Library detail view.
 */
export default function NotesView({ notes }) {
  if (!notes) return null

  return (
    <article className="space-y-6 print:space-y-4">
      <HeaderBlock header={notes.header} />

      {notes.header?.lessonPlanId && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
          <p className="font-bold text-emerald-900 mb-0.5">📘 Built from a lesson plan</p>
          <p className="text-emerald-800 text-xs">
            These notes use your saved lesson plan as their backbone — same SMART goal, same competencies.{' '}
            <Link
              to={`/teacher/library/${notes.header.lessonPlanId}`}
              className="underline font-bold"
            >
              Open the source plan
            </Link>
          </p>
        </div>
      )}

      <Section title="Lesson Opener">
        <SubsectionGrid>
          <Subsection label="Hook">
            <Paragraph text={notes.introduction?.hook} />
          </Subsection>
          <Subsection label="Why it matters">
            <Paragraph text={notes.introduction?.whyItMatters} />
          </Subsection>
          <Subsection label="Prior knowledge">
            <Paragraph text={notes.introduction?.priorKnowledge} />
          </Subsection>
        </SubsectionGrid>
      </Section>

      {notes.keyConcepts?.length > 0 && (
        <Section title="Key Concepts">
          <ol className="space-y-3 list-none pl-0">
            {notes.keyConcepts.map((c, i) => (
              <li key={i} className="rounded-xl border theme-border p-4">
                <p className="font-black text-sm theme-text mb-1">
                  {i + 1}. {c.name}
                </p>
                <p className="text-sm theme-text leading-relaxed">{c.explanation}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {notes.workedExamples?.length > 0 && (
        <Section title="Worked Examples">
          <div className="space-y-3">
            {notes.workedExamples.map((w, i) => (
              <div key={i} className="rounded-xl border theme-border p-4">
                <p className="text-xs font-black uppercase tracking-wide theme-text-secondary mb-1">
                  Example {i + 1}
                </p>
                <p className="text-sm font-bold theme-text mb-2">{w.problem}</p>
                {w.steps?.length > 0 && (
                  <ol className="list-decimal list-inside space-y-1 text-sm theme-text mb-2 ml-2">
                    {w.steps.map((s, j) => <li key={j}>{s}</li>)}
                  </ol>
                )}
                {w.answer && (
                  <p className="text-sm theme-text mt-2 pt-2 border-t theme-border">
                    <span className="font-black">Answer: </span>
                    {w.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {notes.studentQuestions?.length > 0 && (
        <Section title="Common Student Questions">
          <div className="space-y-2">
            {notes.studentQuestions.map((q, i) => (
              <details key={i} className="rounded-xl border theme-border p-3" open>
                <summary className="font-bold text-sm theme-text cursor-pointer">
                  ❓ {q.question}
                </summary>
                <p className="text-sm theme-text mt-2 leading-relaxed">{q.answer}</p>
              </details>
            ))}
          </div>
        </Section>
      )}

      {notes.misconceptions?.length > 0 && (
        <Section title="Misconceptions to Watch For">
          <div className="space-y-2">
            {notes.misconceptions.map((m, i) => (
              <div
                key={i}
                className="rounded-xl border-2 border-amber-200 bg-amber-50 p-3"
              >
                <p className="text-sm font-bold text-amber-900 mb-1">
                  ⚠️ {m.misconception}
                </p>
                <p className="text-sm text-amber-900">
                  <span className="font-black">Correction: </span>
                  {m.correction}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {(notes.discussionPrompts?.length > 0 || notes.quickChecks?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {notes.discussionPrompts?.length > 0 && (
            <MiniListSection title="Discussion Prompts" items={notes.discussionPrompts} icon="💬" />
          )}
          {notes.quickChecks?.length > 0 && (
            <MiniListSection title="Quick Checks" items={notes.quickChecks} icon="✅" />
          )}
        </div>
      )}

      {notes.glossary?.length > 0 && (
        <Section title="Glossary">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {notes.glossary.map((g, i) => (
              <div key={i} className="rounded-xl border theme-border p-3">
                <p className="font-bold text-sm theme-text">{g.term}</p>
                <p className="text-xs theme-text leading-relaxed mt-0.5">{g.definition}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {notes.references?.length > 0 && (
        <Section title="References">
          <ul className="list-disc list-inside space-y-1 text-sm theme-text">
            {notes.references.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </Section>
      )}
    </article>
  )
}

function HeaderBlock({ header = {} }) {
  const rows = [
    ['Title', header.title],
    ['Topic', header.topic],
    ['Sub-topic', header.subtopic],
    ['Grade', header.grade],
    ['Subject', formatSubject(header.subject)],
    ['Duration', header.durationMinutes ? `${header.durationMinutes} min` : ''],
    ['Medium', header.language],
    ['School', header.school],
    ['Teacher', header.teacherName],
  ].filter(([, v]) => v !== undefined && v !== null && v !== '')

  if (rows.length === 0) return null
  return (
    <div className="rounded-xl border theme-border overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([k, v], idx) => (
            <tr key={k} className={idx % 2 === 0 ? 'bg-slate-50/50 dark:bg-slate-900/20' : ''}>
              <th className="px-3 py-2 text-left font-bold theme-text w-1/3">{k}</th>
              <td className="px-3 py-2 theme-text">{String(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h3 className="text-base font-black theme-text mb-2 border-b theme-border pb-1">
        {title}
      </h3>
      {children}
    </section>
  )
}

function SubsectionGrid({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{children}</div>
}

function Subsection({ label, children }) {
  return (
    <div className="rounded-xl border theme-border p-3">
      <p className="text-[10px] font-black uppercase tracking-wide theme-text-secondary mb-1">
        {label}
      </p>
      {children}
    </div>
  )
}

function MiniListSection({ title, items, icon }) {
  return (
    <div className="rounded-xl border theme-border p-3">
      <p className="text-[10px] font-black uppercase tracking-wide theme-text-secondary mb-1">
        {icon} {title}
      </p>
      <ul className="list-disc list-inside space-y-1 text-sm theme-text">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  )
}

function Paragraph({ text }) {
  if (!text) return <p className="text-sm theme-text-secondary italic">—</p>
  return <p className="text-sm theme-text leading-relaxed">{text}</p>
}

function formatSubject(s) {
  return String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
