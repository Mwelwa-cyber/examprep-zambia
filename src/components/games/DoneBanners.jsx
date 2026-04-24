import { Link } from 'react-router-dom'
import {
  CheckBadgeIcon,
  FireIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid'
import { useAuth } from '../../contexts/AuthContext'

/**
 * Shared banners shown on every game engine's "Done" screen.
 */

export function SaveBanner({ saveResult }) {
  const { currentUser } = useAuth()

  if (!saveResult) {
    return (
      <Banner
        tone="slate"
        icon={SparklesIcon}
        title="Saving your score"
        description="Holding onto this round so it can appear in your history."
      />
    )
  }

  if (saveResult.ok) {
    return (
      <Banner
        tone="emerald"
        icon={CheckBadgeIcon}
        title="Score saved"
        description="This round is now part of your game history."
      />
    )
  }

  if (saveResult.skipped && saveResult.reason === 'not_signed_in') {
    return (
      <div className="rounded-[20px] border border-amber-200 bg-amber-50/92 p-4 shadow-[0_18px_40px_-30px_rgba(245,158,11,0.2)]">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-amber-600">
            <SparklesIcon className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-amber-900">Sign in to save this score.</p>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              Save your history, keep streaks, and appear on the leaderboard.{' '}
              <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} className="font-black underline">
                Sign in
              </Link>
              {currentUser && <span> (currently signed in as {currentUser.email})</span>}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Banner
      tone="rose"
      icon={ExclamationTriangleIcon}
      title="We couldn't save that round"
      description={`Reason: ${saveResult.reason || 'unknown error'}.`}
    />
  )
}

export function StreakBanner({ result }) {
  if (!result?.isDaily) return null

  if (result.wasAlreadyCountedToday) {
    return (
      <Banner
        tone="amber"
        icon={SparklesIcon}
        title="Daily challenge already counted today"
        description={`Your streak stays at ${result.streak} day${result.streak === 1 ? '' : 's'}. Come back tomorrow for the next step.`}
      />
    )
  }

  if (result.bumped) {
    const onFire = (result.streak || 0) >= 3
    return (
      <Banner
        tone={onFire ? 'rose' : 'amber'}
        icon={FireIcon}
        title={`Daily streak: ${result.streak} day${result.streak === 1 ? '' : 's'}`}
        description={
          result.streak === 1
            ? 'A brand-new streak has started. Return tomorrow to keep it going.'
            : onFire
              ? `You are on fire. Longest streak so far: ${result.longestStreak} days.`
              : `Nice work. Longest streak so far: ${result.longestStreak} days.`
        }
      />
    )
  }

  return null
}

/**
 * Small stat tile used inside done cards across engines.
 */
export function DoneStat({ label, value, tone = 'slate' }) {
  const TONE = {
    emerald: 'border-emerald-200 bg-emerald-50/90 text-emerald-900',
    amber: 'border-amber-200 bg-amber-50/90 text-amber-900',
    rose: 'border-rose-200 bg-rose-50/90 text-rose-900',
    sky: 'border-sky-200 bg-sky-50/90 text-sky-900',
    slate: 'border-slate-200 bg-slate-50/90 text-slate-900',
  }

  return (
    <div className={`rounded-2xl border p-4 ${TONE[tone] || TONE.slate}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">{label}</div>
      <div className="mt-2 text-2xl font-black">{value}</div>
    </div>
  )
}

function Banner({ icon, title, description, tone = 'slate' }) {
  const Icon = icon
  const toneClass = {
    emerald: 'border-emerald-200 bg-emerald-50/92 text-emerald-900',
    amber: 'border-amber-200 bg-amber-50/92 text-amber-900',
    rose: 'border-rose-200 bg-rose-50/92 text-rose-900',
    slate: 'border-slate-200 bg-white/92 text-slate-900',
  }
  const iconTone = {
    emerald: 'bg-white text-emerald-600',
    amber: 'bg-white text-amber-600',
    rose: 'bg-white text-rose-600',
    slate: 'bg-slate-900 text-white',
  }

  return (
    <div className={`rounded-[20px] border p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.16)] ${toneClass[tone] || toneClass.slate}`}>
      <div className="flex items-start gap-3">
        <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconTone[tone] || iconTone.slate}`}>
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">{title}</p>
          <p className="mt-1 text-sm leading-6 opacity-90">{description}</p>
        </div>
      </div>
    </div>
  )
}
