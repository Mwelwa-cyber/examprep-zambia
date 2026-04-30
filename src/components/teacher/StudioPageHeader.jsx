import { Link } from 'react-router-dom'

/**
 * Shared header for teacher studio pages — keeps the same look as
 * the dashboard hero/eyebrow combo. Place this at the top of any
 * generator/view page so the whole teacher section feels unified.
 */
export default function StudioPageHeader({
  eyebrow,
  title,
  subtitle,
  emoji,
  backTo = '/teacher',
  backLabel = 'Studios',
  rightSlot = null,
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 no-underline"
          style={{ color: '#0e2a32', fontSize: 13, fontWeight: 700 }}
        >
          <span style={{ fontSize: 16 }}>‹</span> {backLabel}
        </Link>
        {rightSlot}
      </div>
      <div
        className="rounded-3xl p-6 sm:p-8 flex items-center gap-5 flex-wrap"
        style={{
          background: 'linear-gradient(135deg, #0e2a32 0%, #16505d 100%)',
          color: '#fff',
          boxShadow: '0 12px 32px rgba(14,42,50,.18)',
        }}
      >
        <div style={{ flex: 1, minWidth: 240 }}>
          {eyebrow && (
            <span
              className="inline-flex items-center gap-2 mb-3 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{ background: '#ff7a2e', color: '#fff', padding: '6px 12px', letterSpacing: '1.2px' }}
            >
              ✨ {eyebrow}
            </span>
          )}
          <h1
            className="studio-display"
            style={{ fontSize: 30, lineHeight: 1.1, margin: '0 0 8px', color: '#fff' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 14, opacity: .88, lineHeight: 1.55, margin: 0, maxWidth: 560 }}>
              {subtitle}
            </p>
          )}
        </div>
        {emoji && (
          <div
            className="hidden sm:grid place-items-center flex-shrink-0"
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: '#fff',
              fontSize: 44,
              boxShadow: '0 8px 24px rgba(0,0,0,.25)',
            }}
          >
            {emoji}
          </div>
        )}
      </div>
    </div>
  )
}
