import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BADGE_TIER_STYLES } from '../../data/gameBadges'

/**
 * Stack of celebratory badge toasts shown on the game-finish screen when
 * the player has just earned one or more new badges. Each card pulses in,
 * stays until dismissed, and links to /my-badges for the full gallery.
 */
export default function BadgeToast({ badges }) {
  const [dismissed, setDismissed] = useState(() => new Set())

  // Auto-clear after 12 seconds so they don't linger forever.
  useEffect(() => {
    if (!badges?.length) return
    const t = setTimeout(() => setDismissed(new Set(badges.map((b) => b.id))), 12000)
    return () => clearTimeout(t)
  }, [badges])

  const visible = (badges || []).filter((b) => !dismissed.has(b.id))
  if (visible.length === 0) return null

  return (
    <div className="space-y-3">
      {visible.map((badge, i) => {
        const tier = BADGE_TIER_STYLES[badge.tier] || BADGE_TIER_STYLES.bronze
        return (
          <div
            key={badge.id}
            className={`relative rounded-2xl border-2 ${tier.border} ${tier.bg} p-4 sm:p-5 shadow-lg overflow-hidden`}
            style={{ animation: `badge-pop 0.4s ease-out ${i * 0.1}s both` }}
          >
            <button
              type="button"
              onClick={() => setDismissed((d) => new Set(d).add(badge.id))}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/70 hover:bg-white text-slate-600 font-black text-sm flex items-center justify-center"
              aria-label="Dismiss"
            >
              ×
            </button>

            <div className="flex items-start gap-4">
              <div className="text-5xl shrink-0" aria-hidden="true">{badge.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider opacity-70">
                  ✨ New badge unlocked!
                </p>
                <h3 className={`text-xl font-black leading-tight ${tier.text}`}>
                  {badge.name}
                </h3>
                <p className="text-sm text-slate-700 mt-0.5">{badge.description}</p>
                <p className={`text-[10px] font-black uppercase tracking-wider mt-2 ${tier.text}`}>
                  {tier.label} tier
                </p>
              </div>
            </div>

            {visible.length === 1 && (
              <div className="mt-3 flex justify-end">
                <Link
                  to="/my-badges"
                  className="text-xs font-black text-slate-700 hover:text-slate-900 underline"
                >
                  See all your badges →
                </Link>
              </div>
            )}
          </div>
        )
      })}

      {visible.length > 1 && (
        <div className="text-center pt-1">
          <Link
            to="/my-badges"
            className="text-sm font-black text-slate-700 hover:text-slate-900 underline"
          >
            See all {visible.length} new badges in your gallery →
          </Link>
        </div>
      )}

      <style>{`
        @keyframes badge-pop {
          0%   { transform: scale(0.85) translateY(8px); opacity: 0; }
          100% { transform: scale(1)    translateY(0);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}
