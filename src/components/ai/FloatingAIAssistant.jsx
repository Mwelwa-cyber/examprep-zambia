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
    return 'Hi, I am Zed. I can help with school topics, quiz questions, lesson activities, revision ideas, and teaching support.'
  }
  if (area === 'quiz-results') {
    return 'Hi, I am Zed. I can explain questions step by step, give examples, and help you revise tricky topics.'
  }
  if (area === 'lessons') {
    return 'Hi, I am Zed. I can summarize lessons, explain topics, give examples, and answer school questions.'
  }
  if (area === 'past-papers') {
    return 'Hi, I am Zed. I can help with past paper questions, revision, and school topics in simple steps.'
  }
  return 'Hi, I am Zed, your study assistant. Ask me any education-related question.'
}

function getActions(area, isStaff) {
  const base = ['Explain this question', 'Give me a study tip', 'Help with a topic']
  if (isStaff) {
    return [
      ...base,
      'Generate quiz questions',
      'Create a lesson activity',
    ]
  }
  if (area === 'lessons') {
    return [...base, 'Summarize this lesson']
  }
  if (area === 'past-papers') {
    return [...base, 'Give me exam tips']
  }
  return base
}

function BotAvatar({ compact = false }) {
  return (
    <span
      className={`relative flex items-center justify-center rounded-full bg-white/95 shadow-inner ${
        compact ? 'h-11 w-11' : 'h-10 w-10'
      }`}
      aria-hidden="true"
    >
      <span className="absolute -top-1 left-1/2 h-2 w-0.5 -translate-x-1/2 rounded-full bg-sky-600" />
      <span className="absolute -top-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-300 ring-2 ring-white" />
      <span className={`${compact ? 'h-7 w-8' : 'h-6 w-7'} rounded-lg border-2 border-sky-600 bg-gradient-to-b from-sky-50 to-cyan-100`}>
        <span className="mt-2 flex justify-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-700" />
          <span className="h-1.5 w-1.5 rounded-full bg-sky-700" />
        </span>
        <span className="mx-auto mt-1 block h-0.5 w-3 rounded-full bg-cyan-500" />
      </span>
    </span>
  )
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
  const { pathname, search } = useLocation()
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
    const params = new URLSearchParams(search)
    return {
      area,
      path: pathname,
      role: userProfile?.role || 'learner',
      grade: params.get('grade') || userProfile?.grade || '',
      subject: params.get('subject') || '',
      topic: params.get('topic') || '',
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
          className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-50 h-16 w-16 rounded-full bg-gradient-to-br from-sky-400 via-cyan-500 to-blue-700 text-white shadow-[0_18px_42px_rgba(14,165,233,0.42)] flex items-center justify-center font-black transition-all hover:scale-105 hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-4 focus:ring-sky-200"
        >
          <span className="absolute -inset-2 rounded-full bg-sky-300/25 animate-pulse" />
          <BotAvatar compact />
          <span className="absolute -bottom-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-sky-700 shadow-sm">
            Zed
          </span>
        </button>
      )}

      {open && (
        <section
          aria-label="Zed study assistant"
          className="fixed bottom-24 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-50 sm:w-[400px] max-h-[78dvh] sm:max-h-[640px] theme-card border theme-border rounded-2xl shadow-[0_24px_80px_rgba(15,23,42,0.25)] overflow-hidden flex flex-col animate-slide-up"
        >
          <header className="bg-gradient-to-br from-sky-600 via-cyan-600 to-blue-700 px-4 py-3 text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <BotAvatar />
                <div className="min-w-0">
                  <p className="font-black leading-tight">Zed</p>
                  <p className="text-xs text-white/80 truncate">Study Assistant</p>
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
            <p className="mt-3 text-xs leading-relaxed text-white/85">
              Ask about Mathematics, English, Science, Social Studies, Literacy, CTS, RE, revision, quizzes, or teaching ideas.
            </p>
          </header>

          <div className="px-3 pt-3 theme-card">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {actions.map(action => (
                <button
                  key={action}
                  type="button"
                  onClick={() => handleSend(action)}
                  disabled={loading}
                  className="shrink-0 rounded-lg border theme-border theme-bg-subtle theme-text text-xs font-black px-3 py-2 min-h-0 hover:theme-card-hover hover:border-sky-300 disabled:opacity-50"
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
                <div className="theme-bg-subtle theme-text-muted rounded-2xl rounded-bl-md px-3 py-2 text-sm font-bold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
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
              className="flex-1 resize-none rounded-xl border theme-input px-3 py-2.5 text-sm focus:outline-none focus:border-sky-400 max-h-24"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-sm px-4 py-2.5 min-h-0 disabled:opacity-50 transition-colors"
            >
              Send
            </button>
          </form>
        </section>
      )}
    </>
  )
}
