import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import {
  CONTENT_TYPES,
  GRADES,
  SUBJECTS,
  LEARNER_LEVELS,
  listAiChatMessages,
  listMyAiChats,
  lookupContentType,
  sendTeacherAIMessage,
} from '../../../utils/teacherAICopilotService'
import {
  downloadAiCopilotPdf,
  downloadAiCopilotWord,
} from '../../../utils/aiCopilotExport'
import {
  Send,
  Plus,
  Sparkles,
  FileText,
  Download,
  PencilLine,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
} from '../../ui/icons'
import Icon from '../../ui/Icon'

const FALLBACK_MESSAGE =
  "Hi! I'm Zed Teacher AI — your CBC-aligned co-pilot. Pick a grade and subject, type a topic, then choose what you'd like me to build."

function nowMs() {
  return Date.now()
}

function ChatBubble({ message, isUser }) {
  const cls = isUser
    ? 'self-end max-w-[88%] rounded-2xl rounded-br-md px-4 py-3 text-sm font-medium'
    : 'self-start max-w-[92%] rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap'
  const style = isUser
    ? { background: '#0e2a32', color: '#fff' }
    : { background: '#fff', color: '#0e2a32', border: '1px solid #e7dfc9' }

  return (
    <div className={cls} style={style}>
      {message.content}
    </div>
  )
}

function PendingBubble() {
  return (
    <div
      className="self-start max-w-[88%] rounded-2xl rounded-bl-md px-4 py-3 text-sm flex items-center gap-2"
      style={{ background: '#fff', color: '#0e2a32', border: '1px solid #e7dfc9' }}
    >
      <span
        className="inline-block w-2 h-2 rounded-full animate-pulse"
        style={{ background: '#ff7a2e' }}
      />
      <span
        className="inline-block w-2 h-2 rounded-full animate-pulse"
        style={{ background: '#ff7a2e', animationDelay: '120ms' }}
      />
      <span
        className="inline-block w-2 h-2 rounded-full animate-pulse"
        style={{ background: '#ff7a2e', animationDelay: '240ms' }}
      />
      <span className="ml-1 text-xs font-bold" style={{ color: '#566f76' }}>
        Zed AI is thinking…
      </span>
    </div>
  )
}

function ActionRow({ message, onSave, onEdit, onWord, onPdf, onCreateTest, onCopy, busy }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      // clipboard unavailable — degrade silently
    }
    onCopy?.()
  }

  const Btn = ({ icon, label, onClick, disabled, primary }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={!!disabled || !!busy}
      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      style={
        primary
          ? { background: '#ff7a2e', color: '#fff', borderColor: '#ff7a2e' }
          : { background: '#fff', color: '#0e2a32', borderColor: '#0e2a32' }
      }
    >
      {icon ? <Icon as={icon} size="sm" /> : null}
      {label}
    </button>
  )

  return (
    <div className="flex flex-wrap gap-2 mt-2 mb-1">
      <Btn icon={Check} label={message.savedContentId ? 'Saved' : 'Save'} onClick={onSave} disabled={!!message.savedContentId} primary={!message.savedContentId} />
      <Btn icon={PencilLine} label="Edit" onClick={onEdit} />
      <Btn icon={FileText} label="Download Word" onClick={onWord} />
      <Btn icon={Download} label="Download PDF" onClick={onPdf} />
      <Btn icon={Sparkles} label="Create Test from This" onClick={onCreateTest} />
      <Btn icon={copied ? Check : Copy} label={copied ? 'Copied' : 'Copy'} onClick={handleCopy} />
    </div>
  )
}

