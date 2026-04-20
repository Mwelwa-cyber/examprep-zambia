import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToGlobalLeaderboard, formatWhen } from '../../utils/gamesService'
import GamesShell from './GamesShell'

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
      <header className="mb-6 flex items-center gap-4">
        <div className="text-5xl sm:text-6xl">🏆</div>
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">Live · updates in real time</p>
          <h1 className="text-3xl sm:text-4xl font-black">Global Leaderboard</h1>
          <p className="text-sm text-slate-600">Top 25 scores across every CBC game.</p>
        </div>
      </header>

      <WindowTabs value={win} onChange={setWin} />

      {state.error && <ErrorCard error={state.error} />}
      {!state.error && state.rows == null && <Skeleton />}
      {!state.error && state.rows != null && state.rows.length === 0 && <EmptyCard />}
      {!state.error && state.rows != null && state.rows.length > 0 && (
        <ol className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden divide-y divide-slate-100">
          {state.rows.map((r, i) => (
            <Row key={r.id} row={r} rank={i + 1} isMe={currentUser && r.userId === currentUser.uid} />
          ))}
        </ol>
      )}

      {!currentUser && (
        <div className="mt-6 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 text-center">
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
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow'
                : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-400'
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
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
  const rankCls = rank === 1
    ? 'bg-amber-400 text-white'
    : rank === 2
      ? 'bg-slate-300 text-slate-800'
      : rank === 3
        ? 'bg-amber-700 text-white'
        : 'bg-slate-100 text-slate-700'
  return (
    <li className={`flex items-center gap-3 px-4 sm:px-5 py-3 ${isMe ? 'bg-amber-50' : ''}`}>
      <span className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black ${rankCls}`}>
        {medal || rank}
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
    <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-10 text-center">
      <div className="text-6xl mb-3">📭</div>
      <h3 className="text-xl font-black mb-1">No scores yet</h3>
      <p className="text-slate-600">Be the first to land on the board.</p>
      <div className="mt-5">
        <Link to="/games" className="inline-block px-5 py-3 rounded-xl font-black text-white bg-gradient-to-r from-amber-500 to-orange-500">
          Play a game →
        </Link>
      </div>
    </div>
  )
}

function ErrorCard({ error }) {
  const isIndex = /index|inadequate|FAILED_PRECONDITION/i.test(String(error))
  return (
    <div className="bg-white rounded-3xl border-2 border-rose-200 p-6">
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
    <div className="bg-white rounded-3xl border-2 border-slate-200 divide-y divide-slate-100">
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
