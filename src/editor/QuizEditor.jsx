import { useState, useCallback } from 'react'
import RichEditor     from './components/RichEditor.jsx'
import AnswerOptions  from './components/AnswerOptions.jsx'
import QuizPreview    from './components/QuizPreview.jsx'
import { migrateQuestion } from './utils/migration.js'
import './editor.css'

const QUESTION_TYPES = [
  { v: 'mcq',   l: 'Multiple Choice' },
  { v: 'tf',    l: 'True / False' },
  { v: 'short', l: 'Short Answer' },
  { v: 'fill',  l: 'Fill in the Blank' },
]

const DIFFICULTIES = [
  { v: 'easy',   l: 'Easy' },
  { v: 'medium', l: 'Medium' },
  { v: 'hard',   l: 'Hard' },
]

function newQuestion() {
  return {
    id:           `q_${Date.now()}`,
    type:         'mcq',
    topic:        '',
    marks:        2,
    difficulty:   'medium',
    instructions: null,
    passage:      null,
    questionText: null,
    explanation:  null,
    options:      ['', '', '', ''],
    correct:      0,
    contentVersion: 2,
  }
}

export default function QuizEditor({ question = null, onSave, onCancel, className = '' }) {
  const [q, setQ] = useState(() =>
    question ? migrateQuestion(question) : newQuestion()
  )
  const [tab,   setTab]   = useState('editor')
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState('')

  const set = useCallback((key, value) => {
    setQ((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = useCallback(() => {
    if (!q.questionText) {
      setToast('⚠ Please write the question text before saving.')
      setTimeout(() => setToast(''), 3000)
      return
    }
    const payload = { ...q, contentVersion: 2 }
    onSave?.(payload)
    setSaved(true)
    setToast('✓ Question saved')
    setTimeout(() => { setSaved(false); setToast('') }, 2500)
  }, [q, onSave])

  return (
    <div className={`qe-page ${className}`}>
      <div className="qe-body">

        <div className="card">
          <div className="card-hd">
            <span className="card-title">Question Settings</span>
          </div>
          <div className="card-body">
            <div className="qe-row">
              <div className="qe-field" style={{ flex: 2 }}>
                <label className="qe-lbl">Topic / Strand</label>
                <input
                  className="qe-inp"
                  value={q.topic}
                  placeholder="e.g. Fractions, Algebra…"
                  onChange={(e) => set('topic', e.target.value)}
                />
              </div>
              <div className="qe-field">
                <label className="qe-lbl">Question Type</label>
                <select
                  className="qe-sel"
                  value={q.type}
                  onChange={(e) => set('type', e.target.value)}
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t.v} value={t.v}>{t.l}</option>
                  ))}
                </select>
              </div>
              <div className="qe-field">
                <label className="qe-lbl">Difficulty</label>
                <select
                  className="qe-sel"
                  value={q.difficulty}
                  onChange={(e) => set('difficulty', e.target.value)}
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d.v} value={d.v}>{d.l}</option>
                  ))}
                </select>
              </div>
              <div className="qe-field">
                <label className="qe-lbl">
                  Marks<span className="rstar">*</span>
                </label>
                <input
                  className="qe-inp"
                  type="number"
                  min={1}
                  max={20}
                  value={q.marks}
                  onChange={(e) => set('marks', Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="qe-tabs">
          {[
            ['editor',  '✏️  Editor'],
            ['preview', '👁  Preview'],
          ].map(([v, l]) => (
            <button
              key={v}
              className={`qe-tab${tab === v ? ' on' : ''}`}
              onClick={() => setTab(v)}
            >
              {l}
            </button>
          ))}
        </div>

        {tab === 'editor' && (
          <>
            <div className="card">
              <div className="card-hd">
                <span className="card-title">📋 Instructions</span>
                <span className="cbadge bopt">Optional</span>
              </div>
              <div className="card-body">
                <RichEditor
                  initialContent={q.instructions}
                  onChange={(json) => set('instructions', json)}
                  placeholder="e.g. Read the passage carefully and answer the question that follows."
                  minHeight={60}
                />
              </div>
            </div>

            <div className="card">
              <div className="card-hd">
                <span className="card-title">📖 Passage / Story</span>
                <span className="cbadge bopt">Optional</span>
              </div>
              <div className="card-body">
                <RichEditor
                  initialContent={q.passage}
                  onChange={(json) => set('passage', json)}
                  placeholder="Paste or write the reading passage here. Supports formatting, tables, and math."
                  minHeight={120}
                />
              </div>
            </div>

            <div className="card">
              <div className="card-hd">
                <span className="card-title">❓ Question Text</span>
                <span className="cbadge breq">Required</span>
              </div>
              <div className="card-body">
                <RichEditor
                  initialContent={q.questionText}
                  onChange={(json) => set('questionText', json)}
                  placeholder="Write the question here. Click ∑ Math to insert fractions, powers, roots, symbols…"
                  minHeight={90}
                />
              </div>
            </div>

            {(q.type === 'mcq' || q.type === 'tf') && (
              <div className="card">
                <div className="card-hd">
                  <span className="card-title">☑ Answer Options</span>
                </div>
                <div className="card-body">
                  <AnswerOptions
                    isTF={q.type === 'tf'}
                    options={q.options}
                    correct={q.correct}
                    onChange={(opts) => set('options', opts)}
                    onCorrect={(i) => set('correct', i)}
                  />
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-hd">
                <span className="card-title">💡 Explanation / Model Answer</span>
                <span className="cbadge bafter">Shown after attempt</span>
              </div>
              <div className="card-body">
                <RichEditor
                  initialContent={q.explanation}
                  onChange={(json) => set('explanation', json)}
                  placeholder="Explain the correct answer with step-by-step working. Use ∑ Math freely."
                  minHeight={100}
                />
              </div>
            </div>
          </>
        )}

        {tab === 'preview' && <QuizPreview question={q} />}

        <div className="savebar">
          <span className={`savestatus${saved ? ' saveok' : ''}`}>
            {saved ? '✓ Saved successfully' : `ID: ${q.id}`}
          </span>
          {onCancel && (
            <button type="button" className="btn btn-s" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="button" className="btn btn-ok" onClick={handleSave}>
            {saved ? '✓ Saved' : '💾 Save Question'}
          </button>
        </div>

        {toast && <div className="qe-toast" role="alert">{toast}</div>}
      </div>
    </div>
  )
}
