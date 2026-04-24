import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { GameBadgeCard } from './gamesUi'

/**
 * Toast stack for newly earned game badges.
 */
export default function BadgeToast({ badges }) {
  const [dismissed, setDismissed] = useState(() => new Set())

  useEffect(() => {
    if (!badges?.length) return undefined
    const timeout = setTimeout(() => {
      setDismissed(new Set(badges.map((badge) => badge.id)))
    }, 12000)
    return () => clearTimeout(timeout)
  }, [badges])

  const visible = (badges || []).filter((badge) => !dismissed.has(badge.id))
  if (visible.length === 0) return null

  return (
    <div className="space-y-3">
      {visible.map((badge, index) => (
        <div
          key={badge.id}
          className="relative"
          style={{ animation: `badge-pop 0.38s ease-out ${index * 0.08}s both` }}
        >
          <button
            type="button"
            onClick={() => setDismissed((current) => new Set(current).add(badge.id))}
            className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900"
            aria-label="Dismiss badge toast"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
          <div className="rounded-[20px] bg-white/60 p-1 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.22)] backdrop-blur-sm">
            <div className="rounded-[18px] bg-white/86 p-4">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                <SparklesIcon className="h-4 w-4 text-amber-500" />
                New badge unlocked
              </div>
              <GameBadgeCard badge={badge} earned subtitle={badge.description} />
            </div>
          </div>
        </div>
      ))}

      <div className="pt-1 text-right">
        <Link to="/my-badges" className="text-sm font-black text-slate-700 underline transition hover:text-slate-900">
          Open badge gallery
        </Link>
      </div>

      <style>{`
        @keyframes badge-pop {
          0%   { transform: translateY(10px) scale(0.96); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
