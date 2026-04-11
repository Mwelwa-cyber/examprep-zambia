/**
 * BadgesPage — full-page view of all earned + progress badges.
 */
import { useAuth }     from '../../contexts/AuthContext'
import { useBadges }   from '../../hooks/useBadges'
import { BADGES }      from '../../config/badges'
import BadgeCard       from '../ui/BadgeCard'
import ProfessorPako   from '../ui/ProfessorPako'
import { useDataSaver } from '../../contexts/DataSaverContext'

export default function BadgesPage() {
  const { currentUser }       = useAuth()
  const { earned, progress, loading } = useBadges(currentUser?.uid)
  const { dataSaver }         = useDataSaver()

  const earnedIds = new Set(earned.map(b => b.id))
  const progressMap = Object.fromEntries(progress.map(p => [p.badge.id, p]))

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {!dataSaver && <ProfessorPako size={60} mood={earned.length > 3 ? 'excited' : 'normal'} animate={false} />}
        <div>
          <h1 className="text-2xl font-black text-gray-800">🏆 My Badges</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {earned.length} of {BADGES.length} badges earned
          </p>
        </div>
      </div>

      {/* Earned */}
      {earned.length > 0 && (
        <section>
          <h2 className="font-black text-gray-700 mb-3 text-sm">✅ Earned ({earned.length})</h2>
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
          <h2 className="font-black text-gray-700 mb-3 text-sm">🔄 In Progress ({progress.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {progress
              .sort((a, b) => b.progress - a.progress)
              .slice(0, 6)
              .map(({ badge, progress: pct, avgScore, totalAttempts }) => (
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
            <h2 className="font-black text-gray-700 mb-3 text-sm">🔒 Locked ({locked.length})</h2>
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
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-24" />
          ))}
        </div>
      )}
    </div>
  )
}
