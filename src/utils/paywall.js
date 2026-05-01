// Singleton bus so any module can call `paywall.show(reason, ctx)` without
// prop-drilling. The host component (PaywallHost) mounts once at the root and
// subscribes to events.

const listeners = new Set()
let currentState = null

export const paywall = {
  show(reason, ctx = {}) {
    currentState = { reason, ctx }
    listeners.forEach((fn) => fn(currentState))
  },
  hide() {
    currentState = null
    listeners.forEach((fn) => fn(null))
  },
  subscribe(fn) {
    listeners.add(fn)
    fn(currentState)
    return () => listeners.delete(fn)
  },
}
