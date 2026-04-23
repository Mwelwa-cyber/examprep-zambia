import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { CheckBadgeIcon, FireIcon, StarIcon, SparklesIcon } from './gameIcons'

/**
 * Shared banners shown on every game engine's "Done" screen:
 *   - SaveBanner     → "score saved" / sign-in nudge / error
 *   - StreakBanner   → "daily streak: N days!" / already-ticked / nothing
 *
 * Badge toast is separate (BadgeToast.jsx) because it lives above the
 * score card, not inside it.
 */

export function SaveBanner({ saveResult }) {
  const { currentUser } = useAuth()
  if (!saveResult) return <p className="text-sm text-slate-500">Saving your score…</p>
  if (saveResult.ok) {
    return (
      <p className="text-sm text-emerald-700 font-bold inline-flex items-center gap-1.5">
        <CheckBadgeIcon className="w-4 h-4" />
        Score saved to your history.
      </p>
    )
  }
  if (saveResult.skipped && saveResult.reason === 'not_signed_in') {
    return (
      <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
        Sign in to save this score and appear on the leaderboard.{' '}
        <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} className="font-black underline">
          Sign in →
        </Link>
        {currentUser && <span> (currently signed in as {currentUser.email})</span>}
      </div>
    )
  }
  return (
    <p className="text-sm text-rose-700 font-bold">
      Couldn't save score: {saveResult.reason || 'unknown error'}
    </p>
  )
}

export function StreakBanner({ result }) {
  if (!result?.isDaily) return null
  const onFire = (result.streak || 0) >= 3
  if (result.wasAlreadyCountedToday) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shrink-0">
          <StarIcon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="font-black text-amber-900 text-lg leading-tight">
            Daily challenge already ticked today
          </p>
          <p className="text-sm text-amber-800">
            Your streak is still <b>{result.streak} day{result.streak === 1 ? '' : 's'}</b>.
            Come back tomorrow for the next challenge.
          </p>
        </div>
      </div>
    )
  }
  if (result.bumped) {
    return (
      <div className={`rounded-2xl border p-4 sm:p-5 flex items-center gap-4 shadow-sm ${onFire ? 'border-rose-300 bg-rose-50' : 'border-amber-300 bg-amber-50'}`}>
        <div className={`w-14 h-14 rounded-2xl text-white flex items-center justify-center shadow-md shrink-0 ${onFire ? 'bg-gradient-to-br from-rose-500 to-orange-500' : 'bg-gradient-to-br from-amber-400 to-orange-500'}`}>
          {onFire ? <FireIcon className="w-7 h-7" /> : <SparklesIcon className="w-7 h-7" />}
        </div>
        <div className="flex-1">
          <p className={`font-black text-lg leading-tight ${onFire ? 'text-rose-900' : 'text-amber-900'}`}>
            Daily streak: {result.streak} day{result.streak === 1 ? '' : 's'}!
          </p>
          <p className={`text-sm ${onFire ? 'text-rose-800' : 'text-amber-800'}`}>
            {result.streak === 1
              ? 'A new streak has begun. Play again tomorrow to keep it alive.'
              : onFire
                ? `You're on fire! Longest streak ever: ${result.longestStreak} days.`
                : `Nice run — longest streak ever: ${result.longestStreak} days.`}
          </p>
        </div>
      </div>
    )
  }
  return null
}

/** Small stat tile used inside DoneCard (shared across engines). */
export function DoneStat({ label, value, tone = 'slate' }) {
  const TONE = {
    emerald: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    amber:   'bg-amber-50 text-amber-900 border-amber-200',
    rose:    'bg-rose-50 text-rose-900 border-rose-200',
    sky:     'bg-sky-50 text-sky-900 border-sky-200',
    slate:   'bg-slate-50 text-slate-900 border-slate-200',
  }
  return (
    <div className={`rounded-2xl border p-4 ${TONE[tone] || TONE.slate}`}>
      <div className="text-[10px] font-black uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  )
}
