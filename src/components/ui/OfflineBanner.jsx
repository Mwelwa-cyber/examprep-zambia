import { useAuth } from '../../contexts/AuthContext'

/**
 * Slim banner pinned to the top of the viewport while the device reports it
 * is offline (navigator.onLine === false). Non-blocking by design — the user
 * keeps whatever data they already have on screen, and we just tell them why
 * fresh loads aren't working.
 *
 * Pairs with the AuthContext online/offline listeners and the visibility-
 * change handler that force-refreshes the Firebase ID token once connectivity
 * is restored. Together they're what keeps a long-idle tab from blowing up
 * with a "permission-denied" cascade when the network returns.
 */
export default function OfflineBanner() {
  const { online } = useAuth()
  if (online) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[10002] flex items-center justify-center px-4 py-2 text-center text-xs sm:text-sm font-black"
      style={{
        background: '#7C2D12',           // amber-900-ish, theme-agnostic
        color: '#FFF7ED',
        boxShadow: '0 1px 0 rgba(0,0,0,0.15)',
      }}
    >
      <span aria-hidden="true" style={{ marginRight: 8 }}>⚠️</span>
      <span>
        Connection lost. Please check your internet and try again.
      </span>
    </div>
  )
}
