import { Component } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Per-route boundary. Sits inside ProtectedRoute so a single page that throws
 * (e.g. a Firestore listener firing with a stale token, a malformed payload
 * from imports, a quiz runner crashing on bad data) leaves the surrounding
 * shell — Navbar, sidebar, modals, banners — untouched, and the rest of the
 * app stays usable.
 *
 * Differs from the global ErrorBoundary in two ways:
 *   1. It auto-resets when the user navigates somewhere else (resetKey =
 *      pathname). Going Home should always work, even after a render crash.
 *   2. It auto-resets when the tab becomes visible again or connectivity
 *      returns, on the assumption that the underlying problem (stale token,
 *      offline) has by then been handled by AuthContext.
 *
 * Auth-flavoured errors are forwarded to the AuthContext via
 * `onAuthError` so the SessionExpiredModal takes over instead of showing a
 * generic crash card. Network errors render an offline-aware message but
 * don't sign anyone out.
 */
function classify(err) {
  if (!err) return 'unknown'
  const code = String(err.code || '')
  const msg = String(err.message || err)

  if (code.startsWith('auth/')) {
    if (code === 'auth/network-request-failed' || code === 'auth/timeout') return 'network'
    return 'auth'
  }
  if (code === 'permission-denied' || code === 'unauthenticated') return 'auth'
  if (
    code === 'unavailable' || code === 'deadline-exceeded' ||
    code === 'cancelled' || code === 'aborted' ||
    code === 'resource-exhausted' || code === 'internal'
  ) return 'network'
  if (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Loading chunk .* failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg)
  ) return 'chunk'
  if (
    /network|offline|failed to fetch|Load failed|NetworkError/i.test(msg) &&
    !/permission/i.test(msg)
  ) return 'network'
  return 'unknown'
}

class RouteErrorBoundaryClass extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, kind: 'unknown' }
    this._onResume = this._onResume.bind(this)
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error, kind: classify(error) }
  }

  componentDidMount() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this._onResume)
      window.addEventListener('online', this._onResume)
      window.addEventListener('focus', this._onResume)
    }
  }

  componentWillUnmount() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this._onResume)
      window.removeEventListener('online', this._onResume)
      window.removeEventListener('focus', this._onResume)
    }
  }

  _onResume() {
    if (!this.state.hasError) return
    // When the tab returns or connectivity comes back, optimistically retry
    // the failed render. AuthContext has already refreshed the token by this
    // point, so most stale-token crashes resolve on the second attempt.
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
    this.setState({ hasError: false, error: null, kind: 'unknown' })
  }

  componentDidCatch(error, info) {
    console.error('RouteErrorBoundary caught:', error, info?.componentStack)
    const kind = classify(error)
    if (kind === 'auth' && typeof this.props.onAuthError === 'function') {
      // Hand off to AuthContext.triggerSessionExpired — the global modal
      // handles redirect.
      try { this.props.onAuthError(error) } catch (e) {
        console.warn('onAuthError handler threw:', e)
      }
    }
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null, kind: 'unknown' })
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const { kind, error } = this.state
    const handleRetry = () => this.setState({ hasError: false, error: null, kind: 'unknown' })
    const handleHome  = () => { window.location.assign('/') }
    const handleReload = () => { window.location.reload() }

    // Auth errors show the lighter card here, but the SessionExpiredModal
    // launched from AuthContext will sit on top of it and own the recovery.
    let title = 'We hit a snag loading this page.'
    let body  = 'Try again — this usually fixes it. If it keeps happening, head back home and try from there.'
    let icon  = '😕'

    if (kind === 'auth') {
      title = 'Your session expired.'
      body  = 'Please log in again to continue.'
      icon  = '🔒'
    } else if (kind === 'network') {
      title = 'Connection lost.'
      body  = 'Please check your internet and try again.'
      icon  = '📡'
    } else if (kind === 'chunk') {
      // Defer to global ErrorBoundary's auto-reload on chunk errors — but if
      // we're here, the cooldown has tripped, so just offer a reload.
      title = "We're updating ZedExams in the background."
      body  = 'Reload the page to pick up the latest version.'
      icon  = '✨'
    }

    return (
      <div className="w-full flex items-center justify-center py-12 px-4">
        <div className="theme-card border theme-border rounded-3xl px-6 py-10 max-w-md w-full text-center shadow-sm">
          <div className="text-5xl mb-3">{icon}</div>
          <p className="theme-text-muted font-black text-xs uppercase tracking-widest mb-2">
            Something went wrong
          </p>
          <h1 className="theme-text text-2xl font-black leading-tight mb-2">
            {title}
          </h1>
          <p className="theme-text-muted text-sm mb-6">
            {body}
          </p>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {kind !== 'auth' && (
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center justify-center gap-2 theme-accent-fill theme-on-accent font-black text-sm px-5 py-3 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                ↻ Try again
              </button>
            )}
            {kind === 'chunk' ? (
              <button
                type="button"
                onClick={handleReload}
                className="inline-flex items-center justify-center gap-2 theme-accent-fill theme-on-accent font-black text-sm px-5 py-3 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                Reload page
              </button>
            ) : (
              <button
                type="button"
                onClick={handleHome}
                className="inline-flex items-center justify-center gap-2 theme-card border theme-border theme-text font-black text-sm px-5 py-3 rounded-2xl hover:theme-bg-subtle transition-colors"
              >
                ← Go home
              </button>
            )}
          </div>

          {import.meta.env.DEV && error && (
            <details className="mt-6 text-left">
              <summary className="theme-text-muted text-xs font-bold cursor-pointer">
                Developer details
              </summary>
              <pre className="mt-2 text-xs theme-text-muted whitespace-pre-wrap break-words">
                {String(error.message || error)}
              </pre>
            </details>
          )}
        </div>
      </div>
    )
  }
}

/**
 * Hook-aware wrapper so we can pull the current pathname for resetKey and
 * (in the future) read AuthContext directly. Class boundaries can't use
 * hooks themselves, so we pipe values in as props.
 */
export default function RouteErrorBoundary({ children, onAuthError }) {
  const location = useLocation()
  return (
    <RouteErrorBoundaryClass
      resetKey={location.pathname}
      onAuthError={onAuthError}
    >
      {children}
    </RouteErrorBoundaryClass>
  )
}
