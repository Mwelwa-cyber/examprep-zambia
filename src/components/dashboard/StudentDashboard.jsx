import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useFirestore } from '../../hooks/useFirestore'
import { useSubscription } from '../../hooks/useSubscription'
import UpgradeModal from '../subscription/UpgradeModal'
import { UpgradeBanner, AttemptCounter } from '../subscription/PremiumGate'
import PremiumGate from '../subscription/PremiumGate'

const subjectIcon = { Mathematics: '🔢', English: '📖', Science: '🔬', 'Social Studies': '🌍' }

export default function StudentDashboard() {
  const { userProfile } = useAuth()
  const { getUserResults, getWeaknessAnalysis } = useFirestore()
  const { isPremium, attemptsLeft, canUseWeaknessAnalysis } = useSubscription()
  const navigate = useNavigate()

  const [results, setResults]   = useState([])
  const [weakness, setWeakness] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    async function load() {
      if (!userProfile?.id) return
      const [r, w] = await Promise.all([
        getUserResults(userProfile.id, 10),
        canUseWeaknessAnalysis ? getWeaknessAnalysis(userProfile.id) : Promise.resolve([]),
      ])
      setResults(r); setWeakness(w); setLoading(false)
    }
    load()
  }, [userProfile?.id, canUseWeaknessAnalysis])

  const totalQuizzes = results.length
  const avgScore = totalQuizzes > 0 ? Math.round(results.reduce((s, r) => s + (r.percentage ?? 0), 0) / totalQuizzes) : 0
  const bestSubject = (() => {
    const map = {}
    results.forEach(r => {
      map[r.subject] ??= { total: 0, count: 0 }
      map[r.subject].total += r.percentage ?? 0
      map[r.subject].count++
    })
    let best = null, bestAvg = 0
    Object.entries(map).forEach(([s, d]) => { const a = d.total / d.count; if (a > bestAvg) { bestAvg = a; best = s } })
    return best ?? '—'
  })()

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      {/* Welcome */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-2xl p-5 text-white">
        <p className="text-sm opacity-80">Welcome back</p>
        <h1 className="text-2xl font-black leading-tight">
          {userProfile?.displayName ?? 'Learner'} 👋
        </h1>
        <p className="text-sm opacity-80 mt-1">
          {userProfile?.grade ? `Grade ${userProfile.grade}` : ''} {userProfile?.school ? `· ${userProfile.school}` : ''}
          {isPremium && ' · ⭐ Premium'}
        </p>
      </div>

      {/* Upgrade banner */}
      <UpgradeBanner onUpgradeClick={() => setShowUpgrade(true)} />

      {/* Attempt counter */}
      <AttemptCounter onUpgradeClick={() => setShowUpgrade(true)} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: '📝', label: 'Quizzes', value: totalQuizzes },
          { icon: '📊', label: 'Avg Score', value: totalQuizzes > 0 ? `${avgScore}%` : '—' },
          { icon: subjectIcon[bestSubject] ?? '⭐', label: 'Best', value: bestSubject === '—' ? '—' : bestSubject.slice(0, 6) },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="font-black text-lg text-gray-800">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: '📝', label: 'Take a Quiz', to: '/quizzes', color: 'bg-green-600' },
          { icon: '📄', label: 'Past Papers', to: '/papers', color: 'bg-blue-600' },
          { icon: '📊', label: 'All Results', to: '/quizzes', color: 'bg-purple-600' },
        ].map(a => (
          <button key={a.label} onClick={() => navigate(a.to)}
            className={`${a.color} text-white rounded-2xl p-4 text-center hover:opacity-90 transition-opacity min-h-0`}>
            <div className="text-2xl mb-1">{a.icon}</div>
            <div className="font-bold text-xs">{a.label}</div>
          </button>
        ))}
      </div>

      {/* Weakness analysis */}
      <PremiumGate feature="weaknessAnalysis">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h2 className="font-black text-gray-800 mb-3">🔍 Weak Topics</h2>
          {weakness.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Take more quizzes to see your weak spots</p>
          ) : (
            <div className="space-y-2.5">
              {weakness.filter(w => w.percentage < 70).slice(0, 5).map(w => (
                <div key={w.topic}>
                  <div className="flex justify-between text-sm mb-0.5">
                    <span className="font-bold text-gray-700">{w.topic} <span className="text-gray-400 text-xs">({w.subject})</span></span>
                    <span className={`font-black ${w.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{w.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${w.percentage >= 50 ? 'bg-yellow-400' : 'bg-red-500'}`}
                      style={{ width: `${w.percentage}%` }} />
                  </div>
                </div>
              ))}
              {weakness.filter(w => w.percentage < 70).length === 0 && (
                <p className="text-green-600 font-bold text-sm text-center py-2">🎉 All topics above 70%!</p>
              )}
            </div>
          )}
        </div>
      </PremiumGate>

      {/* Recent results */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h2 className="font-black text-gray-800 mb-3">📋 Recent Results</h2>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />)}</div>
        ) : results.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎯</div>
            <p className="text-gray-500 text-sm">No quizzes taken yet.</p>
            <button onClick={() => navigate('/quizzes')} className="mt-3 bg-green-600 text-white font-bold text-sm px-5 py-2 rounded-full min-h-0">
              Start your first quiz →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {results.slice(0, 5).map(r => (
              <button key={r.id} onClick={() => navigate(`/results/${r.id}`)}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left min-h-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${r.percentage >= 70 ? 'bg-green-100 text-green-700' : r.percentage >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  {r.percentage}%
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{r.quizTitle ?? 'Quiz'}</p>
                  <p className="text-xs text-gray-400">{r.score}/{r.totalMarks} · {r.mode === 'exam' ? '🏆' : '🌱'} {r.mode}</p>
                </div>
                <span className="text-gray-300 text-xs">→</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
