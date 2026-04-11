import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFirestore } from '../../hooks/useFirestore'
import { useAuth } from '../../contexts/AuthContext'

const SUBJECTS = ['Mathematics', 'English', 'Science', 'Social Studies']
const GRADES   = ['5', '6', '7']
const TERMS    = ['1', '2', '3']

const FIELD  = 'w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none'
const SELECT = 'border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none'

function emptyQuestion() {
  return { text: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', topic: '', marks: 1, type: 'mcq' }
}

function QuestionCard({ q, qi, total, onChange, onRemove, onMove }) {
  function set(field, val) { onChange(qi, field, val) }
  function setOpt(oi, val) {
    const opts = [...q.options]
    opts[oi] = val
    onChange(qi, 'options', opts)
  }

  const isTF = q.type === 'truefalse'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
      {/* Card header */}
      <div className="flex items-center justify-between">
        <span className="bg-green-100 text-green-700 font-black text-xs px-3 py-1 rounded-full">Q{qi + 1} of {total}</span>
        <div className="flex items-center gap-2">
          <select value={q.type} onChange={e => {
            set('type', e.target.value)
            if (e.target.value === 'truefalse') {
              onChange(qi, 'options', ['True', 'False'])
              onChange(qi, 'correctAnswer', 0)
            } else if (q.options.length < 4) {
              onChange(qi, 'options', ['', '', '', ''])
            }
          }} className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:border-green-500 focus:outline-none">
            <option value="mcq">MCQ (4 options)</option>
            <option value="truefalse">True / False</option>
          </select>
          <button onClick={() => onMove(qi, -1)} disabled={qi === 0}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-sm min-h-0 bg-transparent shadow-none p-1">↑</button>
          <button onClick={() => onMove(qi, 1)} disabled={qi === total - 1}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-sm min-h-0 bg-transparent shadow-none p-1">↓</button>
          {total > 1 && (
            <button onClick={() => onRemove(qi)}
              className="text-red-400 hover:text-red-600 text-xs font-bold min-h-0 bg-transparent shadow-none p-1">✕</button>
          )}
        </div>
      </div>

      {/* Question text */}
      <textarea value={q.text} onChange={e => set('text', e.target.value)}
        placeholder="Write your question here…"
        rows={3}
        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none resize-none leading-relaxed" />

      {/* Options */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-500">Options — select the correct answer</p>
        {q.options.map((opt, oi) => (
          <label key={oi} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${q.correctAnswer === oi ? 'border-green-400 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}>
            <input type="radio" name={`correct-${qi}`} checked={q.correctAnswer === oi}
              onChange={() => set('correctAnswer', oi)} className="accent-green-600 flex-shrink-0" />
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${q.correctAnswer === oi ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {isTF ? (oi === 0 ? 'T' : 'F') : ['A', 'B', 'C', 'D'][oi]}
            </span>
            <input value={opt} onChange={e => setOpt(oi, e.target.value)}
              placeholder={isTF ? (oi === 0 ? 'True' : 'False') : `Option ${['A', 'B', 'C', 'D'][oi]}`}
              disabled={isTF}
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 disabled:text-gray-500" />
          </label>
        ))}
      </div>

      {/* Explanation + meta row */}
      <div className="space-y-2">
        <input value={q.explanation} onChange={e => set('explanation', e.target.value)}
          placeholder="Explanation (optional) — shown after answering in practice mode"
          className={FIELD} />
        <div className="flex gap-2">
          <input value={q.topic} onChange={e => set('topic', e.target.value)}
            placeholder="Topic (e.g. Fractions)"
            className="flex-1 border border-gray-200 rounded-lg px-2.5 py-2 text-xs focus:border-green-500 focus:outline-none" />
          <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-2">
            <span className="text-xs text-gray-500 font-bold">Marks:</span>
            <input type="number" min={1} max={10} value={q.marks} onChange={e => set('marks', +e.target.value)}
              className="w-10 text-xs font-black text-center focus:outline-none bg-transparent" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CreateQuiz() {
  const { createQuiz, saveQuestions } = useFirestore()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '', subject: 'Mathematics', grade: '5', term: '1', duration: 30, type: 'quiz',
  })
  const [questions, setQuestions] = useState([emptyQuestion()])
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState(null)

  function setF(field, val) { setForm(f => ({ ...f, [field]: val })) }
  function show(msg)        { setToast(msg); setTimeout(() => setToast(null), 3500) }

  function handleQChange(qi, field, val) {
    setQuestions(qs => qs.map((q, i) => i === qi ? { ...q, [field]: val } : q))
  }

  function addQuestion() {
    setQuestions(qs => [...qs, emptyQuestion()])
    // Scroll to bottom after a tick
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50)
  }

  function removeQuestion(qi) {
    setQuestions(qs => qs.filter((_, i) => i !== qi))
  }

  function moveQuestion(qi, dir) {
    setQuestions(qs => {
      const arr = [...qs]
      const target = qi + dir
      if (target < 0 || target >= arr.length) return arr;
      [arr[qi], arr[target]] = [arr[target], arr[qi]]
      return arr
    })
  }

  function validate() {
    if (!form.title.trim()) { show('❌ Please enter a quiz title.'); return false }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.text.trim()) { show(`❌ Question ${i + 1} is missing question text.`); return false }
      if (q.type === 'mcq' && q.options.some(o => !o.trim())) {
        show(`❌ Question ${i + 1} has empty options.`); return false
      }
    }
    return true
  }

  async function handleSave(publish = false) {
    if (!validate()) return
    setSaving(true)
    try {
      const totalMarks  = questions.reduce((s, q) => s + (q.marks || 1), 0)
      const quizId = await createQuiz({
        ...form,
        totalMarks,
        questionCount: questions.length,
        isPublished:   publish,
        createdBy:     currentUser.uid,
      })
      await saveQuestions(quizId, questions.map(q => ({
        text: q.text, options: q.options, correctAnswer: q.correctAnswer,
        explanation: q.explanation, topic: q.topic, marks: q.marks || 1, type: q.type,
      })))
      show(publish ? '✅ Quiz published!' : '✅ Quiz saved as draft!')
      setTimeout(() => navigate('/admin/content'), 1200)
    } catch (e) {
      console.error(e)
      show('❌ Failed to save: ' + e.message)
      setSaving(false)
    }
  }

  const totalMarks = questions.reduce((s, q) => s + (q.marks || 1), 0)

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg text-sm max-w-xs animate-slide-up">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 p-1 min-h-0 bg-transparent shadow-none">←</button>
        <div>
          <h1 className="text-2xl font-black text-gray-800">✏️ Create Quiz</h1>
          <p className="text-gray-500 text-sm">Build a quiz for your learners</p>
        </div>
      </div>

      {/* Quiz metadata */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-black text-gray-700">Quiz Details</h2>
        <input value={form.title} onChange={e => setF('title', e.target.value)}
          placeholder="Quiz title (e.g. Grade 5 Mathematics — Fractions Test)"
          className={FIELD} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select value={form.grade} onChange={e => setF('grade', e.target.value)} className={SELECT}>
            {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>
          <select value={form.subject} onChange={e => setF('subject', e.target.value)} className={SELECT}>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={form.term} onChange={e => setF('term', e.target.value)} className={SELECT}>
            {TERMS.map(t => <option key={t} value={t}>Term {t}</option>)}
          </select>
          <div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl px-3 py-2.5">
            <span className="text-xs text-gray-500 font-bold whitespace-nowrap">⏱️ Mins</span>
            <input type="number" min={5} max={180} value={form.duration}
              onChange={e => setF('duration', +e.target.value)}
              className="flex-1 text-sm font-black focus:outline-none bg-transparent" />
          </div>
        </div>
        <div className="flex gap-2 text-xs text-gray-500 pt-1">
          <span className="bg-gray-100 px-2 py-1 rounded-full font-bold">{questions.length} questions</span>
          <span className="bg-gray-100 px-2 py-1 rounded-full font-bold">{totalMarks} marks total</span>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qi) => (
          <QuestionCard key={qi} q={q} qi={qi} total={questions.length}
            onChange={handleQChange} onRemove={removeQuestion} onMove={moveQuestion} />
        ))}
      </div>

      {/* Add question button */}
      <button onClick={addQuestion}
        className="w-full border-2 border-dashed border-green-300 text-green-600 font-black py-4 rounded-2xl hover:border-green-400 hover:bg-green-50 transition-all min-h-0">
        ＋ Add Question
      </button>

      {/* Save actions */}
      <div className="flex gap-3 pb-6">
        <button onClick={() => handleSave(false)} disabled={saving}
          className="flex-1 border-2 border-green-600 text-green-600 font-black py-3.5 rounded-2xl disabled:opacity-50 min-h-0 hover:bg-green-50 transition-colors">
          {saving ? '⏳ Saving…' : '💾 Save Draft'}
        </button>
        <button onClick={() => handleSave(true)} disabled={saving}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-3.5 rounded-2xl disabled:opacity-50 min-h-0 transition-colors">
          {saving ? '⏳ Publishing…' : '🚀 Publish Quiz'}
        </button>
      </div>
    </div>
  )
}