function PillSelect({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-1 min-w-[140px] flex-1">
      <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: '#566f76', letterSpacing: '0.08em' }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border-2 px-3 py-2 text-sm font-bold bg-white"
        style={{ borderColor: '#0e2a32', color: '#0e2a32' }}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

function ContentTypeButtons({ value, onChange, disabled }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {CONTENT_TYPES.map((c) => {
        const active = value === c.id
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            disabled={disabled}
            className="flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition-all duration-150 text-left disabled:opacity-50"
            style={{
              background: active ? (c.dark ? '#0e2a32' : c.accent) : '#fff',
              borderColor: active ? '#ff7a2e' : '#0e2a32',
              color: active && c.dark ? '#fff' : '#0e2a32',
              transform: active ? 'translateY(-1px)' : 'none',
              boxShadow: active ? '0 4px 12px rgba(255,122,46,0.25)' : 'none',
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{c.emoji}</span>
            <span className="truncate">{c.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function ChatHistorySidebar({ chats, activeChatId, onPick, onNew, loading }) {
  return (
    <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 border-r-2" style={{ borderColor: '#e7dfc9', background: '#fffaf0' }}>
      <div className="p-3 border-b-2" style={{ borderColor: '#e7dfc9' }}>
        <button
          type="button"
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-black transition-colors"
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
            No chats yet. Start by picking a content type below.
          </p>
        ) : chats.map((c) => {
          const active = activeChatId === c.id
          const ct = lookupContentType(c.lastContentType)
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onPick(c.id)}
              className="w-full text-left flex items-start gap-2 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors"
              style={{
                background: active ? '#fff' : 'transparent',
                color: '#0e2a32',
                border: active ? '2px solid #ff7a2e' : '2px solid transparent',
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{ct.emoji}</span>
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
    </aside>
  )
}

function GuidanceEmpty({ teacherName }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <div
        className="rounded-full grid place-items-center mb-3"
        style={{ width: 64, height: 64, background: '#fde2c4', fontSize: 32 }}
      >
        🦊
      </div>
      <h2 className="text-lg sm:text-xl font-black mb-1" style={{ color: '#0e2a32', fontFamily: "'Fraunces', serif" }}>
        {teacherName ? `Welcome back, ${teacherName.split(' ')[0]}` : 'Hi, teacher!'}
      </h2>
      <p className="text-sm max-w-md mb-4" style={{ color: '#566f76' }}>
        {FALLBACK_MESSAGE}
      </p>
      <ul className="text-xs space-y-1 max-w-sm w-full" style={{ color: '#566f76' }}>
        <li>• Pick a <strong>grade</strong> and <strong>subject</strong>.</li>
        <li>• Type a <strong>topic</strong> like “Fractions of shapes”.</li>
        <li>• Tap a content type — Lesson Plan, Notes, Test, or Create Everything.</li>
      </ul>
    </div>
  )
}

export default function TeacherAICopilot() {
  const { currentUser, userProfile, isAdmin, isTeacher } = useAuth()

  const [grade, setGrade] = useState('G5')
  const [subject, setSubject] = useState('mathematics')
  const [topic, setTopic] = useState('')
  const [term, setTerm] = useState('1')
  const [week, setWeek] = useState('1')
  const [duration, setDuration] = useState('40')
  const [learnerLevel, setLearnerLevel] = useState('mixed')
  const [weakAreas, setWeakAreas] = useState('')
  const [contentType, setContentType] = useState('lesson_plan')

  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [chats, setChats] = useState([])
  const [chatsLoading, setChatsLoading] = useState(false)

  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editDraft, setEditDraft] = useState('')

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
      console.warn('[copilot] failed to load chats', err)
    } finally {
      setChatsLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    loadChats()
  }, [loadChats])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, sending])

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
          contentType: m.contentType || null,
          savedContentId: m.savedContentId || null,
          createdAt: m.createdAt || null,
        })),
      )
      // Re-hydrate the form selectors from the chat header so a follow-up
      // message inherits the same context.
      const found = chats.find((c) => c.id === chatId)
      if (found) {
        if (found.grade) setGrade(found.grade)
        if (found.subject) setSubject(found.subject)
        if (found.topic) setTopic(found.topic)
        if (found.lastContentType) setContentType(found.lastContentType)
      }
    } catch (err) {
      setError('Could not load that chat. Please try again.')
      console.warn('[copilot] load messages failed', err)
    }
  }

  function startNewChat() {
    setActiveChatId(null)
    setMessages([])
    setInput('')
    setError('')
    setEditingMessageId(null)
    setEditDraft('')
    inputRef.current?.focus()
  }

  async function send({ overrideContentType, overrideMessage } = {}) {
    if (!allowed) {
      setError('Only teachers and admins can use the AI Co-Pilot.')
      return
    }
    if (sending) return
    const finalContentType = overrideContentType || contentType
    const finalMessage = (overrideMessage || input || '').trim()
    if (!finalMessage && !finalContentType) {
      setError('Type a question or pick a content type.')
      return
    }

    setError('')
    setSending(true)

    const localUserMsg = {
      id: `local-${nowMs()}`,
      role: 'user',
      content: finalMessage || `Generate a ${finalContentType.replace(/_/g, ' ')}.`,
      contentType: finalContentType,
      createdAt: { _local: nowMs() },
    }
    setMessages((prev) => [...prev, localUserMsg])
    setInput('')

    try {
      const payload = {
        chatId: activeChatId || null,
        grade,
        subject,
        topic: topic.trim(),
        term: String(term),
        week: String(week),
        duration: String(duration),
        contentType: finalContentType,
        actionType: 'generate',
        learnerLevel,
        weakAreas: weakAreas.trim(),
        message: finalMessage,
      }
      const result = await sendTeacherAIMessage(payload)
      if (!result || typeof result !== 'object') {
        throw new Error('Empty response from AI.')
      }
      const aiMsg = {
        id: result.messageId || `ai-${nowMs()}`,
        role: 'assistant',
        content: result.content || '',
        contentType: finalContentType,
        savedContentId: result.contentDocId || null,
        createdAt: { _local: nowMs() },
      }
      setMessages((prev) => [...prev, aiMsg])
      if (result.chatId && result.chatId !== activeChatId) {
        setActiveChatId(result.chatId)
        loadChats()
      } else {
        loadChats()
      }
    } catch (err) {
      console.error('[copilot] generation failed', err)
      const detail = err?.message || 'Something went wrong. Please try again.'
      setError(detail)
      // Roll back the local user message so the chat reflects what's saved
      // server-side. The user's text is still in the input field via fallback.
      setMessages((prev) => prev.filter((m) => m.id !== localUserMsg.id))
      if (finalMessage) setInput(finalMessage)
    } finally {
      setSending(false)
    }
  }

  function startEdit(message) {
    setEditingMessageId(message.id)
    setEditDraft(message.content || '')
  }

  function cancelEdit() {
    setEditingMessageId(null)
    setEditDraft('')
  }

  function saveLocalEdit() {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === editingMessageId ? { ...m, content: editDraft, locallyEdited: true } : m,
      ),
    )
    cancelEdit()
  }

  async function followUp(messageContent, actionLabel) {
    setInput(`Follow up on this: ${actionLabel}`)
    await send({ overrideMessage: `Building on the previous response, please: ${actionLabel}\n\nReference content:\n${(messageContent || '').slice(0, 600)}` })
  }

  async function handleSave(message) {
    // The server already saved the message + content. Mark as saved locally
    // and refresh the chat list so the title preview updates.
    setMessages((prev) =>
      prev.map((m) =>
        m.id === message.id && !m.savedContentId
          ? { ...m, savedContentId: m.savedContentId || `local-${nowMs()}` }
          : m,
      ),
    )
    loadChats()
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

  function titleForMessage(message) {
    const ct = lookupContentType(message.contentType)
    const subjLabel = SUBJECTS.find((s) => s.id === subject)?.label || subject
    return `${ct.label} — ${subjLabel}${topic ? ` — ${topic}` : ''}`
  }

  const headerHint = useMemo(() => {
    const grLabel = GRADES.find((g) => g.id === grade)?.label || grade
    const subjLabel = SUBJECTS.find((s) => s.id === subject)?.label || subject
    return `${grLabel} · ${subjLabel}${topic ? ` · ${topic}` : ''}`
  }, [grade, subject, topic])

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
      />

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
              {headerHint}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startNewChat}
              className="lg:hidden inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black border-2"
              style={{ background: '#fff', color: '#0e2a32', borderColor: '#0e2a32' }}
            >
              <Icon as={Plus} size="sm" /> New
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollerRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 flex flex-col gap-3" style={{ background: '#f5efe1' }}>
          {messages.length === 0 && !sending ? (
            <GuidanceEmpty teacherName={userProfile?.displayName} />
          ) : (
            messages.map((m) => {
              const isUser = m.role === 'user'
              const isEditing = editingMessageId === m.id
              return (
                <div key={m.id} className="flex flex-col">
                  {!isUser && (
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 18 }}>{lookupContentType(m.contentType).emoji}</span>
                      <span className="text-xs font-black" style={{ color: '#566f76' }}>
                        Zed Teacher AI · {lookupContentType(m.contentType).label}
                      </span>
                      {m.locallyEdited && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: '#fde2c4', color: '#a64500' }}>
                          edited
                        </span>
                      )}
                    </div>
                  )}
                  {isEditing ? (
                    <div className="self-start max-w-[92%] w-full rounded-2xl border-2 p-3" style={{ background: '#fff', borderColor: '#ff7a2e' }}>
                      <textarea
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        rows={Math.min(20, Math.max(6, editDraft.split('\n').length + 1))}
                        className="w-full text-sm font-medium leading-relaxed bg-transparent outline-none resize-y"
                        style={{ color: '#0e2a32' }}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={saveLocalEdit}
                          className="rounded-xl px-3 py-1.5 text-xs font-black border-2"
                          style={{ background: '#ff7a2e', color: '#fff', borderColor: '#ff7a2e' }}
                        >
                          Save edits
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-xl px-3 py-1.5 text-xs font-black border-2"
                          style={{ background: '#fff', color: '#0e2a32', borderColor: '#0e2a32' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <ChatBubble message={m} isUser={isUser} />
                  )}
                  {!isUser && !isEditing && (
                    <ActionRow
                      message={m}
                      busy={sending}
                      onSave={() => handleSave(m)}
                      onEdit={() => startEdit(m)}
                      onWord={() => handleDownloadWord(m)}
                      onPdf={() => handleDownloadPdf(m)}
                      onCreateTest={() => followUp(m.content, 'create a 10-question test (with marking key) from this content')}
                    />
                  )}
                </div>
              )
            })
          )}
          {sending && <PendingBubble />}
        </div>

        {/* Selectors + Composer */}
        <div className="border-t-2 px-3 sm:px-6 py-3 space-y-3" style={{ borderColor: '#e7dfc9', background: '#fff' }}>
          <div className="flex gap-2 flex-wrap">
            <PillSelect label="Grade" value={grade} onChange={setGrade} options={GRADES} />
            <PillSelect label="Subject" value={subject} onChange={setSubject} options={SUBJECTS} />
            <PillSelect label="Term" value={term} onChange={setTerm} options={[
              { id: '1', label: 'Term 1' },
              { id: '2', label: 'Term 2' },
              { id: '3', label: 'Term 3' },
            ]} />
            <PillSelect label="Week" value={week} onChange={setWeek} options={Array.from({ length: 14 }).map((_, i) => ({ id: String(i + 1), label: `Week ${i + 1}` }))} />
            <PillSelect label="Lesson length (mins)" value={duration} onChange={setDuration} options={[
              { id: '20', label: '20 mins' },
              { id: '30', label: '30 mins' },
              { id: '40', label: '40 mins' },
              { id: '60', label: '60 mins' },
              { id: '80', label: '80 mins' },
            ]} />
            <PillSelect label="Learner level" value={learnerLevel} onChange={setLearnerLevel} options={LEARNER_LEVELS} />
          </div>

          <div className="flex gap-2 flex-wrap">
            <label className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: '#566f76', letterSpacing: '0.08em' }}>
                Topic
              </span>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Fractions of shapes"
                className="rounded-xl border-2 px-3 py-2 text-sm font-bold bg-white"
                style={{ borderColor: '#0e2a32', color: '#0e2a32' }}
                maxLength={160}
              />
            </label>
            <label className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: '#566f76', letterSpacing: '0.08em' }}>
                Weak areas (optional)
              </span>
              <input
                type="text"
                value={weakAreas}
                onChange={(e) => setWeakAreas(e.target.value)}
                placeholder="e.g. simplifying fractions"
                className="rounded-xl border-2 px-3 py-2 text-sm font-bold bg-white"
                style={{ borderColor: '#0e2a32', color: '#0e2a32' }}
                maxLength={300}
              />
            </label>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: '#566f76', letterSpacing: '0.08em' }}>
              Choose a content type
            </p>
            <ContentTypeButtons value={contentType} onChange={setContentType} disabled={sending} />
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
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault(); send()
                }
              }}
              placeholder="Ask anything, or hit a content type to generate. Press ⌘/Ctrl + Enter to send."
              rows={2}
              maxLength={1600}
              className="flex-1 rounded-xl border-2 px-3 py-2 text-sm font-medium bg-white resize-none"
              style={{ borderColor: '#0e2a32', color: '#0e2a32' }}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black border-2 transition-colors disabled:opacity-50"
              style={{ background: '#ff7a2e', color: '#fff', borderColor: '#ff7a2e', height: 60 }}
            >
              {sending ? <Icon as={RefreshCw} size="sm" /> : <Icon as={Send} size="sm" />}
              <span className="hidden sm:inline">{sending ? 'Sending…' : 'Send'}</span>
            </button>
          </form>
          <p className="text-[11px]" style={{ color: '#8a9aa1' }}>
            Tip: Press <kbd className="px-1 py-0.5 rounded bg-[#f5efe1] border" style={{ borderColor: '#d4cab2' }}>⌘/Ctrl + Enter</kbd> to send. Saved chats appear in the sidebar.
          </p>
        </div>
      </div>
    </div>
  )
}
