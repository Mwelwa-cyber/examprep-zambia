import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useFirestore } from '../../hooks/useFirestore'

const TABS = [
  { id: 'lessons', label: '📖 Lessons' },
  { id: 'quizzes', label: '📝 Quizzes' },
]

const subjectColor = {
  Mathematics:      'bg-blue-100   text-blue-700',
  English:          'bg-purple-100 text-purple-700',
  Science:          'bg-orange-100 text-orange-700',
  'Social Studies': 'bg-teal-100   text-teal-700',
}

function Badge({ children, color }) {
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{children}</span>
}

export default function ManageContent() {
  const { getAllLessons, updateLesson, deleteLesson, getAllQuizzes, updateQuiz, deleteQuiz } = useFirestore()

  const [tab, setTab]         = useState('lessons')
  const [lessons, setLessons] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState(null)
  const [search, setSearch]   = useState('')
  const [gradeF, setGradeF]   = useState('')
  const [deleting, setDeleting] = useState(null)

  function show(msg) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [l, q] = await Promise.all([getAllLessons(), getAllQuizzes()])
      setLessons(l); setQuizzes(q); setLoading(false)
    }
    load()
  }, [])

  // ── Lessons actions ──────────────────────────────────────────
  async function toggleLessonPublish(lesson) {
    await updateLesson(lesson.id, { isPublished: !lesson.isPublished })
    setLessons(ls => ls.map(l => l.id === lesson.id ? { ...l, isPublished: !l.isPublished } : l))
    show(lesson.isPublished ? 'Lesson unpublished' : '✅ Lesson published!')
  }

  async function handleDeleteLesson(lesson) {
    if (deleting) return
    if (!window.confirm(`Delete "${lesson.title}"? This cannot be undone.`)) return
    setDeleting(lesson.id)
    await deleteLesson(lesson.id)
    setLessons(ls => ls.filter(l => l.id !== lesson.id))
    setDeleting(null)
    show('Lesson deleted.')
  }

  // ── Quiz actions ─────────────────────────────────────────────
  async function toggleQuizPublish(quiz) {
    await updateQuiz(quiz.id, { isPublished: !quiz.isPublished })
    setQuizzes(qs => qs.map(q => q.id === quiz.id ? { ...q, isPublished: !q.isPublished } : q))
    show(quiz.isPublished ? 'Quiz unpublished' : '✅ Quiz published!')
  }

  async function handleDeleteQuiz(quiz) {
    if (deleting) return
    if (!window.confirm(`Delete "${quiz.title}"? This cannot be undone.`)) return
    setDeleting(quiz.id)
    await deleteQuiz(quiz.id)
    setQuizzes(qs => qs.filter(q => q.id !== quiz.id))
    setDeleting(null)
    show('Quiz deleted.')
  }

  // ── Filtering ────────────────────────────────────────────────
  const term = search.toLowerCase()
  const filteredLessons = lessons.filter(l =>
    (!gradeF || l.grade === gradeF) &&
    (!term   || l.title.toLowerCase().includes(term) || l.subject.toLowerCase().includes(term) || (l.topic || '').toLowerCase().includes(term))
  )
  const filteredQuizzes = quizzes.filter(q =>
    (!gradeF || q.grade === gradeF) &&
    (!term   || q.title.toLowerCase().includes(term) || q.subject.toLowerCase().includes(term))
  )

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg text-sm max-w-xs">
          {toast}
        </div>
      )}

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-800">📁 Manage Content</h1>
          <p className="text-gray-500 text-sm">Edit, publish, or delete lessons and quizzes</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/lessons/new" className="bg-green-600 text-white font-black text-sm px-4 py-2 rounded-xl hover:bg-green-700 transition-colors">
            + Lesson
          </Link>
          <Link to="/admin/quizzes/new" className="border-2 border-green-600 text-green-600 font-black text-sm px-4 py-2 rounded-xl hover:bg-green-50 transition-colors">
            + Quiz
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all min-h-0 ${tab === t.id ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search + grade filter */}
      <div className="flex gap-2 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search title, subject, topic…"
          className="flex-1 min-w-[180px] border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-green-500 focus:outline-none" />
        <select value={gradeF} onChange={e => setGradeF(e.target.value)}
          className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-green-500 focus:outline-none">
          <option value="">All Grades</option>
          {['5', '6', '7'].map(g => <option key={g} value={g}>Grade {g}</option>)}
        </select>
      </div>

      {/* ── Lessons Tab ─────────────────────────────────────── */}
      {tab === 'lessons' && (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-20" />
            ))
          ) : filteredLessons.length === 0 ? (
            <div className="text-center py-14">
              <div className="text-4xl mb-2">📭</div>
              <p className="font-bold text-gray-600">No lessons found</p>
              <Link to="/admin/lessons/new" className="inline-block mt-3 text-green-600 font-bold text-sm hover:underline">Create your first lesson →</Link>
            </div>
          ) : filteredLessons.map(lesson => (
            <div key={lesson.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">
              <div className="bg-green-100 text-green-700 w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0">📖</div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-800 text-sm leading-snug truncate">{lesson.title}</p>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  <Badge color={subjectColor[lesson.subject] ?? 'bg-gray-100 text-gray-700'}>{lesson.subject}</Badge>
                  <Badge color="bg-green-100 text-green-700">G{lesson.grade}</Badge>
                  <Badge color="bg-gray-100 text-gray-600">T{lesson.term}</Badge>
                  {lesson.topic && <Badge color="bg-gray-50 text-gray-500">{lesson.topic}</Badge>}
                  <Badge color={lesson.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}>
                    {lesson.isPublished ? '● Published' : '○ Draft'}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-1.5 flex-shrink-0">
                <button onClick={() => toggleLessonPublish(lesson)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border min-h-0 transition-colors ${lesson.isPublished ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50' : 'border-green-300 text-green-700 hover:bg-green-50'}`}>
                  {lesson.isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => handleDeleteLesson(lesson)} disabled={deleting === lesson.id}
                  className="text-xs font-bold px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 min-h-0 disabled:opacity-40 transition-colors">
                  {deleting === lesson.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Quizzes Tab ─────────────────────────────────────── */}
      {tab === 'quizzes' && (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-20" />
            ))
          ) : filteredQuizzes.length === 0 ? (
            <div className="text-center py-14">
              <div className="text-4xl mb-2">📭</div>
              <p className="font-bold text-gray-600">No quizzes found</p>
              <Link to="/admin/quizzes/new" className="inline-block mt-3 text-green-600 font-bold text-sm hover:underline">Create your first quiz →</Link>
            </div>
          ) : filteredQuizzes.map(quiz => (
            <div key={quiz.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${subjectColor[quiz.subject] ?? 'bg-gray-100'}`}>
                ✏️
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-800 text-sm leading-snug truncate">{quiz.title}</p>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  <Badge color={subjectColor[quiz.subject] ?? 'bg-gray-100 text-gray-700'}>{quiz.subject}</Badge>
                  <Badge color="bg-green-100 text-green-700">G{quiz.grade}</Badge>
                  <Badge color="bg-gray-100 text-gray-600">T{quiz.term}</Badge>
                  <Badge color="bg-gray-100 text-gray-500">{quiz.questionCount ?? '?'}Q · {quiz.duration}m</Badge>
                  <Badge color={quiz.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}>
                    {quiz.isPublished ? '● Published' : '○ Draft'}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-1.5 flex-shrink-0">
                <button onClick={() => toggleQuizPublish(quiz)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border min-h-0 transition-colors ${quiz.isPublished ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50' : 'border-green-300 text-green-700 hover:bg-green-50'}`}>
                  {quiz.isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => handleDeleteQuiz(quiz)} disabled={deleting === quiz.id}
                  className="text-xs font-bold px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 min-h-0 disabled:opacity-40 transition-colors">
                  {deleting === quiz.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
