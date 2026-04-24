/**
 * BadgesPage — full-page view of all earned + progress badges.
 */
import { useEffect, useState } from 'react'
import { Link }        from 'react-router-dom'
import {
  ArrowPathIcon,
  CheckBadgeIcon,
  LockClosedIcon,
  PuzzlePieceIcon,
  TrophyIcon,
} from '@heroicons/react/24/solid'
import { useAuth }     from '../../contexts/AuthContext'
import { useBadges }   from '../../hooks/useBadges'
import { BADGES }      from '../../config/badges'
import BadgeCard       from '../ui/BadgeCard'
import ProfessorPako   from '../ui/ProfessorPako'
import { useDataSaver } from '../../contexts/DataSaverContext'
import { GAME_BADGES } from '../../data/gameBadges'
import { getMyGameBadges, formatAwardedAt } from '../../utils/gameBadgesService'
import { GameBadgeCard as GamesBadgeCard } from '../games/gamesUi'

export default function BadgesPage() {
  const { currentUser }       = useAuth()
  const { earned, progress, loading } = useBadges(currentUser?.uid)
  const { dataSaver }         = useDataSaver()

  // Game badges — from the /games surface
  const [gameBadges, setGameBadges] = useState(null)
  useEffect(() => {
    if (!currentUser) { setGameBadges({}); return }
    let cancelled = false
    getMyGameBadges()
      .then(({ byId }) => { if (!cancelled) setGameBadges(byId || {}) })
      .catch(() => { if (!cancelled) setGameBadges({}) })
    return () => { cancelled = true }
  }, [currentUser])

  const earnedIds = new Set(earned.map(b => b.id))
  const progressMap = Object.fromEntries(progress.map(p => [p.badge.id, p]))
  const earnedGameBadgeIds = new Set(Object.keys(gameBadges || {}))
  const totalEarned = earned.length + earnedGameBadgeIds.size
  const totalPossible = BADGES.length + GAME_BADGES.length

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {!dataSaver && <ProfessorPako size={60} mood={totalEarned > 3 ? 'excited' : 'normal'} animate={false} />}
        <div>
          <h1 className="inline-flex items-center gap-2 text-2xl font-black theme-text">
            <TrophyIcon className="h-7 w-7 text-amber-500" />
            My Badges
          </h1>
          <p className="theme-text-muted text-sm mt-0.5">
            {totalEarned} of {totalPossible} badges earned
          </p>
        </div>
      </div>

      {/* ── Game Badges (from /games) ─────────────────────────── */}
      {gameBadges && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="inline-flex items-center gap-2 font-black theme-text text-sm">
              <PuzzlePieceIcon className="h-4 w-4 text-amber-500" />
              Game Badges ({earnedGameBadgeIds.size}/{GAME_BADGES.length})
            </h2>
            <Link to="/games" className="text-xs font-black text-amber-700 hover:text-amber-900">Play games →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GAME_BADGES.map((b) => (
              <GamesBadgeCard
                key={b.id}
                badge={b}
                earned={earnedGameBadgeIds.has(b.id)}
                subtitle={
                  earnedGameBadgeIds.has(b.id)
                    ? gameBadges[b.id]?.awardedAt
                      ? `${b.description} Earned ${formatAwardedAt(gameBadges[b.id]?.awardedAt)}.`
                      : b.description
                    : b.hint
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* Earned */}
      {earned.length > 0 && (
        <section>
          <h2 className="inline-flex items-center gap-2 font-black theme-text mb-3 text-sm">
            <CheckBadgeIcon className="h-4 w-4 text-emerald-500" />
            Earned ({earned.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {earned.map(b => (
              <BadgeCard key={b.id} badge={b} earned earnedAt={b.earnedAt} size="md" />
            ))}
          </div>
        </section>
      )}

      {/* In Progress */}
      {progress.length > 0 && (
        <section>
          <h2 className="inline-flex items-center gap-2 font-black theme-text mb-3 text-sm">
            <ArrowPathIcon className="h-4 w-4 text-sky-500" />
            In Progress ({progress.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {progress
              .sort((a, b) => b.progress - a.progress)
              .slice(0, 6)
              .map(({ badge, progress: pct }) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  earned={false}
                  progress={pct}
                  size="md"
                />
              ))}
          </div>
        </section>
      )}

      {/* Locked (not started) */}
      {(() => {
        const locked = BADGES.filter(b => !earnedIds.has(b.id) && !progressMap[b.id])
        return locked.length > 0 ? (
          <section>
            <h2 className="inline-flex items-center gap-2 font-black theme-text mb-3 text-sm">
              <LockClosedIcon className="h-4 w-4 text-slate-500" />
              Locked ({locked.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {locked.map(b => (
                <BadgeCard key={b.id} badge={b} earned={false} progress={0} size="md" />
              ))}
            </div>
          </section>
        ) : null
      })()}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="theme-card rounded-2xl border theme-border p-4 animate-pulse h-24" />
          ))}
        </div>
      )}
    </div>
  )
}
