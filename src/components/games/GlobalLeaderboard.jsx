import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToGlobalLeaderboard, formatWhen } from '../../utils/gamesService'
import GamesShell from './GamesShell'
import {
  TrophyIcon, StarIcon, ArrowRightIcon, SparklesIcon, PuzzlePieceIcon,
} from './gameIcons'

/**
 * /games/leaderboard — live cross-game leaderboard.
 *
 * Uses Firestore onSnapshot so every learner sees scores update in real
 * time. Three windows: Today / This Week / All time. Shows top 25.
 *
 * Public read — anyone can land here and see the board (same as a leaderboard
 * on any kids' learning app). Only signed-in players' scores appear because
 * score writes require auth.
 */
export default function GlobalLeaderboard() {
  const [win, setWin] = useState('all') // 'today' | 'week' | 'all'
  const [state, setState] = useState({ rows: null, error: null })
  const { currentUser } = useAuth()

  useEffect(() => {
    document.title = 'Live Leaderboard — ZedExams Games'
    setState({ rows: null, error: null })
    const unsub = subscribeToGlobalLeaderboard({ window: win, max: 25 }, (next) => setState(next))
    return () => unsub()
  }, [win])

  return (
    <GamesShell crumbs={[{ label: 'Live Leaderboard' }]}>
      <header className="mb-6 rounded-[20px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 sm:p-6 shadow-sm overflow-hidden relative">
        <div aria-hidden="true" className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 text-white flex items-center justify-center shadow-lg shrink-0">
            <TrophyIcon className="w-9 h-9 sm:w-10 sm:h-10" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-amber-700 inline-flex items-center gap-1">
              <SparklesIcon className="w-3.5 h-3.5" />
              Live · updates in real time
            </p>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black leading-tight">Global Leaderboard</h1>
            <p className="text-sm text-slate-600">Top 25 scores across every CBC game.</p>
          </div>
        </div>
      </header>

      <WindowTabs value={win} onChange={setWin} />

      {state.error && <ErrorCard error={state.error} />}
      {!state.error && state.rows == null && <Skeleton />}
      {!state.error && state.rows != null && state.rows.length === 0 && <EmptyCard />}
      {!state.error && state.rows != null && state.rows.length > 0 && (
        <ol className="bg-white rounded-[20px] border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {state.rows.map((r, i) => (
            <Row key={r.id} row={r} rank={i + 1} isMe={currentUser && r.userId === currentUser.uid} />
          ))}
        </ol>
      )}

      {!currentUser && (
        <div className="mt-6 rounded-[16px] border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-sm text-amber-900">
            Sign in to save your scores and appear on this board.{' '}
            <Link to="/login?redirect=/games/leaderboard" className="font-black underline">Sign in →</Link>
          </p>
        </div>
      )}
    </GamesShell>
  )
}

function WindowTabs({ value, onChange }) {
  const tabs = [
    { key: 'today', label: 'Today' },
    { key: 'week',  label: 'This Week' },
    { key: 'all',   label: 'All Time' },
  ]
  return (
    <div className="flex gap-2 mb-5 overflow-x-auto">
      {tabs.map((t) => {
        const active = value === t.key
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={`px-4 py-2 rounded-full font-black text-sm shrink-0 transition ${
              active
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-400 shadow-sm'
            }`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

function Row({ row, rank, isMe }) {
  const isTop3 = rank <= 3
  const rankCls =
    rank === 1 ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-md' :
    rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-md' :
    rank === 3 ? 'bg-gradient-to-br from-orange-400 to-amber-600 text-white shadow-md' :
                 'bg-slate-100 text-slate-700'
  return (
    <li className={`flex items-center gap-3 px-4 sm:px-5 py-3 transition ${isMe ? 'bg-amber-50/70' : ''}`}>
      <span className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black ${rankCls}`}>
        {isTop3 ? <TrophyIcon className="w-5 h-5" /> : rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-black truncate text-slate-900">
          {row.displayName || 'Anonymous'}
          {isMe && <span className="ml-1.5 text-amber-700 text-xs">· you</span>}
        </div>
        <div className="text-xs text-slate-500 truncate">
          <span className="font-mono">{row.gameId}</span>
          {row.accuracy != null && <span> · {row.accuracy}% accuracy</span>}
          {row.bestStreak > 0 && <span> · streak {row.bestStreak}</span>}
          <span> · {formatWhen(row.playedAt)}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-2xl font-black tabular-nums text-amber-700">{row.score}</div>
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">pts</div>
      </div>
    </li>
  )
}

function EmptyCard() {
  return (
    <div className="bg-white rounded-[20px] border-2 border-dashed border-slate-300 p-10 text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 flex items-center justify-center mb-3">
        <TrophyIcon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-black mb-1">No scores yet</h3>
      <p className="text-slate-600">Be the first to land on the board.</p>
      <div className="mt-5">
        <Link to="/games" className="inline-flex items-center gap-1 px-5 py-3 rounded-xl font-black text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-md hover:from-amber-600 hover:to-orange-600 transition">
          Play a game <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

function ErrorCard({ error }) {
  const isIndex = /index|inadequate|FAILED_PRECONDITION/i.test(String(error))
  return (
    <div className="bg-white rounded-[20px] border border-rose-200 p-6 shadow-sm">
      <p className="font-black text-rose-700 mb-1">Live leaderboard isn't available right now.</p>
      <p className="text-sm text-slate-700">
        {isIndex
          ? 'The Firestore index is still building after the latest deploy (usually 2-5 minutes). Try again shortly.'
          : 'We hit a temporary error. Please refresh in a moment.'}
      </p>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="bg-white rounded-[20px] border border-slate-200 divide-y divide-slate-100 shadow-sm">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse"></div>
          <div className="flex-1 min-w-0">
            <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2 mb-1.5"></div>
            <div className="h-2.5 bg-slate-100 rounded animate-pulse w-2/3"></div>
          </div>
          <div className="w-14 h-6 bg-slate-100 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  )
}
