/**
 * Teacher AI Co-Pilot 2.0 — conversational assistant.
 *
 * Replaces the form-style generator with a true ChatGPT-style chat. The
 * teacher types in plain English; the server classifies intent and the
 * assistant decides what to produce.
 *
 * Layout:
 *   ┌──────────────────────────┬───────────────────┐
 *   │ chat history (left,      │ class context     │
 *   │ collapsible on mobile)   │ panel (right,     │
 *   │                          │ collapsible)      │
 *   ├──────────────────────────┴───────────────────┤
 *   │ messages (welcome, then conversation)        │
 *   │   - smart follow-up buttons under each reply │
 *   ├──────────────────────────────────────────────┤
 *   │ suggestion chips                              │
 *   │ input box + Send                              │
 *   └──────────────────────────────────────────────┘
 *
 * The legacy generator-style co-pilot at /teacher/ai-copilot is left
 * untouched. This is a separate experience reachable at /teacher/assistant.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import {
  GRADES,
  SUBJECTS,
  LEARNER_LEVELS,
  SUGGESTION_CHIPS,
  buildFollowUpPrompt,
  listAiChatMessages,
  listMyAiChats,
  sendChatMessage,
  DEFAULT_FOLLOW_UPS,
} from '../../../utils/teacherChatAssistantService'
import {
  downloadAiCopilotPdf,
  downloadAiCopilotWord,
} from '../../../utils/aiCopilotExport'
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Sparkles,
} from '../../ui/icons'
import Icon from '../../ui/Icon'

const WELCOME_MESSAGE =
  "Tell me what you are teaching, and I'll prepare the lesson, notes, activities, homework, and assessment when needed."

const TERMS = [
  { id: '', label: 'Term —' },
  { id: '1', label: 'Term 1' },
  { id: '2', label: 'Term 2' },
  { id: '3', label: 'Term 3' },
]

const WEEKS = [
  { id: '', label: 'Week —' },
  ...Array.from({ length: 14 }).map((_, i) => ({ id: String(i + 1), label: `Week ${i + 1}` })),
]

const DURATIONS = [
  { id: '', label: 'Duration —' },
  { id: '20', label: '20 mins' },
  { id: '30', label: '30 mins' },
  { id: '40', label: '40 mins' },
  { id: '60', label: '60 mins' },
  { id: '80', label: '80 mins' },
]

const SUBJECT_OPTIONS = [{ id: '', label: 'Subject —' }, ...SUBJECTS]
const GRADE_OPTIONS = [{ id: '', label: 'Grade —' }, ...GRADES]

function nowMs() {
  return Date.now()
}

/**
 * Tiny markdown-ish renderer. The chat reply is plain markdown; we
 * preserve headings, bullet points, numbered lists, and bold text
 * without pulling in a full markdown parser. Everything else falls
 * back to whitespace-preserved paragraphs.
 */
