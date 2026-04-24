import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FireIcon,
  SparklesIcon,
  StarIcon,
  TrophyIcon,
} from '@heroicons/react/24/solid'
import { useAuth } from '../../contexts/AuthContext'
import { GAME_BADGES } from '../../data/gameBadges'
import { getFallbackGames } from '../../data/gamesSeed'
import { getTodaysChallenge, getMyStreak } from '../../utils/dailyChallengeService'
import { getMyGameBadges } from '../../utils/gameBadgesService'
import {
  GRADES,
  SUBJECTS,
  getMyHistory,
  listGames,
  subscribeToGlobalLeaderboard,
} from '../../utils/gamesService'
import DailyChallengeCard from './DailyChallengeCard'
import GamesShell from './GamesShell'
import {
  GameBadgeCard,
  GameDiscoveryCard,
  GamesSectionHeading,
  ProgressBar,
  SubjectProgressCard,
  buildSubjectProgress,
  getGameStatusBadge,
} from './gamesUi'

/**
 * /games — main discovery hub for the public Games experience.
 * Keeps the existing read-only data flow and reorganises the UI around
 * challenge, progress, recommendations, and playful discovery.
 */
export default function GamesHub() {
  const { currentUser } = useAuth()
  const [state, setState] = useState({
    loading: true,
    games: [],
    challenge: null,
    history: [],
    badgesById: {},
    streak: { streak: 0, longestStreak: 0, signedIn: false },
    leaderboardRows: [],
  })

  useEffect(() => {
    document.title = 'Games — ZedExams'
    setMeta('Play Zambian CBC-aligned learning games with daily challenges, subject progress, badges, and live leaderboard climbing.')
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setState((prev) => ({ ...prev, loading: true }))
      const [liveGames, challenge, history, badgeState, streak] = await Promise.all([
        listGames(),
        getTodaysChallenge(),
        getMyHistory(40),
        getMyGameBadges(),
        getMyStreak(),
      ])
      if (cancelled) return

      setState((prev) => ({
        ...prev,
        loading: false,
        games: liveGames.length ? liveGames : getFallbackGames(),
        challenge,
        history,
        badgesById: badgeState?.byId || {},
        streak,
      }))
    }

    load()
    return () => { cancelled = true }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) {
      setState((prev) => ({ ...prev, leaderboardRows: [] }))
      return undefined
    }

    const unsub = subscribeToGlobalLeaderboard({ window: 'all', max: 25 }, (next) => {
      setState((prev) => ({ ...prev, leaderboardRows: next?.rows || [] }))
    })
    return () => unsub()
  }, [currentUser])

  const totalPoints = state.history.reduce((sum, row) => sum + (Number(row.score) || 0), 0)
  const level = Math.max(1, Math.floor(totalPoints / 120) + 1)
  const levelProgress = Math.round(((totalPoints % 120) / 120) * 100)
  const currentRank = currentUser
    ? state.leaderboardRows.findIndex((row) => row.userId === currentUser.uid) + 1
    : 0
  const earnedBadgeIds = new Set(Object.keys(state.badgesById || {}))
  const recommendedGames = buildRecommendedGames(state.games, state.challenge?.game, state.history)
  const featuredGameId = recommendedGames[0]?.id || state.challenge?.game?.id || null
  const popularGames = buildPopularGames(state.games, new Set(recommendedGames.map((game) => game.id)))

  const subjectCards = SUBJECTS.map((subject) => {
    const progress = buildSubjectProgress(subject.slug, state.games, state.history)
    return {
      subject,
      progress,
      helperText: progress.totalGames
        ? progress.plays
          ? `${progress.plays} plays recorded across ${progress.totalGames} game${progress.totalGames === 1 ? '' : 's'}.`
          : `Start here with ${progress.totalGames} game${progress.totalGames === 1 ? '' : 's'} ready to play.`
        : 'This subject card is ready for the next game pack.',
    }
  })

  return (
    <GamesShell crumbs={[]}>
      <DailyChallengeCard
        challenge={state.challenge}
        streak={state.streak}
        loading={state.loading}
      />

      <section className="mb-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
              Premium learning flow
            </p>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Follow your momentum across every game.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
              Quick daily wins, subject progress, badges, and live leaderboard energy — all in one calm, touch-friendly space.
            </p>
          </div>
          <Link
            to="/games/leaderboard"
            className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-black text-slate-900 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-50 active:scale-[0.98]"
          >
            See live leaderboard
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={SparklesIcon}
            title="Level"
            value={`Lv ${level}`}
            accent="from-amber-500 to-orange-500"
            support={currentUser ? `${levelProgress}% to level ${level + 1}` : 'Sign in to keep leveling up'}
            progress={currentUser ? levelProgress : 18}
          />
          <StatCard
            icon={FireIcon}
            title="Streak"
            value={`${state.streak.streak || 0} day${state.streak.streak === 1 ? '' : 's'}`}
            accent="from-rose-500 to-orange-500"
            support={
              state.streak.signedIn
                ? state.streak.streak
                  ? 'Keep it up! Today’s challenge keeps the fire going.'
                  : 'Your next win starts a new streak.'
                : 'Sign in to save your daily streak.'
            }
          />
          <StatCard
            icon={StarIcon}
            title="Points"
            value={totalPoints.toLocaleString()}
            accent="from-sky-500 to-cyan-500"
            support={currentUser ? 'Saved points from your finished rounds.' : 'Guest play works, but signed-in points stay with you.'}
          />
          <StatCard
            icon={TrophyIcon}
            title="Rank"
            value={currentUser ? (currentRank ? `#${currentRank}` : 'Rising') : 'Guest'}
            accent="from-emerald-500 to-teal-500"
            support={
              currentUser
                ? currentRank
                  ? 'You are currently showing on the live board.'
                  : 'Finish a round to break onto the leaderboard.'
                : 'Sign in to appear on the live leaderboard.'
            }
          />
        </div>
      </section>

      <section className="mb-12">
        <GamesSectionHeading
          eyebrow="Recommended"
          title="Jump into the next best games"
          description="Curated picks based on the daily spotlight, your recent play history, and the strongest subject mix for quick wins."
        />
        {state.loading ? (
          <SkeletonCardGrid featured />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {recommendedGames.map((game, index) => (
              <GameDiscoveryCard
                key={game.id}
                game={game}
                badge={getGameStatusBadge(game, index, featuredGameId)}
                variant={index === 0 ? 'featured' : 'standard'}
                showRating
              />
            ))}
          </div>
        )}
      </section>

      <section className="mb-12">
        <GamesSectionHeading
          eyebrow="Subjects"
          title="Pick a subject track"
          description="Every subject has its own colour, icon, and progress trail so children can scan quickly and jump straight into the right practice."
        />
        {state.loading ? (
          <SkeletonSubjectGrid />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {subjectCards.map(({ subject, progress, helperText }) => (
              <SubjectProgressCard
                key={subject.slug}
                subject={subject}
                gamesCount={progress.totalGames}
                progress={progress.progress}
                href={`/games/g/${pickGradeForSubject(state.games, subject.slug)}`}
                showComingSoon={progress.totalGames === 0}
                helperText={helperText}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mb-12 grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div>
          <GamesSectionHeading
            eyebrow="Badges"
            title="Collect bright rewards"
            description="Earned badges glow, locked badges stay softly muted, and every reward hints at the next achievement path."
            action={
              <Link to="/my-badges" className="text-sm font-black text-slate-700 transition hover:text-slate-900">
                Open badge gallery
              </Link>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {(state.loading ? GAME_BADGES.slice(0, 4) : GAME_BADGES.slice(0, 4)).map((badge) => (
              <GameBadgeCard
                key={badge.id}
                badge={badge}
                earned={!state.loading && earnedBadgeIds.has(badge.id)}
                compact
              />
            ))}
          </div>
        </div>

        <div>
          <GamesSectionHeading
            eyebrow="Popular"
            title="Popular game picks"
            description="Fast favourites with varied colours, different game types, and easy scanability on both mobile and desktop."
          />
          {state.loading ? (
            <SkeletonCardGrid />
          ) : (
            <div className="grid gap-4">
              {popularGames.map((game, index) => (
                <GameDiscoveryCard
                  key={game.id}
                  game={game}
                  badge={getGameStatusBadge(game, index + 1, featuredGameId)}
                  showRating
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mb-10">
        <GamesSectionHeading
          eyebrow="Grades"
          title="Choose a grade level"
          description="Large tap targets, strong numbering, and clear groupings for lower and middle primary learners."
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {[
            { key: 'lower', title: 'Lower Primary', note: 'Grades 1 – 3', accent: 'from-amber-200 via-orange-100 to-rose-100' },
            { key: 'middle', title: 'Middle Primary', note: 'Grades 4 – 6', accent: 'from-emerald-200 via-teal-100 to-sky-100' },
          ].map((band) => (
            <div key={band.key} className={`rounded-[20px] border border-white/80 bg-gradient-to-br ${band.accent} p-5 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.22)]`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{band.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{band.note}</p>
                </div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/85">
                  <SparklesIcon className="h-6 w-6 text-slate-900" />
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {GRADES.filter((grade) => grade.band === band.key).map((grade) => (
                  <GradeCard
                    key={grade.value}
                    grade={grade}
                    gamesCount={state.games.filter((game) => Number(game.grade) === grade.value).length}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </GamesShell>
  )
}

function StatCard({ icon, title, value, support, accent, progress = null }) {
  const Icon = icon

  return (
    <div className="rounded-[20px] border border-white/80 bg-white/88 p-5 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.18)] backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">{title}</p>
          <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-900">{value}</h3>
        </div>
        <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${accent} text-white shadow-[0_20px_40px_-24px_rgba(15,23,42,0.32)]`}>
          <Icon className="h-6 w-6" />
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{support}</p>
      {progress != null && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <ProgressBar value={progress} gradient={accent} />
        </div>
      )}
    </div>
  )
}

function GradeCard({ grade, gamesCount }) {
  return (
    <Link
      to={`/games/g/${grade.value}`}
      className="group rounded-2xl bg-white/82 p-4 text-center shadow-[0_18px_36px_-28px_rgba(15,23,42,0.2)] transition hover:-translate-y-1 hover:bg-white active:scale-[0.98]"
    >
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white">
        <span className="text-lg font-black">{grade.value}</span>
      </div>
      <h4 className="mt-3 text-lg font-black text-slate-900">{grade.label}</h4>
      <p className="mt-1 text-sm text-slate-600">
        {gamesCount} {gamesCount === 1 ? 'game' : 'games'} ready
      </p>
    </Link>
  )
}

function SkeletonCardGrid({ featured = false }) {
  return (
    <div className={`grid gap-4 ${featured ? 'lg:grid-cols-3' : ''}`}>
      {Array.from({ length: featured ? 3 : 3 }).map((_, index) => (
        <div
          key={index}
          className={`rounded-[20px] border border-slate-100 bg-white/80 p-5 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.16)] ${featured && index === 0 ? 'lg:col-span-2 sm:p-7' : ''}`}
        >
          <div className="h-12 w-12 rounded-full bg-slate-100 animate-pulse" />
          <div className="mt-5 h-7 w-3/4 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="mt-3 h-4 w-full rounded-full bg-slate-100 animate-pulse" />
          <div className="mt-2 h-4 w-5/6 rounded-full bg-slate-100 animate-pulse" />
          <div className="mt-5 flex gap-2">
            <div className="h-8 w-24 rounded-full bg-slate-100 animate-pulse" />
            <div className="h-8 w-24 rounded-full bg-slate-100 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SkeletonSubjectGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-[20px] border border-slate-100 bg-white/80 p-5 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.16)]">
          <div className="h-12 w-12 rounded-full bg-slate-100 animate-pulse" />
          <div className="mt-5 h-7 w-2/3 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="mt-3 h-4 w-full rounded-full bg-slate-100 animate-pulse" />
          <div className="mt-5 h-2.5 w-full rounded-full bg-slate-100 animate-pulse" />
        </div>
      ))}
    </div>
  )
}

function buildRecommendedGames(games, challengeGame, history) {
  const playedIds = new Set(history.map((row) => row.gameId))
  const subjectCounts = history.reduce((acc, row) => {
    const key = String(row.subject || '').toLowerCase()
    if (!key) return acc
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  const favouriteSubject = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

  const score = (game) => {
    let total = 0
    if (challengeGame?.id && game.id === challengeGame.id) total += 100
    if (!playedIds.has(game.id)) total += 18
    if (favouriteSubject && game.subject === favouriteSubject) total += 8
    if ((game.difficulty || '').toLowerCase() === 'easy') total += 6
    if ((game.type || '').toLowerCase() === 'memory_match') total += 4
    total += Number(game.points) || 0
    return total
  }

  return games
    .slice()
    .sort((a, b) => score(b) - score(a))
    .slice(0, 3)
}

function buildPopularGames(games, excludeIds) {
  const pool = games.filter((game) => !excludeIds.has(game.id))
  const selected = []
  const usedSubjects = new Set()

  for (const game of pool.sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0))) {
    const subject = String(game.subject || '').toLowerCase()
    if (selected.length >= 3) break
    if (usedSubjects.has(subject) && selected.length < 2) continue
    selected.push(game)
    usedSubjects.add(subject)
  }

  return selected.length ? selected : games.slice(0, 3)
}

function pickGradeForSubject(games, subjectSlug) {
  const first = games.find((game) => String(game.subject || '').toLowerCase() === subjectSlug)
  return first?.grade || 1
}

function setMeta(content) {
  let tag = document.querySelector('meta[name="description"]')
  if (!tag) {
    tag = document.createElement('meta')
    tag.name = 'description'
    document.head.appendChild(tag)
  }
  tag.content = content
}
