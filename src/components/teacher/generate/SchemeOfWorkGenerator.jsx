import { useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import {
  generateSchemeOfWork,
  TEACHER_GRADES,
  TEACHER_SUBJECTS,
  TEACHER_LANGUAGES,
  SCHEME_TERMS,
  SCHEME_WEEK_COUNTS,
} from '../../../utils/teacherTools'
import { downloadSchemeOfWorkDocx } from '../../../utils/schemeOfWorkToDocx'
import SchemeOfWorkView from '../views/SchemeOfWorkView'
import { useFormDefaultsFromUrl } from '../../../utils/useFormDefaultsFromUrl'

export default function SchemeOfWorkGenerator() {
  const { userProfile } = useAuth()
  const urlDefaults = useFormDefaultsFromUrl()
  const [form, setForm] = useState(() => ({
    grade: 'G5',
    subject: 'mathematics',
    term: 1,
    numberOfWeeks: 12,
    language: 'english',
    teacherName: userProfile?.displayName || userProfile?.fullName || '',
    school: userProfile?.schoolName || '',
    instructions: '',
    ...urlDefaults,
  }))
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [errorDetail, setErrorDetail] = useState('')
  const [scheme, setScheme] = useState(null)
  const [generationId, setGenerationId] = useState(null)
  const [usage, setUsage] = useState(null)
  const [warning, setWarning] = useState('')

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onGenerate(e) {
    e.preventDefault()
    setStatus('generating')
    setErrorMessage('')
    setErrorDetail('')
    setWarning('')
    setScheme(null)

    const res = await generateSchemeOfWork(form)
    if (!res.ok) {
      setStatus('error')
      setErrorMessage(res.error)
      setErrorDetail(
        [res.code && `code: ${res.code}`, res.rawMessage && `detail: ${res.rawMessage}`]
          .filter(Boolean).join(' · '),
      )
      return
    }
    setScheme(res.data.schemeOfWork)
    setGenerationId(res.data.generationId)
    setUsage(res.data.usage)
    setWarning(res.data.warning || '')
    setStatus('success')
  }

  function onExportDocx() {
    if (!scheme) return
    const slug = (s) => String(s || '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
    const parts = [
      slug(form.teacherName || 'teacher'),
      slug(form.grade),
      slug(form.subject),
      `term${form.term}`,
      new Date().toISOString().slice(0, 10),
    ].filter(Boolean)
    downloadSchemeOfWorkDocx(scheme, `${parts.join('_')}_scheme-of-work.docx`)
  }

  return (
    <div className="min-h-screen theme-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black theme-text">
            Scheme of Work Generator
          </h1>
          <p className="text-sm theme-text-secondary mt-1">
            Term-level Zambian CBC plan — week-by-week topics, outcomes, activities, and assessment.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
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
            <FieldSelect
              label="Term"
              value={String(form.term)}
              options={SCHEME_TERMS.map((t) => ({ value: String(t.value), label: t.label }))}
              onChange={(v) => updateField('term', Number(v))}
            />
            <FieldSelect
              label="Number of weeks"
              value={String(form.numberOfWeeks)}
              options={SCHEME_WEEK_COUNTS.map((p) => ({ value: String(p.value), label: p.label }))}
              onChange={(v) => updateField('numberOfWeeks', Number(v))}
            />
            <FieldSelect
              label="Language"
              value={form.language}
              options={TEACHER_LANGUAGES}
              onChange={(v) => updateField('language', v)}
            />
            <FieldText
              label="School"
              placeholder="School name"
              value={form.school}
              onChange={(v) => updateField('school', v)}
              maxLength={120}
            />
            <FieldText
              label="Teacher name"
              placeholder="Mr / Mrs ..."
              value={form.teacherName}
              onChange={(v) => updateField('teacherName', v)}
              maxLength={80}
            />
            <FieldTextarea
              label="Extra instructions (optional)"
              placeholder="e.g. Emphasise revision in the last two weeks. Include a mock exam in Week 11."
              value={form.instructions}
              onChange={(v) => updateField('instructions', v)}
              maxLength={500}
            />

            <button
              type="submit"
              disabled={status === 'generating'}
              className="w-full py-3 rounded-xl font-black text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {status === 'generating' ? 'Generating…' : '🗓️ Generate Scheme of Work'}
            </button>

            {usage && (
              <div className="text-xs theme-text-secondary text-center">
                {usage.used}/{usage.limit} schemes used on the{' '}
                <span className="font-bold capitalize">{usage.plan}</span> plan this month
              </div>
            )}
          </form>

          <section className="theme-card border theme-border rounded-2xl p-5 min-h-[400px]">
            {status === 'idle' && <EmptyState />}
            {status === 'generating' && <GeneratingState />}
            {status === 'error' && (
              <ErrorState
                message={errorMessage}
                detail={errorDetail}
                onDismiss={() => setStatus('idle')}
              />
            )}
            {status === 'success' && scheme && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-lg font-black theme-text">Your Scheme of Work</h2>
                    <p className="text-xs theme-text-secondary">
                      {scheme.header?.numberOfWeeks || scheme.weeks?.length} weeks · Term {scheme.header?.term}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={onExportDocx}
                      className="px-4 py-2 rounded-xl text-sm font-bold border theme-border hover:bg-slate-50 transition"
                    >
                      📄 Download .docx (landscape)
                    </button>
                    <button
                      onClick={() => setStatus('idle')}
                      className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-500"
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
                <SchemeOfWorkView scheme={scheme} />
                {generationId && (
                  <div className="mt-6 text-xs theme-text-secondary">
                    Saved as generation <code>{generationId}</code>.
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

/* ── Input components (same as other generators) ────────────── */

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
        className="w-full px-3 py-2 rounded-lg border theme-border bg-transparent theme-text focus:outline-none focus:ring-2 focus:ring-teal-500"
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
        className="w-full px-3 py-2 rounded-lg border theme-border bg-transparent theme-text focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
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
        className="w-full px-3 py-2 rounded-lg border theme-border bg-transparent theme-text focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

/* ── States ─────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
      <div className="text-5xl mb-3">🗓️</div>
      <h3 className="text-lg font-black theme-text mb-1">Plan a whole term at once</h3>
      <p className="text-sm theme-text-secondary max-w-md">
        Pick grade, subject, and term. You'll get a full week-by-week scheme of
        work with topics, outcomes, activities, and assessment — ready to print
        for your head teacher.
      </p>
    </div>
  )
}

function GeneratingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
      <div className="text-5xl mb-3 animate-bounce">📅</div>
      <h3 className="text-lg font-black theme-text mb-1">Planning your term…</h3>
      <p className="text-sm theme-text-secondary max-w-md">
        This is a bigger job — usually 30–60 seconds for a full 12-week scheme.
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
        <p className="text-xs theme-text-secondary/70 max-w-md mb-4 font-mono break-all px-3 py-2 rounded-lg bg-slate-100">
          {detail}
        </p>
      )}
      <button onClick={onDismiss} className="px-4 py-2 rounded-xl text-sm font-bold border theme-border">
        Try again
      </button>
    </div>
  )
}