function MarkdownLite({ text }) {
  const lines = (text || '').split('\n')
  const rendered = []
  let listBuffer = null
  let listType = null

  function flushList() {
    if (!listBuffer) return
    const Tag = listType === 'ol' ? 'ol' : 'ul'
    rendered.push(
      <Tag
        key={`list-${rendered.length}`}
        className={listType === 'ol' ? 'list-decimal pl-5 my-2 space-y-1' : 'list-disc pl-5 my-2 space-y-1'}
      >
        {listBuffer.map((it, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(it) }} />
        ))}
      </Tag>,
    )
    listBuffer = null
    listType = null
  }

  function inlineFormat(s) {
    // **bold** → <strong>; *italic* → <em>; `code` → <code>
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*([^*]|$)/g, '$1<em>$2</em>$3')
      .replace(/`([^`]+)`/g, '<code class="px-1 rounded" style="background:#f5efe1">$1</code>')
  }

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i]
    const line = raw.replace(/\s+$/g, '')

    if (!line.trim()) {
      flushList()
      continue
    }

    const h3 = line.match(/^###\s+(.*)$/)
    const h2 = line.match(/^##\s+(.*)$/)
    const h1 = line.match(/^#\s+(.*)$/)
    const bullet = line.match(/^[-*]\s+(.*)$/)
    const num = line.match(/^\d+\.\s+(.*)$/)

    if (h1) {
      flushList()
      rendered.push(
        <h2 key={`h-${i}`} className="text-lg sm:text-xl font-black mt-3 mb-2" style={{ color: '#0e2a32', fontFamily: "'Fraunces', serif" }}>
          <span dangerouslySetInnerHTML={{ __html: inlineFormat(h1[1]) }} />
        </h2>,
      )
    } else if (h2) {
      flushList()
      rendered.push(
        <h3 key={`h-${i}`} className="text-base sm:text-lg font-black mt-3 mb-1.5" style={{ color: '#0e2a32', fontFamily: "'Fraunces', serif" }}>
          <span dangerouslySetInnerHTML={{ __html: inlineFormat(h2[1]) }} />
        </h3>,
      )
    } else if (h3) {
      flushList()
      rendered.push(
        <h4 key={`h-${i}`} className="text-sm sm:text-base font-black mt-2.5 mb-1" style={{ color: '#0e2a32' }}>
          <span dangerouslySetInnerHTML={{ __html: inlineFormat(h3[1]) }} />
        </h4>,
      )
    } else if (bullet) {
      if (listType !== 'ul') flushList()
      listType = 'ul'
      listBuffer = listBuffer || []
      listBuffer.push(bullet[1])
    } else if (num) {
      if (listType !== 'ol') flushList()
      listType = 'ol'
      listBuffer = listBuffer || []
      listBuffer.push(num[1])
    } else {
      flushList()
      rendered.push(
        <p key={`p-${i}`} className="my-1.5 leading-relaxed" style={{ color: '#0e2a32' }}>
          <span dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
        </p>,
      )
    }
  }
  flushList()
  return <div className="text-sm">{rendered}</div>
}

function ContextPill({ label, value }) {
  if (!value) return null
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
      style={{ background: '#fde2c4', color: '#a64500', letterSpacing: '0.06em' }}
    >
      {label}: {value}
    </span>
  )
}

function ContextPanel({
  open,
  onToggle,
  grade, setGrade,
  subject, setSubject,
  term, setTerm,
  week, setWeek,
  duration, setDuration,
  learnerLevel, setLearnerLevel,
  weakAreas, setWeakAreas,
}) {
  const Field = ({ label, children }) => (
    <label className="block">
      <span className="block text-[11px] font-black uppercase tracking-wider mb-1" style={{ color: '#566f76', letterSpacing: '0.08em' }}>
        {label}
      </span>
      {children}
    </label>
  )

  return (
    <aside
      className={`flex flex-col flex-shrink-0 transition-all duration-200 ease-out border-l-2 ${
        open ? 'w-72' : 'w-12'
      }`}
      style={{ borderColor: '#e7dfc9', background: '#fffaf0' }}
      aria-label="Class Context"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-3 border-b-2 text-xs font-black uppercase tracking-wider"
        style={{ borderColor: '#e7dfc9', color: '#0e2a32', letterSpacing: '0.08em' }}
      >
        <Icon as={open ? ChevronRight : ChevronLeft} size="sm" />
        {open && (
          <span className="flex items-center gap-1.5">
            <Icon as={Settings} size="sm" />
            Class Context
          </span>
        )}
      </button>

      {open && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <p className="text-[11px]" style={{ color: '#566f76' }}>
            These are small hints. The assistant decides what to produce
            from your message — you don't have to set everything.
          </p>
          <Field label="Grade">
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full rounded-xl border-2 px-3 py-2 text-sm font-bold bg-white"
              style={{ borderColor: '#0e2a32', color: '#0e2a32' }}
            >
              {GRADE_OPTIONS.map((o) => (
                <option key={o.id || 'none'} value={o.id}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Subject">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border-2 px-3 py-2 text-sm font-bold bg-white"
              style={{ borderColor: '#0e2a32', color: '#0e2a32' }}
            >
              {SUBJECT_OPTIONS.map((o) => (
                <option key={o.id || 'none'} value={o.id}>{o.label}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Term">
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full rounded-xl border-2 px-2 py-2 text-sm font-bold bg-white"
                style={{ borderColor: '#0e2a32', color: '#0e2a32' }}
              >
                {TERMS.map((o) => (
                  <option key={o.id || 'none'} value={o.id}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Week">
              <select
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                className="w-full rounded-xl border-2 px-2 py-2 text-sm font-bold bg-white"
                style={{ borderColor: '#0e2a32', color: '#0e2a32' }}
              >
                {WEEKS.map((o) => (
                  <option key={o.id || 'none'} value={o.id}>{o.label}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Lesson length">
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-xl border-2 px-3 py-2 text-sm font-bold bg-white"
              style={{ borderColor: '#0e2a32', color: '#0e2a32' }}
            >
              {DURATIONS.map((o) => (
                <option key={o.id || 'none'} value={o.id}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Learner level">
            <select
              value={learnerLevel}
              onChange={(e) => setLearnerLevel(e.target.value)}
              className="w-full rounded-xl border-2 px-3 py-2 text-sm font-bold bg-white"
              style={{ borderColor: '#0e2a32', color: '#0e2a32' }}
            >
              {LEARNER_LEVELS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Weak areas (optional)">
            <input
              type="text"
              value={weakAreas}
              onChange={(e) => setWeakAreas(e.target.value)}
              placeholder="e.g. simplifying fractions"
              className="w-full rounded-xl border-2 px-3 py-2 text-sm font-bold bg-white"
              style={{ borderColor: '#0e2a32', color: '#0e2a32' }}
              maxLength={300}
            />
          </Field>
        </div>
      )}
    </aside>
  )
}

function ChatHistorySidebar({ chats, activeChatId, onPick, onNew, loading, open, onToggle }) {
  return (
    <aside
      className={`flex flex-col flex-shrink-0 transition-all duration-200 ease-out border-r-2 ${
        open ? 'w-64' : 'w-12'
      } hidden lg:flex`}
      style={{ borderColor: '#e7dfc9', background: '#fffaf0' }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-3 border-b-2 text-xs font-black uppercase tracking-wider"
        style={{ borderColor: '#e7dfc9', color: '#0e2a32', letterSpacing: '0.08em' }}
      >
        <Icon as={open ? ChevronLeft : ChevronRight} size="sm" />
        {open && <span>History</span>}
      </button>

      {open && (
        <>
          <div className="p-3 border-b-2" style={{ borderColor: '#e7dfc9' }}>
            <button
              type="button"
              onClick={onNew}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-black"
              style={{ background: '#ff7a2e', color: '#fff' }}
            >
              <Icon as={Plus} size="sm" />
              New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading && chats.length === 0 ? (
              <p className="text-xs px-2 py-3" style={{ color: '#8a9aa1' }}>Loading…</p>
            ) : chats.length === 0 ? (
              <p className="text-xs px-2 py-3" style={{ color: '#8a9aa1' }}>
                No chats yet — say hello below.
              </p>
            ) : chats.map((c) => {
              const active = activeChatId === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onPick(c.id)}
                  className="w-full text-left flex items-start gap-2 rounded-xl px-2.5 py-2 text-xs font-bold"
                  style={{
                    background: active ? '#fff' : 'transparent',
                    color: '#0e2a32',
                    border: active ? '2px solid #ff7a2e' : '2px solid transparent',
                  }}
                >
                  <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>💬</span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{c.title || 'Untitled chat'}</span>
                    <span className="block text-[10px] font-medium opacity-70 truncate">
                      {c.grade ? `Grade ${String(c.grade).replace(/^G/, '')}` : ''} {c.subject ? `· ${String(c.subject).replace(/_/g, ' ')}` : ''}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </aside>
  )
}

function WelcomeBlock({ teacherName }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4 max-w-xl mx-auto">
      <div
        className="rounded-full grid place-items-center mb-4"
        style={{ width: 72, height: 72, background: '#fde2c4', fontSize: 36 }}
      >
        🦊
      </div>
      <h2
        className="text-xl sm:text-2xl font-black mb-2"
        style={{ color: '#0e2a32', fontFamily: "'Fraunces', serif" }}
      >
        {teacherName ? `Hi, ${teacherName.split(' ')[0]} — let's plan your lesson.` : 'Hi, teacher — let\'s plan your lesson.'}
      </h2>
      <p className="text-sm sm:text-base mb-4" style={{ color: '#566f76' }}>
        {WELCOME_MESSAGE}
      </p>
      <p className="text-xs" style={{ color: '#8a9aa1' }}>
        Try: <em>"I'm teaching Grade 5 fractions tomorrow."</em> or <em>"My learners are struggling with simplifying fractions."</em>
      </p>
    </div>
  )
}

