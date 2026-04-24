import { useEffect, useState } from 'react'
import { TrophyIcon, FireIcon, SparklesIcon } from '@heroicons/react/24/solid'
import { useAuth } from '../../contexts/AuthContext'
import { formatWhen, getLeaderboard } from '../../utils/gamesService'
import { MetaPill } from './gamesUi'

/**
 * Top-N scores for a single game.
 */
export default function Leaderboard({ gameId, limit = 10 }) {
  const { currentUser } = useAuth()
  const [rows, setRows] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const data = await getLeaderboard(gameId, limit)
      if (!cancelled) setRows(data)
    }
    load()
    return () => { cancelled = true }
  }, [gameId, limit])

  if (rows == null) return <Skeleton />

  if (rows.length === 0) {
    return (
      <div className="rounded-[20px] border border-dashed border-slate-300 bg-white/88 p-8 text-center shadow-[0_24px_60px_-34px_rgba(15,23,42,0.14)]">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white">
          <TrophyIcon className="h-7 w-7" />
        </span>
        <h3 className="mt-4 text-xl font-black text-slate-900">Be the first on this board</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Sign in, finish the round, and claim the opening spot.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-white/80 bg-white/88 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.16)]">
      <header className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white">
            <TrophyIcon className="h-6 w-6 text-amber-300" />
          </span>
          <div>
            <h3 className="text-lg font-black text-slate-900">Top {Math.min(rows.length, limit)} scores</h3>
            <p className="text-sm text-slate-500">Fastest points, best accuracy, biggest streaks.</p>
          </div>
        </div>
      </header>
      <ol>
        {rows.map((row, index) => {
          const isMe = currentUser && row.userId === currentUser.uid
          return (
            <li
              key={row.id}
              className={`flex items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0 ${isMe ? 'bg-amber-50/70' : ''}`}
            >
              <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-black ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : index === 1 ? 'bg-slate-200 text-slate-900' : index === 2 ? 'bg-gradient-to-br from-orange-700 to-amber-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-black text-slate-900">{row.displayName || 'Anonymous'}</p>
                  {isMe && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700">
                      You
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <MetaPill icon={SparklesIcon} label={`${row.accuracy ?? 0}% accuracy`} />
                  <MetaPill icon={FireIcon} label={`Streak ${row.bestStreak ?? 0}`} />
                  <MetaPill icon={TrophyIcon} label={formatWhen(row.playedAt)} />
                </div>
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">{row.score}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="rounded-[20px] border border-white/80 bg-white/88 p-5 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.16)]">
      <div className="h-6 w-36 rounded-full bg-slate-100 animate-pulse" />
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="mt-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-1/2 rounded-full bg-slate-100 animate-pulse" />
            <div className="mt-2 h-3 w-2/3 rounded-full bg-slate-100 animate-pulse" />
          </div>
          <div className="h-6 w-12 rounded-full bg-slate-100 animate-pulse" />
        </div>
      ))}
    </div>
  )
}
