import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useFirestore } from '../../hooks/useFirestore'

export default function TeacherPanel() {
  const { currentUser } = useAuth()
  const { getQuizzesByTeacher, getResultsForQuiz, getAllUsers } = useFirestore()

  const [quizzes, setQuizzes] = useState([])
  const [students, setStudents] = useState([])
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    async function load() {
      const [qs, us] = await Promise.all([
        getQuizzesByTeacher(currentUser.uid),
        getAllUsers(),
      ])
      setQuizzes(qs)
      setStudents(us.filter(u => u.role === 'learner' || u.role === 'student'))
      setLoading(false)
    }
    load()
  }, [currentUser.uid])

  async function loadResults(quizId) {
    if (results[quizId]) { setSelected(quizId); return }
    const r = await getResultsForQuiz(quizId)
    setResults(prev => ({ ...prev, [quizId]: r }))
    setSelected(quizId)
  }

  // Stats
  const allR = Object.values(results).flat()
  const classAvg = allR.length > 0 ? Math.round(allR.reduce((s, r) => s + (r.percentage ?? 0), 0) / allR.length) : null
  const struggling = students.filter(s => {
    const stuResults = allR.filter(r => r.userId === s.id)
    if (stuResults.length === 0) return false
    const avg = stuResults.reduce((sum, r) => sum + (r.percentage ?? 0), 0) / stuResults.length
    return avg < 50
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-black text-gray-800">🎓 Teacher Dashboard</h1>

      {/* Overview */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: '📝', label: 'My Quizzes', val: quizzes.length },
          { icon: '👥', label: 'Students', val: students.length },
          { icon: '📊', label: 'Class Avg', val: classAvg !== null ? `${classAvg}%` : '—' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="font-black text-lg text-gray-800">{loading ? '…' : s.val}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Struggling students */}
      {struggling.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
          <h2 className="font-black text-red-700 mb-2">⚠️ Students Below 50%</h2>
          <div className="space-y-1">
            {struggling.map(s => (
              <div key={s.id} className="text-sm text-red-600">
                <span className="font-bold">{s.displayName}</span> · Grade {s.grade}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My quizzes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h2 className="font-black text-gray-800 mb-3">📝 My Quizzes</h2>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-200 rounded-xl animate-pulse" />)}</div>
        ) : quizzes.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No quizzes created yet. Go to Admin Panel to create one.</p>
        ) : (
          <div className="space-y-2">
            {quizzes.map(q => (
              <div key={q.id}>
                <button onClick={() => loadResults(q.id)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left min-h-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{q.title}</p>
                    <p className="text-xs text-gray-400">{q.subject} · G{q.grade} · {q.isPublished ? '🟢 Published' : '⚪ Draft'}</p>
                  </div>
                  <span className="text-gray-300">{selected === q.id ? '▲' : '▼'}</span>
                </button>
                {selected === q.id && results[q.id] && (
                  <div className="mt-2 ml-4 space-y-1 animate-slide-up">
                    {results[q.id].length === 0 ? (
                      <p className="text-gray-400 text-xs py-2">No attempts yet.</p>
                    ) : results[q.id].map(r => (
                      <div key={r.id} className="flex items-center gap-2 text-sm p-2 bg-white rounded-lg border border-gray-100">
                        <span className={`font-black ${r.percentage >= 70 ? 'text-green-600' : r.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {r.percentage}%
                        </span>
                        <span className="text-gray-600 flex-1">{r.userId.slice(0, 8)}…</span>
                        <span className="text-gray-400 text-xs">{r.score}/{r.totalMarks} · {r.mode}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