function UserBubble({ message }) {
  return (
    <div
      className="self-end max-w-[88%] rounded-2xl rounded-br-md px-4 py-3 text-sm font-medium whitespace-pre-wrap"
      style={{ background: '#0e2a32', color: '#fff' }}
    >
      {message.content}
    </div>
  )
}

function AssistantBubble({ message }) {
  return (
    <div
      className="self-start max-w-[92%] w-full rounded-2xl rounded-bl-md px-4 py-3 leading-relaxed"
      style={{ background: '#fff', color: '#0e2a32', border: '1px solid #e7dfc9' }}
    >
      <MarkdownLite text={message.content} />
    </div>
  )
}

function PendingBubble() {
  return (
    <div
      className="self-start max-w-[88%] rounded-2xl rounded-bl-md px-4 py-3 text-sm flex items-center gap-2"
      style={{ background: '#fff', color: '#0e2a32', border: '1px solid #e7dfc9' }}
    >
      <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: '#ff7a2e' }} />
      <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: '#ff7a2e', animationDelay: '120ms' }} />
      <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: '#ff7a2e', animationDelay: '240ms' }} />
      <span className="ml-1 text-xs font-bold" style={{ color: '#566f76' }}>
        Zed AI is thinking…
      </span>
    </div>
  )
}

