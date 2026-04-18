import { useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import {
  generateLessonPlan,
  TEACHER_GRADES,
  TEACHER_SUBJECTS,
  TEACHER_LANGUAGES,
  DURATION_PRESETS,
} from '../../../utils/teacherTools'
import { downloadLessonPlanDocx } from '../../../utils/lessonPlanToDocx'
import { printLessonPlanAsPdf } from '../../../utils/lessonPlanToPdf'

/**
 * Zambian CBC Lesson Plan Generator — teacher-facing MVP.
 *
 * Two-column layout: inputs on the left, generated plan on the right.
 * On mobile the columns stack.
 */
export default function LessonPlanGenerator() {
  const { userProfile } = useAuth()
  const [form, setForm] = useState({
    grade: 'G5',
    subject: 'mathematics',
    topic: '',
    subtopic: '',
    durationMinutes: 40,
    language: 'english',
    teacherName: userProfile?.displayName || userProfile?.fullName || '',
    school: userProfile?.schoolName || '',
    numberOfPupils: 40,
    instructions: '',
  })
  const [status, setStatus] = useState('idle') // idle | generating | success | error
  const [errorMessage, setErrorMessage] = useState('')
  const [errorDetail, setErrorDetail] = useState('')
  const [lessonPlan, setLessonPlan] = useState(null)
  const [generationId, setGenerationId] = useState(null)
  const [usage, setUsage] = useState(null)
  const [warning, setWarning] = useState('')

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onGenerate(e) {
    e.preventDefault()
    if (!form.topic.trim()) {
      setErrorMessage('Please enter a topic.')
      setStatus('error')
      return
    }
    setStatus('generating')
    setErrorMessage('')
    setErrorDetail('')
    setWarning('')
    setLessonPlan(null)

    const res = await generateLessonPlan(form)
    if (!res.ok) {
      setStatus('error')
      setErrorMessage(res.error)
      setErrorDetail(
        [res.code && `code: ${res.code}`, res.rawMessage && `detail: ${res.rawMessage}`]
          .filter(Boolean)
          .join(' · '),
      )
      return
    }
    setLessonPlan(res.data.lessonPlan)
    setGenerationId(res.data.generationId)
    setUsage(res.data.usage)
    setWarning(res.data.warning || '')
    setStatus('success')
  }

  function onExportDocx() {
    if (!lessonPlan) return
    const filename = buildFilename(form, lessonPlan)
    downloadLessonPlanDocx(lessonPlan, filename)
  }

  function onExportPdf() {
    if (!lessonPlan) return
    try {
      const titleForDoc = lessonPlan.header?.topic
        ? `CBC Lesson Plan — ${lessonPlan.header.topic}`
        : 'CBC Lesson Plan'
      printLessonPlanAsPdf(lessonPlan, titleForDoc)
    } catch (err) {
      // The helper only throws when popups are blocked — surface that
      // message inline via the existing error state.
      setErrorMessage(err?.message || 'Could not open the print window.')
      setStatus('success') // keep the plan visible; we're just flagging the popup
      setErrorDetail('')
      // Use a transient warning banner instead of the full error state
      setWarning(err?.message || 'Could not open the print window.')
    }
  }

  return (
    <div className="min-h-screen theme-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black theme-text">
            Lesson Plan Generator
          </h1>
          <p className="text-sm theme-text-secondary mt-1">
            Zambian CBC format — Specific Outcomes, Key Competencies, Values,
            three-phase body, Assessment, Differentiation.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          {/* ── Input panel ─────────────────────────────────────── */}
          <form
            onSubmit={onGenerate}
            className="theme-card border theme-border rounded-2xl p-5 space-y-4 h-fit sticky top-4"
          >
            <FieldSelect
              label="Grade"
              value={form.grade}
              options={TEACHER_GRADES}
              onChange={(v) => updateField('grade', v)}
            />
            <FieldSelect
              label="Subject"
              value={form.subject}
              options={TEACHER_SUBJECTS}
              onChange={(v) => updateField('subject', v)}
            />
            <FieldText
              label="Topic *"
              placeholder="e.g. Fractions"
              value={form.topic}
              onChange={(v) => updateField('topic', v)}
              maxLength={120}
            />
            <FieldText
              label="Sub-topic (optional)"
              placeholder="e.g. Adding Fractions with Unlike Denominators"
              value={form.subtopic}
              onChange={(v) => updateField('subtopic', v)}
              maxLength={160}
            />
            <FieldSelect
              label="Lesson duration"
              value={String(form.durationMinutes)}
              options={DURATION_PRESETS.map((p) => ({
                value: String(p.value),
                label: p.label,
              }))}
              onChange={(v) => updateField('durationMinutes', Number(v))}
            />
            <FieldSelect
              label="Medium of instruction"
              value={form.language}
              options={TEACHER_LANGUAGES}
              onChange={(v) => updateField('language', v)}
            />
            <div className="grid grid-cols-2 gap-3">
              <FieldNumber
                label="# of pupils"
                value={form.numberOfPupils}
                onChange={(v) => updateField('numberOfPupils', v)}
                min={1}
                max={200}
              />
              <FieldText
                label="School"
                placeholder="School name"
                value={form.school}
                onChange={(v) => updateField('school', v)}
                maxLength={120}
              />
            </div>
            <FieldText
              label="Teacher name"
              placeholder="Mr / Mrs ..."
              value={form.teacherName}
              onChange={(v) => updateField('teacherName', v)}
              maxLength={80}
            />
            <FieldTextarea
              label="Extra instructions (optional)"
              placeholder="e.g. Include a group activity. Emphasise real-life market examples."
              value={form.instructions}
              onChange={(v) => updateField('instructions', v)}
              maxLength={500}
            />

            <button
              type="submit"
              disabled={status === 'generating'}
              className="w-full py-3 rounded-xl font-black text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {status === 'generating' ? 'Generating…' : '✨ Generate Lesson Plan'}
            </button>

            {usage && (
              <div className="text-xs theme-text-secondary text-center">
                {usage.used}/{usage.limit} used on the{' '}
                <span className="font-bold capitalize">{usage.plan}</span> plan this month
              </div>
            )}
          </form>

          {/* ── Output panel ────────────────────────────────────── */}
          <section className="theme-card border theme-border rounded-2xl p-5 min-h-[400px]">
            {status === 'idle' && (
              <EmptyState />
            )}
            {status === 'generating' && (
              <GeneratingState />
            )}
            {status === 'error' && (
              <ErrorState
                message={errorMessage}
                detail={errorDetail}
                onDismiss={() => setStatus('idle')}
              />
            )}
            {status === 'success' && lessonPlan && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-lg font-black theme-text">Your Lesson Plan</h2>
                    <p className="text-xs theme-text-secondary">
                      Review, edit in your document editor, and print for your head teacher.
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={onExportPdf}
                      title="Opens the system print dialog — choose 'Save as PDF' as the destination"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black border theme-border theme-card theme-text transition-all duration-fast ease-out shadow-elev-sm hover:-translate-y-px hover:border-[var(--accent)] hover:shadow-elev-md"
                    >
                      📑 Download PDF
                    </button>
                    <button
                      onClick={onExportDocx}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black border theme-border theme-card theme-text transition-all duration-fast ease-out shadow-elev-sm hover:-translate-y-px hover:border-[var(--accent)] hover:shadow-elev-md"
                    >
                      📄 Download .docx
                    </button>
                    <button
                      onClick={() => setStatus('idle')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-elev-sm shadow-elev-inner-hl transition-all duration-fast ease-out hover:-translate-y-px hover:shadow-elev-md"
                    >
                      ✨ Generate Another
                    </button>
                  </div>
                </div>
                {warning && (
                  <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm">
                    ⚠️ {warning}
                  </div>
                )}
                <LessonPlanView plan={lessonPlan} />
                {generationId && (
                  <div className="mt-6 text-xs theme-text-secondary">
                    Saved as generation <code>{generationId}</code>. Visit your Library to find it again.
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

/* ── Small input components ─────────────────────────────────────── */

function FieldLabel({ children }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wide theme-text-secondary mb-1">
      {children}
    </label>
  )
}

function FieldText({ label, value, onChange, placeholder, maxLength }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-3 py-2 rounded-lg border theme-border bg-transparent theme-text focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  )
}

function FieldNumber({ label, value, onChange, min, max }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        className="w-full px-3 py-2 rounded-lg border theme-border bg-transparent theme-text focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  )
}

function FieldTextarea({ label, value, onChange, placeholder, maxLength }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={3}
        className="w-full px-3 py-2 rounded-lg border theme-border bg-transparent theme-text focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
      />
    </div>
  )
}

function FieldSelect({ label, value, options, onChange }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border theme-border bg-transparent theme-text focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

/* ── State views ────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
      <div className="text-5xl mb-3">📝</div>
      <h3 className="text-lg font-black theme-text mb-1">Ready when you are</h3>
      <p className="text-sm theme-text-secondary max-w-md">
        Fill in the grade, subject and topic on the left, then tap Generate.
        Your lesson plan will appear here — fully formatted in the Zambian CBC style.
      </p>
    </div>
  )
}

function GeneratingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
      <div className="text-5xl mb-3 animate-bounce">🧠</div>
      <h3 className="text-lg font-black theme-text mb-1">Writing your lesson plan…</h3>
      <p className="text-sm theme-text-secondary max-w-md">
        Usually takes 15–30 seconds. Please don't refresh the page.
      </p>
    </div>
  )
}

function ErrorState({ message, detail, onDismiss }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
      <div className="text-5xl mb-3">⚠️</div>
      <h3 className="text-lg font-black theme-text mb-1">Something went wrong</h3>
      <p className="text-sm theme-text-secondary max-w-md mb-3">{message}</p>
      {detail && (
        <p className="text-xs theme-text-secondary/70 max-w-md mb-4 font-mono break-all px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800">
          {detail}
        </p>
      )}
      <button
        onClick={onDismiss}
        className="px-4 py-2 rounded-xl text-sm font-bold border theme-border"
      >
        Try again
      </button>
      <p className="text-[10px] theme-text-secondary/60 mt-4 max-w-md">
        See DEBUG_LESSON_PLAN.md in your project root for the diagnostic checklist.
      </p>
    </div>
  )
}

/* ── Rendered lesson plan ───────────────────────────────────────── */

function LessonPlanView({ plan }) {
  return (
    <article className="space-y-6 print:space-y-4">
      <HeaderBlock header={plan.header} />
      <Section title="Specific Outcomes">
        <OrderedList items={plan.specificOutcomes} />
      </Section>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniSection title="Key Competencies" items={plan.keyCompetencies} />
        <MiniSection title="Values" items={plan.values} />
        <MiniSection title="Prerequisite Knowledge" items={plan.prerequisiteKnowledge} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MiniSection
          title="Teaching / Learning Materials"
          items={plan.teachingLearningMaterials}
        />
        <ReferencesBlock refs={plan.references} />
      </div>
      <Section title="Lesson Development">
        <PhaseBlock
          phase="Introduction"
          minutes={plan.lessonDevelopment?.introduction?.durationMinutes}
          teacher={plan.lessonDevelopment?.introduction?.teacherActivities}
          pupils={plan.lessonDevelopment?.introduction?.pupilActivities}
        />
        {(plan.lessonDevelopment?.development || []).map((step) => (
          <PhaseBlock
            key={step.stepNumber}
            phase={`Development — Step ${step.stepNumber}: ${step.title}`}
            minutes={step.durationMinutes}
            teacher={step.teacherActivities}
            pupils={step.pupilActivities}
          />
        ))}
        <PhaseBlock
          phase="Conclusion"
          minutes={plan.lessonDevelopment?.conclusion?.durationMinutes}
          teacher={plan.lessonDevelopment?.conclusion?.teacherActivities}
          pupils={plan.lessonDevelopment?.conclusion?.pupilActivities}
        />
      </Section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Assessment">
          <div className="space-y-3">
            <div>
              <h4 className="font-bold text-sm mb-1">Formative</h4>
              <UnorderedList items={plan.assessment?.formative} />
            </div>
            {plan.assessment?.summative?.description && (
              <div>
                <h4 className="font-bold text-sm mb-1">Summative</h4>
                <p className="text-sm theme-text">{plan.assessment.summative.description}</p>
                {plan.assessment.summative.successCriteria && (
                  <p className="text-xs theme-text-secondary mt-1">
                    <span className="font-bold">Success criteria: </span>
                    {plan.assessment.summative.successCriteria}
                  </p>
                )}
              </div>
            )}
          </div>
        </Section>
        <Section title="Differentiation">
          <div className="space-y-3">
            <div>
              <h4 className="font-bold text-sm mb-1">For struggling pupils</h4>
              <UnorderedList items={plan.differentiation?.forStruggling} />
            </div>
            <div>
              <h4 className="font-bold text-sm mb-1">For advanced pupils</h4>
              <UnorderedList items={plan.differentiation?.forAdvanced} />
            </div>
          </div>
        </Section>
      </div>
      {plan.homework?.description && (
        <Section title="Homework">
          <p className="text-sm theme-text">{plan.homework.description}</p>
          {plan.homework.estimatedMinutes > 0 && (
            <p className="text-xs theme-text-secondary mt-1">
              Estimated time: {plan.homework.estimatedMinutes} minutes
            </p>
          )}
        </Section>
      )}
      <Section title="Teacher's Reflection (fill in after teaching)">
        <div className="text-sm theme-text-secondary italic">
          — What went well? What will you improve next time? Which pupils need follow-up?
        </div>
      </Section>
    </article>
  )
}

function HeaderBlock({ header = {} }) {
  const rows = [
    ['School', header.school],
    ['Teacher', header.teacherName],
    ['Date', header.date],
    ['Time', header.time],
    ['Duration', header.durationMinutes ? `${header.durationMinutes} min` : ''],
    ['Class', header.class],
    ['Subject', header.subject],
    ['Topic', header.topic],
    ['Sub-topic', header.subtopic],
    ['Term & Week', header.termAndWeek],
    ['Number of Pupils', header.numberOfPupils],
    ['Medium', header.mediumOfInstruction],
  ].filter(([, v]) => v !== undefined && v !== null && v !== '')

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
    <div>
      <h3 className="text-base font-black theme-text mb-2 border-b theme-border pb-1">
        {title}
      </h3>
      {children}
    </div>
  )
}

function MiniSection({ title, items }) {
  return (
    <div className="rounded-xl border theme-border p-3">
      <h4 className="font-bold text-sm mb-2 theme-text">{title}</h4>
      <UnorderedList items={items} />
    </div>
  )
}

function OrderedList({ items }) {
  if (!items?.length) return <p className="text-sm theme-text-secondary italic">—</p>
  return (
    <ol className="list-decimal list-inside space-y-1 text-sm theme-text">
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ol>
  )
}

function UnorderedList({ items }) {
  if (!items?.length) return <p className="text-sm theme-text-secondary italic">—</p>
  return (
    <ul className="list-disc list-inside space-y-1 text-sm theme-text">
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  )
}

function ReferencesBlock({ refs }) {
  return (
    <div className="rounded-xl border theme-border p-3">
      <h4 className="font-bold text-sm mb-2 theme-text">References</h4>
      {!refs?.length ? (
        <p className="text-sm theme-text-secondary italic">—</p>
      ) : (
        <ul className="space-y-1 text-sm theme-text">
          {refs.map((r, i) => (
            <li key={i}>
              <span className="font-bold">{r.title}</span>
              {r.publisher && <span> — {r.publisher}</span>}
              {r.pages && <span className="theme-text-secondary"> (pp. {r.pages})</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PhaseBlock({ phase, minutes, teacher = [], pupils = [] }) {
  return (
    <div className="rounded-xl border theme-border overflow-hidden mb-3">
      <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b theme-border flex justify-between">
        <h4 className="font-bold text-sm theme-text">{phase}</h4>
        {minutes != null && (
          <span className="text-xs theme-text-secondary">{minutes} min</span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x theme-border">
        <div className="p-3">
          <h5 className="text-xs uppercase font-bold theme-text-secondary mb-2">
            Teacher's Activities
          </h5>
          <UnorderedList items={teacher} />
        </div>
        <div className="p-3">
          <h5 className="text-xs uppercase font-bold theme-text-secondary mb-2">
            Pupils' Activities
          </h5>
          <UnorderedList items={pupils} />
        </div>
      </div>
    </div>
  )
}

/* ── Helpers ────────────────────────────────────────────────────── */

function buildFilename(form, plan) {
  const slug = (s) => String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  const parts = [
    slug(form.teacherName || 'teacher'),
    slug(form.grade),
    slug(form.subject),
    slug(plan?.header?.topic || form.topic),
    new Date().toISOString().slice(0, 10),
  ].filter(Boolean)
  return `${parts.join('_')}.docx`
}
