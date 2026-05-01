import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

/**
 * Global session-expired surface. Mounted once at the App level. Becomes
 * visible whenever AuthContext.sessionExpired is true — typically after a
 * Firebase ID-token refresh fails (revoked, expired beyond auto-refresh
 * window, account disabled). The single CTA signs out cleanly and routes
 * back to /login.
 *
 * Design and copy match the existing recovery cards (ErrorBoundary,
 * MissingProfileRecovery) — same theme tokens, same structure, no new
 * visual language.
 */
export default function SessionExpiredModal() {
  const { sessionExpired, clearSessionExpired } = useAuth()
  const navigate = useNavigate()
  const [working, setWorking] = useState(false)

  if (!sessionExpired) return null

  async function handleLogin() {
    setWorking(true)
    try {
      await clearSessionExpired()
    } finally {
      setWorking(false)
      navigate('/login', { replace: true })
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
    >
      <div className="theme-card border theme-border rounded-3xl px-6 py-10 max-w-md w-full text-center shadow-xl">
        <div className="text-5xl mb-3">🔒</div>
        <p className="theme-text-muted font-black text-xs uppercase tracking-widest mb-2">
          Session ended
        </p>
        <h1
          id="session-expired-title"
          className="theme-text text-2xl font-black leading-tight mb-2"
        >
          Your session expired. Please log in again.
        </h1>
        <p className="theme-text-muted text-sm mb-6">
          For your security, ZedExams signed you out after a long period of
          inactivity. Your work is saved — just sign in to pick up where you
          left off.
        </p>

        <button
          type="button"
          onClick={handleLogin}
          disabled={working}
          className="inline-flex items-center justify-center gap-2 theme-accent-fill theme-on-accent font-black text-sm px-6 py-3 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {working ? 'Signing you out…' : 'Log in again'}
        </button>
      </div>
    </div>
  )
}
