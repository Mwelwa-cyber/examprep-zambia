import { Component } from 'react'

/**
 * ErrorBoundary — catches render-time exceptions anywhere in the React tree
 * and shows a friendly recovery card instead of a blank white screen.
 *
 * Wrapped around <App /> in main.jsx so a lazy-chunk load failure, a malformed
 * Firestore payload, or any unexpected render throw still leaves the user with
 * a clear way to recover (reload or jump home).
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Surface the full stack for devs; kept out of the UI for learners.
    console.error('ErrorBoundary caught:', error, info?.componentStack)
  }

  handleReload = () => {
    // Hard reload so any broken lazy chunk gets a fresh network fetch.
    window.location.reload()
  }

  handleHome = () => {
    window.location.assign('/')
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const message = this.state.error?.message || 'An unexpected error occurred.'

    return (
      <div className="min-h-screen theme-bg flex items-center justify-center p-4">
        <div className="theme-card border theme-border rounded-3xl px-6 py-10 max-w-md w-full text-center shadow-sm">
          <div className="text-5xl mb-3">😕</div>
          <p className="theme-text-muted font-black text-xs uppercase tracking-widest mb-2">
            Something went wrong
          </p>
          <h1 className="theme-text text-2xl font-black leading-tight mb-2">
            We hit a snag loading this page.
          </h1>
          <p className="theme-text-muted text-sm mb-6">
            Try reloading — this usually fixes it. If it keeps happening, head back home and try again from there.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 theme-accent-fill theme-on-accent font-black text-sm px-5 py-3 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              ↻ Reload page
            </button>
            <button
              type="button"
              onClick={this.handleHome}
              className="inline-flex items-center justify-center gap-2 theme-card border theme-border theme-text font-black text-sm px-5 py-3 rounded-2xl hover:theme-bg-subtle transition-colors"
            >
              ← Go home
            </button>
          </div>

          {import.meta.env.DEV && (
            <details className="mt-6 text-left">
              <summary className="theme-text-muted text-xs font-bold cursor-pointer">
                Developer details
              </summary>
              <pre className="mt-2 text-xs theme-text-muted whitespace-pre-wrap break-words">
                {message}
              </pre>
            </details>
          )}
        </div>
      </div>
    )
  }
}
