import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useFirestore } from '../../hooks/useFirestore'

const subjectStyle = {
  Mathematics:           { bg: 'bg-blue-600',   light: 'bg-blue-50',   badge: 'bg-blue-100 text-blue-700'    },
  English:               { bg: 'bg-violet-600', light: 'bg-violet-50', badge: 'bg-violet-100 text-violet-700' },
  'Integrated Science':  { bg: 'bg-orange-600', light: 'bg-orange-50', badge: 'bg-orange-100 text-orange-700' },
  'Social Studies':      { bg: 'bg-teal-600',   light: 'bg-teal-50',   badge: 'bg-teal-100 text-teal-700'    },
  'Technology Studies':  { bg: 'bg-cyan-600',   light: 'bg-cyan-50',   badge: 'bg-cyan-100 text-cyan-700'    },
  'Home Economics':      { bg: 'bg-pink-600',   light: 'bg-pink-50',   badge: 'bg-pink-100 text-pink-700'    },
  'Expressive Arts':     { bg: 'bg-rose-600',   light: 'bg-rose-50',   badge: 'bg-rose-100 text-rose-700'    },
  // legacy alias
  Science:               { bg: 'bg-orange-600', light: 'bg-orange-50', badge: 'bg-orange-100 text-orange-700' },
}

export default function LessonView() {
  const { lessonId } = useParams()
  const navigate     = useNavigate()
  const { getLessonById } = useFirestore()

  const [lesson, setLesson]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getLessonById(lessonId)
      setLesson(data)
      setLoading(false)
    }
    load()
  }, [lessonId])

  if (loading) return (
    <div className="max-w-2xl md:max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div className="h-8 bg-gray-200 rounded-lg w-2/3 animate-pulse" />
      <div className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${75 + Math.random() * 25}%` }} />
        ))}
      </div>
    </div>
  )

  if (!lesson) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-5xl mb-3">😕</div>
        <p className="font-black text-gray-700 text-lg">Lesson not found</p>
        <Link to="/lessons" className="mt-4 inline-block bg-green-600 text-white font-bold px-5 py-2.5 rounded-full text-sm hover:bg-green-700 transition-colors">
          ← Back to Lessons
        </Link>
      </div>
    </div>
  )

  const s = subjectStyle[lesson.subject] ?? { bg: 'bg-green-600', light: 'bg-green-50', badge: 'bg-green-100 text-green-700' }
  const wordCount = lesson.content ? lesson.content.split(/\s+/).length : 0
  const readMins  = Math.max(1, Math.round(wordCount / 200))
  const paragraphs = (lesson.content || '').split(/\n{2,}/).filter(Boolean)

  return (
    <div className="max-w-2xl md:max-w-3xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold mb-4">
        <Link to="/lessons" className="hover:text-green-600 transition-colors">Lessons</Link>
        <span>›</span>
        <span className="text-gray-600 truncate max-w-[200px]">{lesson.title}</span>
      </div>

      {/* Hero card */}
      <div className={`${s.bg} rounded-3xl p-5 mb-5 text-white`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {lesson.topic && <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1">{lesson.topic}</p>}
            <h1 className="text-xl font-black leading-snug">{lesson.title}</h1>
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">{lesson.subject}</span>
              <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">Grade {lesson.grade}</span>
              <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">Term {lesson.term}</span>
              <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">⏱ {readMins} min read</span>
            </div>
          </div>
          <button onClick={() => navigate(-1)}
            className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-3 py-1.5 rounded-full flex-shrink-0 min-h-0 transition-colors">
            ← Back
          </button>
        </div>
      </div>

      {/* Lesson image */}
      {lesson.imageURL && (
        <img src={lesson.imageURL} alt={lesson.title}
          onError={e => { e.target.style.display = 'none' }}
          className="w-full rounded-2xl mb-5 object-cover max-h-56 border border-gray-100" />
      )}

      {/* Learning objectives */}
      {lesson.objectives?.length > 0 && (
        <div className={`${s.light} rounded-2xl p-4 mb-5`}>
          <h2 className="font-black text-gray-800 text-sm mb-2">🎯 Learning Objectives</h2>
          <ul className="space-y-1.5">
            {(Array.isArray(lesson.objectives) ? lesson.objectives : [lesson.objectives]).map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-0.5 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">{i + 1}</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main content */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <h2 className="font-black text-gray-800 mb-4 text-sm uppercase tracking-wide text-gray-400">Lesson Content</h2>
        <div className="prose prose-sm max-w-none space-y-4">
          {paragraphs.map((para, i) => (
            <p key={i} className="text-gray-700 leading-relaxed text-base">{para}</p>
          ))}
        </div>
      </div>

      {/* Key vocabulary */}
      {lesson.keyVocab?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
          <h2 className="font-black text-gray-800 text-sm mb-3">📝 Key Vocabulary</h2>
          <div className="flex gap-2 flex-wrap">
            {(Array.isArray(lesson.keyVocab) ? lesson.keyVocab : lesson.keyVocab.split(',')).map((word, i) => (
              <span key={i} className={`${s.badge} text-sm font-bold px-3 py-1 rounded-full`}>
                {word.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pb-4">
        <Link to="/lessons"
          className="flex-1 border-2 border-gray-200 text-gray-700 font-black py-3 rounded-2xl text-center hover:border-green-400 hover:text-green-700 transition-colors text-sm">
          ← All Lessons
        </Link>
        <Link to="/quizzes"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-2xl text-center transition-colors text-sm">
          Take a Quiz 📝
        </Link>
      </div>
    </div>
  )
}