function FollowUpRow({ followUps, onAction, onCopy, onWord, onPdf, busy }) {
  const [copied, setCopied] = useState(false)

  async function handleCopyClick() {
    const ok = await onCopy()
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    }
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2 mb-1">
      {followUps.map((f) => {
        if (f.actionId === 'save') {
          return (
            <div key="save-cluster" className="inline-flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onWord}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border-2 transition-colors disabled:opacity-50"
                style={{ background: '#fff', color: '#0e2a32', borderColor: '#0e2a32' }}
              >
                <Icon as={Download} size="sm" /> Word
              </button>
              <button
                type="button"
                onClick={onPdf}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border-2 transition-colors disabled:opacity-50"
                style={{ background: '#fff', color: '#0e2a32', borderColor: '#0e2a32' }}
              >
                <Icon as={Download} size="sm" /> PDF
              </button>
              <button
                type="button"
                onClick={handleCopyClick}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border-2 transition-colors disabled:opacity-50"
                style={{ background: '#fff', color: '#0e2a32', borderColor: '#0e2a32' }}
              >
                <Icon as={copied ? Check : Copy} size="sm" /> {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )
        }
        return (
          <button
            key={f.actionId}
            type="button"
            onClick={() => onAction(f)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border-2 transition-colors disabled:opacity-50"
            style={{ background: '#ff7a2e', color: '#fff', borderColor: '#ff7a2e' }}
          >
            <Icon as={Sparkles} size="sm" />
            {f.label}
          </button>
        )
      })}
    </div>
  )
}

export default function ChatAssistant() {
  const { currentUser, userProfile, isAdmin, isTeacher } = useAuth()

  // Class context — small hints, NOT the main focus.
  const [grade, setGrade] = useState('G5')
  const [subject, setSubject] = useState('mathematics')
  const [term, setTerm] = useState('')
  const [week, setWeek] = useState('')
  const [duration, setDuration] = useState('40')
  const [learnerLevel, setLearnerLevel] = useState('mixed')
  const [weakAreas, setWeakAreas] = useState('')

  const [contextOpen, setContextOpen] = useState(true)
  const [historyOpen, setHistoryOpen] = useState(true)

  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [chats, setChats] = useState([])
  const [chatsLoading, setChatsLoading] = useState(false)

  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const scrollerRef = useRef(null)
  const inputRef = useRef(null)

  const allowed = !!currentUser && (isTeacher || isAdmin)

  const loadChats = useCallback(async () => {
    if (!currentUser) return
    setChatsLoading(true)
    try {
      const list = await listMyAiChats(currentUser.uid)
      setChats(list)
    } catch (err) {
      console.warn('[chatAssistant] failed to load chats', err)
    } finally {
      setChatsLoading(false)
    }
  }, [currentUser])

  useEffect(() => { loadChats() }, [loadChats])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, sending])

  // Auto-collapse the side panels on small screens so the chat dominates.
  useEffect(() => {
    function adjust() {
      if (typeof window === 'undefined') return
      if (window.innerWidth < 1024) {
        setContextOpen(false)
        setHistoryOpen(false)
      }
    }
    adjust()
    window.addEventListener('resize', adjust)
    return () => window.removeEventListener('resize', adjust)
  }, [])

  async function pickChat(chatId) {
    if (!chatId || chatId === activeChatId) return
    setError('')
    setActiveChatId(chatId)
    try {
      const list = await listAiChatMessages(chatId)
      setMessages(
        list.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content || '',
          intent: m.intent || null,
          followUps: null,
          createdAt: m.createdAt || null,
        })),
      )
      const found = chats.find((c) => c.id === chatId)
      if (found) {
        if (found.grade) setGrade(found.grade)
        if (found.subject) setSubject(found.subject)
        if (found.term) setTerm(String(found.term))
        if (found.week) setWeek(String(found.week))
        if (found.duration) setDuration(String(found.duration))
        if (found.learnerLevel) setLearnerLevel(found.learnerLevel)
        if (typeof found.weakAreas === 'string') setWeakAreas(found.weakAreas)
      }
    } catch (err) {
      setError('Could not load that chat. Please try again.')
      console.warn('[chatAssistant] load messages failed', err)
    }
  }

  function startNewChat() {
    setActiveChatId(null)
    setMessages([])
    setInput('')
    setError('')
    inputRef.current?.focus()
  }

  async function send(text) {
    if (!allowed) {
      setError('Only teachers and admins can use the AI Co-Pilot.')
      return
    }
    if (sending) return
    const finalMessage = (text || input || '').trim()
    if (!finalMessage) {
      setError('Type a message so the assistant knows how to help.')
      return
    }

    setError('')
    setSending(true)

    // Build a tiny "previousChatContext" from the last assistant turn so
    // single-shot follow-ups still feel coherent even on a brand-new
    // chat session.
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
    const previousChatContext = lastAssistant?.content?.slice(0, 1500) || ''

    const localUserMsg = {
      id: `local-${nowMs()}`,
      role: 'user',
      content: finalMessage,
      createdAt: { _local: nowMs() },
    }
    setMessages((prev) => [...prev, localUserMsg])
    setInput('')

    try {
      const payload = {
        chatId: activeChatId || null,
        message: finalMessage,
        grade,
        subject,
        term: term || '',
        week: week || '',
        duration: duration || '',
        learnerLevel,
        weakAreas: weakAreas.trim(),
        previousChatContext,
      }
      const result = await sendChatMessage(payload)
      if (!result || typeof result !== 'object') {
        throw new Error('Empty response from AI.')
      }
      const aiMsg = {
        id: result.messageId || `ai-${nowMs()}`,
        role: 'assistant',
        content: result.content || '',
        intent: result.intent || null,
        intentLabel: result.intentLabel || null,
        followUps: Array.isArray(result.followUps) && result.followUps.length
          ? result.followUps
          : DEFAULT_FOLLOW_UPS,
        createdAt: { _local: nowMs() },
      }
      setMessages((prev) => [...prev, aiMsg])
      if (result.chatId && result.chatId !== activeChatId) {
        setActiveChatId(result.chatId)
      }
      loadChats()
    } catch (err) {
      console.error('[chatAssistant] send failed', err)
      const detail = err?.message || 'Something went wrong. Please try again.'
      setError(detail)
      setMessages((prev) => prev.filter((m) => m.id !== localUserMsg.id))
      if (finalMessage) setInput(finalMessage)
    } finally {
      setSending(false)
    }
  }

  function handleSuggestionChip(chip) {
    if (sending) return
    setInput('')
    send(chip.prompt)
  }

  function handleFollowUp(message, action) {
    if (sending) return
    if (action.actionId === 'save') return // handled by Word/PDF/Copy buttons
    const prompt = buildFollowUpPrompt(action.actionId, message.content || '')
    if (!prompt) return
    send(prompt)
  }

  async function handleCopy(message) {
    try {
      await navigator.clipboard.writeText(message.content || '')
      return true
    } catch {
      return false
    }
  }

  function titleForMessage(message) {
    const subjLabel = SUBJECTS.find((s) => s.id === subject)?.label || subject || ''
    const grLabel = GRADES.find((g) => g.id === grade)?.label || grade || ''
    const intentBit = message.intentLabel || 'AI Co-Pilot'
    return `${intentBit} — ${grLabel}${subjLabel ? ` · ${subjLabel}` : ''}`
  }

  async function handleDownloadWord(message) {
    try {
      await downloadAiCopilotWord(message.content || '', titleForMessage(message))
    } catch (err) {
      setError(err?.message || 'Could not generate the Word document.')
    }
  }

  function handleDownloadPdf(message) {
    try {
      downloadAiCopilotPdf(message.content || '', titleForMessage(message))
    } catch (err) {
      setError(err?.message || 'Could not open the PDF preview.')
    }
  }

  const contextSummary = useMemo(() => {
    return [
      grade ? GRADES.find((g) => g.id === grade)?.label : null,
      subject ? SUBJECTS.find((s) => s.id === subject)?.label : null,
      term ? `Term ${term}` : null,
      week ? `Week ${week}` : null,
      duration ? `${duration} min` : null,
    ].filter(Boolean).join(' · ')
  }, [grade, subject, term, week, duration])

  if (!allowed) {
    return (
      <div className="rounded-2xl border-2 p-6 text-center" style={{ background: '#fff', borderColor: '#0e2a32' }}>
        <div className="mb-3" style={{ fontSize: 36 }}>🔒</div>
        <h2 className="text-lg font-black mb-1" style={{ color: '#0e2a32' }}>Teacher access required</h2>
        <p className="text-sm" style={{ color: '#566f76' }}>
          The AI Co-Pilot is available to teachers and admins. <Link to="/login" className="font-bold underline">Sign in</Link> with a teacher account to continue.
        </p>
      </div>
    )
  }

  return (
    <div
      className="flex rounded-2xl border-2 overflow-hidden"
      style={{ borderColor: '#0e2a32', background: '#f5efe1', minHeight: 'calc(100vh - 160px)' }}
    >
      <ChatHistorySidebar
        chats={chats}
        activeChatId={activeChatId}
        onPick={pickChat}
        onNew={startNewChat}
        loading={chatsLoading}
        open={historyOpen}
        onToggle={() => setHistoryOpen((v) => !v)}
      />

      {/* Main chat column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <div
          className="px-4 sm:px-6 py-3 border-b-2 flex items-center justify-between gap-3 flex-wrap"
          style={{ borderColor: '#e7dfc9', background: '#fff' }}
        >
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wider" style={{ color: '#ff7a2e', letterSpacing: '0.12em' }}>
              Teacher AI Co-Pilot
            </p>
            <p className="text-sm font-bold truncate" style={{ color: '#0e2a32' }}>
              {contextSummary || 'Tell me about your class to get started'}
            </p>
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              <ContextPill label="Grade" value={GRADES.find((g) => g.id === grade)?.label} />
              <ContextPill label="Subject" value={SUBJECTS.find((s) => s.id === subject)?.label} />
              {term && <ContextPill label="Term" value={term} />}
              {week && <ContextPill label="Week" value={week} />}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startNewChat}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black border-2"
              style={{ background: '#fff', color: '#0e2a32', borderColor: '#0e2a32' }}
            >
              <Icon as={Plus} size="sm" /> New
            </button>
            <button
              type="button"
              onClick={() => setContextOpen((v) => !v)}
              className="lg:hidden inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black border-2"
              style={{ background: '#fff', color: '#0e2a32', borderColor: '#0e2a32' }}
            >
              <Icon as={Settings} size="sm" /> Context
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollerRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 flex flex-col gap-3" style={{ background: '#f5efe1' }}>
          {messages.length === 0 && !sending ? (
            <WelcomeBlock teacherName={userProfile?.displayName} />
          ) : (
            messages.map((m, idx) => {
              const isUser = m.role === 'user'
              const isLatestAssistant = !isUser && idx === messages.length - 1
              return (
                <div key={m.id} className="flex flex-col">
                  {!isUser && (
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 16 }}>🦊</span>
                      <span className="text-xs font-black" style={{ color: '#566f76' }}>
                        Zed Teacher AI{m.intentLabel ? ` · ${m.intentLabel}` : ''}
                      </span>
                    </div>
                  )}
                  {isUser ? <UserBubble message={m} /> : <AssistantBubble message={m} />}
                  {!isUser && (isLatestAssistant || m.followUps) && (
                    <FollowUpRow
                      followUps={m.followUps || DEFAULT_FOLLOW_UPS}
                      busy={sending}
                      onAction={(action) => handleFollowUp(m, action)}
                      onCopy={() => handleCopy(m)}
                      onWord={() => handleDownloadWord(m)}
                      onPdf={() => handleDownloadPdf(m)}
                    />
                  )}
                </div>
              )
            })
          )}
          {sending && <PendingBubble />}
        </div>

        {/* Suggestion chips + composer */}
        <div className="border-t-2 px-3 sm:px-6 py-3 space-y-2" style={{ borderColor: '#e7dfc9', background: '#fff' }}>
          {messages.length === 0 && (
            <p className="text-[11px] font-black uppercase tracking-wider mb-1" style={{ color: '#566f76', letterSpacing: '0.08em' }}>
              Try one of these
            </p>
          )}
          <div className="flex gap-2 flex-wrap">
            {SUGGESTION_CHIPS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSuggestionChip(c)}
                disabled={sending}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border-2 transition-colors disabled:opacity-50"
                style={{ background: '#fffaf0', color: '#0e2a32', borderColor: '#e7dfc9' }}
              >
                <Icon as={Sparkles} size="sm" />
                {c.label}
              </button>
            ))}
          </div>

          {error && (
            <div
              className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs font-bold"
              style={{ background: '#ffe2dc', color: '#a91d2c', border: '2px solid #ff7a2e' }}
              role="alert"
            >
              <Icon as={AlertCircle} size="sm" />
              <span className="flex-1">{error}</span>
              <button type="button" onClick={() => setError('')} className="font-black underline">
                Dismiss
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); send() }}
            className="flex items-end gap-2"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="Tell me what you are teaching, or ask anything…"
              rows={2}
              maxLength={1600}
              className="flex-1 rounded-xl border-2 px-3 py-3 text-sm font-medium bg-white resize-none"
              style={{ borderColor: '#0e2a32', color: '#0e2a32', minHeight: 56 }}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black border-2 transition-colors disabled:opacity-50"
              style={{ background: '#ff7a2e', color: '#fff', borderColor: '#ff7a2e', minHeight: 56 }}
            >
              {sending ? <Icon as={RefreshCw} size="sm" /> : <Icon as={Send} size="sm" />}
              <span className="hidden sm:inline">{sending ? 'Sending…' : 'Send'}</span>
            </button>
          </form>
          <p className="text-[11px]" style={{ color: '#8a9aa1' }}>
            Press <kbd className="px-1 py-0.5 rounded bg-[#f5efe1] border" style={{ borderColor: '#d4cab2' }}>Enter</kbd> to send · <kbd className="px-1 py-0.5 rounded bg-[#f5efe1] border" style={{ borderColor: '#d4cab2' }}>Shift+Enter</kbd> for a new line.
          </p>
        </div>
      </div>

      {/* Context panel — collapsible right rail */}
      <div className={`hidden md:flex ${contextOpen ? '' : ''}`}>
        <ContextPanel
          open={contextOpen}
          onToggle={() => setContextOpen((v) => !v)}
          grade={grade} setGrade={setGrade}
          subject={subject} setSubject={setSubject}
          term={term} setTerm={setTerm}
          week={week} setWeek={setWeek}
          duration={duration} setDuration={setDuration}
          learnerLevel={learnerLevel} setLearnerLevel={setLearnerLevel}
          weakAreas={weakAreas} setWeakAreas={setWeakAreas}
        />
      </div>

      {/* Mobile: full-width drawer for Class Context */}
      {contextOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setContextOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute right-0 top-0 bottom-0 w-[88%] max-w-sm flex flex-col"
            style={{ background: '#fffaf0' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ContextPanel
              open
              onToggle={() => setContextOpen(false)}
              grade={grade} setGrade={setGrade}
              subject={subject} setSubject={setSubject}
              term={term} setTerm={setTerm}
              week={week} setWeek={setWeek}
              duration={duration} setDuration={setDuration}
              learnerLevel={learnerLevel} setLearnerLevel={setLearnerLevel}
              weakAreas={weakAreas} setWeakAreas={setWeakAreas}
            />
          </div>
        </div>
      )}
    </div>
  )
}
