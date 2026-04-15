import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { sendAIChat } from '../../utils/aiAssistant'

function getArea(pathname) {
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/teacher')) return 'teacher'
  if (pathname.startsWith('/results')) return 'quiz-results'
  if (pathname.startsWith('/quiz')) return 'quiz'
  if (pathname.startsWith('/quizzes')) return 'quizzes'
  if (pathname.startsWith('/lessons')) return 'lessons'
  if (pathname.startsWith('/papers')) return 'past-papers'
  if (pathname.startsWith('/dashboard')) return 'dashboard'
  return 'study'
}

function getGreeting(area, isStaff) {
  if (isStaff) {
    return 'Hi, I am Zed. I can help draft quiz questions, simplify topics, and turn lesson ideas into learner-friendly practice.'
  }
  if (area === 'quiz-results') {
    return 'Hi, I am Zed. I can explain missed answers step by step and help you revise the tricky parts.'
  }
  if (area === 'lessons') {
    return 'Hi, I am Zed. I can summarize lessons, explain topics, and answer study questions in simple words.'
  }
  if (area === 'past-papers') {
    return 'Hi, I am Zed. I can help you understand past paper questions and plan revision.'
  }
  return 'Hi, I am Zed, your study assistant. Ask me about lessons, quizzes, topics, or study tips.'
}

function getActions(area, isStaff) {
  if (isStaff) {
    return [
      'Generate quiz questions',
      'Create a lesson activity',
      'Make this topic easier',
    ]
  }
  if (area === 'quiz-results') {
    return ['Explain a wrong answer', 'Give me a hint', 'Make a revision plan']
  }
  if (area === 'lessons') {
    return ['Summarize this lesson', 'Help with this topic', 'Ask me a question']
  }
  if (area === 'past-papers') {
    return ['Help with this paper', 'Give me exam tips', 'Explain a topic']
  }
  return ['Give me a study tip', 'Help me revise', 'Explain a topic simply']
}

function makeMessage(from, text) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    from,
    text,
  }
}

export default function FloatingAIAssistant() {
  const { currentUser, userProfile, isAdmin, isTeacher } = useAuth()
  const { pathname } = useLocation()
  const area = getArea(pathname)
  const isStaff = isAdmin || isTeacher
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)

  const hidden = !currentUser || pathname === '/login' || pathname === '/register'
  const greeting = useMemo(() => getGreeting(area, isStaff), [area, isStaff])
  const actions = useMemo(() => getActions(area, isStaff), [area, isStaff])
  const starterMessage = useMemo(() => makeMessage('assistant', greeting), [greeting])
  const displayMessages = messages.length
    ? messages
    : [starterMessage]

  useEffect(() => {
    if (!open) return
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loading, open])

  if (hidden) return null

  function buildContext() {
    return {
      area,
      path: pathname,
      role: userProfile?.role || 'learner',
      grade: userProfile?.grade || '',
    }
  }

  async function handleSend(text = input) {
    const clean = String(text || '').trim()
    if (!clean || loading) return

    setOpen(true)
    setInput('')
    setLoading(true)
    setMessages(prev => [
      ...(prev.length ? prev : [starterMessage]),
      makeMessage('user', clean),
    ])

    try {
      const reply = await sendAIChat({
        message: clean,
        context: buildContext(),
      })
      setMessages(prev => [...prev, makeMessage('assistant', reply)])
    } catch (error) {
      setMessages(prev => [...prev, makeMessage('assistant', error.message)])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open Zed study assistant"
          className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-50 h-16 w-16 rounded-full theme-accent-fill theme-on-accent shadow-2xl flex flex-col items-center justify-center font-black transition-all hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-sky-200"
        >
          <span className="absolute inset-0 rounded-full theme-accent-fill animate-pulse opacity-25" />
          <span className="relative text-xl leading-none">✦</span>
          <span className="relative text-xs leading-none mt-0.5">Zed</span>
        </button>
      )}

      {open && (
        <section
          aria-label="Zed study assistant"
          className="fixed bottom-24 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-24 z-50 sm:w-[390px] max-h-[78dvh] sm:max-h-[640px] theme-card border theme-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up"
        >
          <header className="theme-hero px-4 py-3 text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-black">
                  ✦
                </div>
                <div className="min-w-0">
                  <p className="font-black leading-tight">Zed</p>
                  <p className="text-xs text-white/75 truncate">Study Assistant</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-9 w-9 rounded-lg bg-white/15 hover:bg-white/25 text-white font-black min-h-0"
                aria-label="Close Zed assistant"
              >
                ×
              </button>
            </div>
          </header>

          <div className="px-3 pt-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {actions.map(action => (
                <button
                  key={action}
                  type="button"
                  onClick={() => handleSend(action)}
                  disabled={loading}
                  className="shrink-0 rounded-lg border theme-border theme-bg-subtle theme-text text-xs font-black px-3 py-2 min-h-0 hover:theme-card-hover disabled:opacity-50"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={listRef}
            className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-[260px]"
            aria-live="polite"
          >
            {displayMessages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[84%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  message.from === 'user'
                    ? 'theme-accent-fill theme-on-accent rounded-br-md'
                    : 'theme-bg-subtle theme-text rounded-bl-md'
                }`}>
                  {message.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="theme-bg-subtle theme-text-muted rounded-2xl rounded-bl-md px-3 py-2 text-sm font-bold">
                  Zed is thinking...
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={e => {
              e.preventDefault()
              handleSend()
            }}
            className="border-t theme-border p-3 flex items-end gap-2"
          >
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Zed for help..."
              rows={1}
              className="flex-1 resize-none rounded-xl border theme-input px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] max-h-24"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="rounded-xl theme-accent-fill theme-on-accent font-black text-sm px-4 py-2.5 min-h-0 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </section>
      )}
    </>
  )
}
