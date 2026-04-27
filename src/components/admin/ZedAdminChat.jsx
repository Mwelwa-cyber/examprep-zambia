import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { auth } from '../../firebase/config'

const STORAGE_KEY = 'zed-admin-chat:v1'
const POS_KEY = 'zed-admin-chat-pos:v1'
const ENDPOINT = '/api/zed/chat'
const MAX_PERSISTED_MESSAGES = 50
const DRAG_CLICK_THRESHOLD_PX = 5

function loadCached() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((m) => m && typeof m.role === 'string' && typeof m.text === 'string')
      .slice(-MAX_PERSISTED_MESSAGES)
  } catch {
    return []
  }
}

function persistCache(messages) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(messages.slice(-MAX_PERSISTED_MESSAGES))
    )
  } catch {
    /* sessionStorage may be disabled or quota-full; surfacing this would
       just spam the console for a non-critical feature. */
  }
}

function useIsNarrow() {
  const [narrow, setNarrow] = useState(
    typeof window !== 'undefined' && !window.matchMedia('(min-width: 640px)').matches
  )
  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const mq = window.matchMedia('(min-width: 640px)')
    const handler = (e) => setNarrow(!e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return narrow
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)) }

function loadPosition() {
  try {
    const raw = sessionStorage.getItem(POS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') return parsed
  } catch {
    /* ignore */
  }
  return null
}

function defaultPosition(size) {
  if (typeof window === 'undefined') return { x: 24, y: 24 }
  return { x: 24, y: window.innerHeight - size - 24 }
}

export default function ZedAdminChat() {
  const { currentUser, isAdmin } = useAuth()
  const narrow = useIsNarrow()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(loadCached)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const inFlightRef = useRef(false)
  const listRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { persistCache(messages) }, [messages])

  useEffect(() => {
    if (!open) return
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending, open])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    inputRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const send = useCallback(async () => {
    const message = input.trim()
    if (!message || inFlightRef.current) return
    inFlightRef.current = true
    setSending(true)
    setError('')
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: message }])

    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Please sign in again.')
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      const reply = String(data?.reply || '').trim() || "I didn't catch that — try again."
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }])
    } catch (err) {
      console.error('[ZedAdminChat]', err)
      setError(err?.message || 'Network error')
    } finally {
      // eslint-disable-next-line require-atomic-updates
      inFlightRef.current = false
      setSending(false)
    }
  }, [input])

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const clearChat = () => {
    if (!window.confirm('Clear the visible chat? Zed will still remember context server-side.')) return
    setMessages([])
    setError('')
  }

  const fabSize = narrow ? 48 : 56
  const [pos, setPos] = useState(() => loadPosition() || defaultPosition(fabSize))
  const dragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0, moved: 0 })
  const fabBtnRef = useRef(null)

  // Keep the FAB inside the viewport when window resizes (rotation, devtools, etc.).
  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const onResize = () => setPos((p) => ({
      x: clamp(p.x, 8, window.innerWidth - fabSize - 8),
      y: clamp(p.y, 8, window.innerHeight - fabSize - 8),
    }))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [fabSize])

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return
    e.preventDefault()
    dragRef.current = {
      active: true,
      moved: 0,
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
    }
    try { fabBtnRef.current?.setPointerCapture?.(e.pointerId) } catch { /* ignore */ }
  }

  const onPointerMove = (e) => {
    const d = dragRef.current
    if (!d.active) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    d.moved = Math.max(d.moved, Math.hypot(dx, dy))
    setPos({
      x: clamp(d.originX + dx, 8, window.innerWidth - fabSize - 8),
      y: clamp(d.originY + dy, 8, window.innerHeight - fabSize - 8),
    })
  }

  const onPointerUp = (e) => {
    const d = dragRef.current
    if (!d.active) return
    d.active = false
    try { fabBtnRef.current?.releasePointerCapture?.(e.pointerId) } catch { /* ignore */ }
    if (d.moved < DRAG_CLICK_THRESHOLD_PX) {
      setOpen(true)
    } else {
      try { sessionStorage.setItem(POS_KEY, JSON.stringify(pos)) } catch { /* ignore */ }
    }
  }

  // Anchor the panel to whichever corner the FAB is nearest, so it grows
  // away from the screen edge instead of clipping off-screen.
  const panelAnchor = useMemo(() => {
    if (typeof window === 'undefined') return { side: 'left', vertical: 'bottom' }
    const cx = pos.x + fabSize / 2
    const cy = pos.y + fabSize / 2
    return {
      side: cx < window.innerWidth / 2 ? 'left' : 'right',
      vertical: cy < window.innerHeight / 2 ? 'top' : 'bottom',
    }
  }, [pos, fabSize])

  if (!currentUser || !isAdmin) return null

  const panelStyle = narrow
    ? { bottom: 0, left: 0, right: 0, top: 0, width: '100%', height: '100%', borderRadius: 0 }
    : {
      [panelAnchor.side]: 24,
      [panelAnchor.vertical]: 24,
      width: 380,
      height: 540,
      maxHeight: 'calc(100vh - 48px)',
      borderRadius: 16,
    }

  return (
    <>
      {!open && (
        <button
          ref={fabBtnRef}
          type="button"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-label="Open Zed admin chat (drag to move)"
          style={{
            position: 'fixed',
            top: pos.y,
            left: pos.x,
            width: fabSize,
            height: fabSize,
            padding: 0,
            borderRadius: '50%',
            border: 'none',
            background: '#10B981',
            color: '#fff',
            cursor: dragRef.current.active ? 'grabbing' : 'grab',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9998,
            touchAction: 'none',
          }}
        >
          <picture>
            <source type="image/webp" srcSet="/images/characters/zedbot-help.webp?v=1" />
            <img
              src="/images/characters/zedbot-help.png"
              alt=""
              width={fabSize - 8}
              height={fabSize - 8}
              draggable={false}
              style={{
                width: fabSize - 8,
                height: fabSize - 8,
                objectFit: 'contain',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          </picture>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Chat with Zed"
          style={{
            position: 'fixed',
            ...panelStyle,
            background: '#fff',
            boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9999,
            color: '#111827',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <header style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 14px',
            background: '#10B981',
            color: '#fff',
            flexShrink: 0,
          }}>
            <strong style={{ flex: 1, fontSize: 15 }}>Zed</strong>
            <button
              type="button"
              onClick={clearChat}
              aria-label="Clear chat"
              title="Clear chat"
              style={iconBtnStyle}
            >
              ⌫
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              title="Close"
              style={iconBtnStyle}
            >
              ×
            </button>
          </header>

          <div
            ref={listRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 12,
              background: '#f9fafb',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {messages.length === 0 && (
              <p style={{ color: '#6b7280', fontSize: 13, margin: 'auto', textAlign: 'center' }}>
                Ask Zed anything — same brain as the Telegram bot.
                <br />Try: "What's left on games?"
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '8px 12px',
                  borderRadius: 14,
                  background: m.role === 'user' ? '#10B981' : '#fff',
                  color: m.role === 'user' ? '#fff' : '#111827',
                  border: m.role === 'user' ? 'none' : '1px solid #e5e7eb',
                  fontSize: 14,
                  lineHeight: 1.45,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {m.text}
              </div>
            ))}
            {sending && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '8px 12px',
                borderRadius: 14,
                background: '#fff',
                border: '1px solid #e5e7eb',
                color: '#6b7280',
                fontSize: 13,
                fontStyle: 'italic',
              }}>
                Zed is thinking…
              </div>
            )}
            {error && (
              <div style={{
                alignSelf: 'stretch',
                padding: '8px 12px',
                borderRadius: 8,
                background: '#fef2f2',
                color: '#991b1b',
                fontSize: 13,
              }}>
                {error}
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            gap: 8,
            padding: 10,
            borderTop: '1px solid #e5e7eb',
            background: '#fff',
            flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={sending}
              placeholder="Message Zed…"
              rows={1}
              style={{
                flex: 1,
                resize: 'none',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 14,
                fontFamily: 'inherit',
                lineHeight: 1.4,
                maxHeight: 120,
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={send}
              disabled={sending || !input.trim()}
              style={{
                padding: '0 16px',
                borderRadius: 8,
                border: 'none',
                background: sending || !input.trim() ? '#d1d5db' : '#10B981',
                color: '#fff',
                fontWeight: 600,
                cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
                fontSize: 14,
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  )
}

const iconBtnStyle = {
  width: 28,
  height: 28,
  border: 'none',
  background: 'rgba(255,255,255,0.15)',
  color: '#fff',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
