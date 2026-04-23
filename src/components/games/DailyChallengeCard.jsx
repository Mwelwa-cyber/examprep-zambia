import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  StarIcon, FireIcon, ClockIcon, CalendarIcon, RocketLaunchIcon,
  SparklesIcon, LockClosedIcon, AcademicCapIcon,
} from '@heroicons/react/24/outline'
import {
  getTodaysChallenge, getMyStreak, todaysDateId,
} from '../../utils/dailyChallengeService'
import { gradeByValue, subjectBySlug } from '../../utils/gamesService'
import { subjectVisual, gameTypeIcon, IconBubble } from './_gamesVisual'

/**
 * Hero card for today's daily challenge. Keeps every Firestore call untouched
 * and wraps them in a polished, icon-driven presentation.
 */
export default function DailyChallengeCard() {
  const [state, setState] = useState({ loading: true })
  const [streak, setStreak] = useState({ streak: 0, longestStreak: 0, signedIn: false })
  const [now, setNow] = useState(() => new Date())
  const todayId = todaysDateId()

  useEffect(() => {
    let cancelled = false
    Promise.all([getTodaysChallenge(), getMyStreak()])
      .then(([challenge, s]) => {
        if (cancelled) return
        setState({ loading: false, ...challenge })
        setStreak(s)
      })
      .catch(() => {
        if (cancelled) return
        setState({ loading: false, game: null })
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  if (state.loading) return <Skeleton />
  const game = state.game
  if (!game) return null

  const grade = gradeByValue(game.grade)
  const subject = subjectBySlug(game.subject)
  const visual = subjectVisual(subject?.slug)
  const TypeIcon = gameTypeIcon(game)
  const playedToday = streak.lastPlayedDate === todayId
  const countdown = msUntilMidnightUTC(now)

  return (
    <section className="relative overflow-hidden rounded-[20px] border border-amber-200/70 shadow-[0_10px_40px_-16px_rgba(251,146,60,0.35)] mb-6 sm:mb-8 bg-gradient-to-br from-amber-50 via-rose-50 to-orange-100 animate-slide-in-soft">
      <div aria-hidden="true" className="absolute -top-16 -left-10 w-56 h-56 rounded-full bg-amber-200/50 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-20 right-0 w-72 h-72 rounded-full bg-rose-200/40 blur-3xl" />

      <div className="relative grid md:grid-cols-[1.4fr_1fr] gap-0">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 text-[10px] font-black uppercase tracking-wider text-amber-800 shadow-sm">
              <StarIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
              Today's Daily Challenge
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-black text-amber-700/80">
              <CalendarIcon className="w-3.5 h-3.5" strokeWidth={2.25} />
              {formatPrettyDate(todayId)}
            </span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black leading-tight text-slate-900">
            {game.title}
          </h2>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {grade && (
              <Chip tone="amber" icon={AcademicCapIcon}>{grade.label}</Chip>
            )}
            {subject && (
              <Chip tone="rose" icon={visual.Icon}>{subject.label}</Chip>
            )}
            {game.cbc_topic && (
              <Chip tone="emerald" icon={TypeIcon}>{game.cbc_topic}</Chip>
            )}
          </div>

          <p className="text-sm sm:text-base text-slate-700 mt-3 line-clamp-2">{game.description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to={`/games/play/${game.id}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-orange-500/25 hover:-translate-y-0.5 active:scale-[0.98] transition"
            >
              <RocketLaunchIcon className="w-5 h-5" strokeWidth={2.25} />
              <span>{playedToday ? 'Play Again' : "Play Today's Challenge"}</span>
            </Link>

            <div className="flex items-center gap-2">
              <CountdownPill ms={countdown} />
              <StreakBadge streak={streak} playedToday={playedToday} />
            </div>
          </div>
        </div>

        <div className="relative hidden md:flex items-center justify-center p-6">
          <Mascot visual={visual} TypeIcon={TypeIcon} />
        </div>
      </div>
    </section>
  )
}

function Mascot({ visual, TypeIcon }) {
  const MainIcon = visual.Icon
  return (
    <div className="relative w-full flex items-center justify-center">
      <div className="relative">
        <div aria-hidden="true" className="absolute -top-4 -left-8 w-11 h-11 rounded-2xl bg-white shadow-md rotate-[-8deg] flex items-center justify-center text-amber-600">
          <SparklesIcon className="w-5 h-5" strokeWidth={2} />
        </div>
        <div aria-hidden="true" className="absolute -top-6 right-0 w-11 h-11 rounded-2xl bg-white shadow-md rotate-[10deg] flex items-center justify-center text-sky-600">
          <TypeIcon className="w-5 h-5" strokeWidth={2} />
        </div>
        <div aria-hidden="true" className="absolute bottom-2 -right-8 w-11 h-11 rounded-2xl bg-white shadow-md rotate-[-6deg] flex items-center justify-center text-emerald-600">
          <StarIcon className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br ${visual.gradient} border-4 border-white shadow-xl flex items-center justify-center text-white`}>
          <MainIcon className="w-16 h-16 sm:w-20 sm:h-20" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  )
}

function CountdownPill({ ms }) {
  if (ms == null || ms <= 0) return null
  const hours = Math.floor(ms / 3_600_000)
  const mins = Math.floor((ms % 3_600_000) / 60_000)
  const text = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-amber-200 text-xs font-black text-amber-800 shadow-sm">
      <ClockIcon className="w-4 h-4" strokeWidth={2.25} />
      <span className="text-slate-500 font-bold">Ends in</span>
      <span className="font-mono">{text}</span>
    </span>
  )
}

function StreakBadge({ streak, playedToday }) {
  if (!streak.signedIn) {
    return (
      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-slate-200 text-xs font-black text-slate-700 hover:bg-white shadow-sm"
      >
        <LockClosedIcon className="w-4 h-4" strokeWidth={2} />
        Sign in for streaks
      </Link>
    )
  }
  if (streak.streak === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-slate-200 text-xs font-black text-slate-600 shadow-sm">
        <SparklesIcon className="w-4 h-4" strokeWidth={2} />
        Start your streak
      </span>
    )
  }
  const onFire = streak.streak >= 3
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black shadow-sm ${onFire ? 'bg-rose-500 text-white' : 'bg-white text-amber-800 border border-amber-200'}`}>
      <FireIcon className="w-4 h-4" strokeWidth={2.25} />
      <span>{streak.streak}-day streak</span>
      {playedToday && <span className="opacity-80">· today ✓</span>}
    </span>
  )
}

function Chip({ children, tone = 'slate', icon: Icon }) {
  const tones = {
    amber:   'bg-amber-100 text-amber-800 border-amber-200',
    rose:    'bg-rose-100 text-rose-800 border-rose-200',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    slate:   'bg-white text-slate-700 border-slate-200',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wide border ${tones[tone] || tones.slate}`}>
      {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />}
      {children}
    </span>
  )
}

function Skeleton() {
  return (
    <section className="rounded-[20px] border border-amber-200/70 bg-amber-50 p-6 mb-8">
      <div className="h-3 w-40 bg-amber-200 rounded animate-pulse mb-4"></div>
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="h-6 w-3/4 bg-amber-200 rounded animate-pulse mb-3"></div>
          <div className="h-3 w-1/2 bg-amber-200 rounded animate-pulse mb-4"></div>
          <div className="h-10 w-40 bg-amber-200 rounded-xl animate-pulse"></div>
        </div>
        <div className="w-36 h-36 rounded-full bg-amber-200 animate-pulse hidden md:block" />
      </div>
    </section>
  )
}

function msUntilMidnightUTC(now = new Date()) {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  return Math.max(0, next - now.getTime())
}

function formatPrettyDate(dateId) {
  try {
    const [y, m, d] = dateId.split('-').map(Number)
    const date = new Date(Date.UTC(y, m - 1, d))
    return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateId
  }
}

// IconBubble re-export safeguard for tree-shaking stability if imported
export { IconBubble }
