import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { gradeByValue, listGames, subjectBySlug } from '../../utils/gamesService'
import { getFallbackGames } from '../../data/gamesSeed'
import GamesShell from './GamesShell'
import {
  subjectTheme, gameTypeMeta,
  ClockIcon, StarIcon, ArrowRightIcon, SparklesIcon, PuzzlePieceIcon,
} from './gameIcons'

const DIFFICULTY_CHIP = {
  easy:   'bg-emerald-100 text-emerald-800 border-emerald-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  hard:   'bg-rose-100 text-rose-800 border-rose-200',
}

/**
 * /games/g/:grade/:subject — Step 3: list of games for the chosen
 * grade + subject. Reads live Firestore, falls back to the local seed
 * so the UI always shows something even before an admin import.
 */
export default function GameList() {
  const { grade, subject } = useParams()
  const gradeMeta = gradeByValue(grade)
  const subjectMeta = subjectBySlug(subject)

  const [games, setGames] = useState(null)
  const [source, setSource] = useState('live') // 'live' | 'fallback'

  useEffect(() => {
    if (!gradeMeta || !subjectMeta) return
    document.title = `${gradeMeta.label} ${subjectMeta.label} Games — ZedExams`
    let cancelled = false
    async function load() {
      const live = await listGames({ grade: gradeMeta.value, subject: subjectMeta.slug })
      if (cancelled) return
      if (live.length) {
        setGames(live)
        setSource('live')
      } else {
        const fb = getFallbackGames({ grade: gradeMeta.value, subject: subjectMeta.slug })
        setGames(fb)
        setSource('fallback')
      }
    }
    load()
    return () => { cancelled = true }
  }, [gradeMeta, subjectMeta])

  if (!gradeMeta) return <Navigate to="/games" replace />
  if (!subjectMeta) return <Navigate to={`/games/g/${gradeMeta.value}`} replace />

  const theme = subjectTheme(subjectMeta.slug)

  return (
    <GamesShell crumbs={[
      { label: gradeMeta.label, to: `/games/g/${gradeMeta.value}` },
      { label: subjectMeta.label },
    ]}>
      <header className="mb-6 rounded-[20px] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex items-center gap-4 overflow-hidden relative">
        <div aria-hidden="true" className={`absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-20 ${theme.blob} blur-2xl`} />
        <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${theme.gradient} text-white flex items-center justify-center shadow-md shrink-0`}>
          <theme.icon className="w-9 h-9 sm:w-10 sm:h-10" />
        </div>
        <div className="relative flex-1 min-w-0">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 inline-flex items-center gap-1">
            <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
            Step 3 of 4 · Choose a game
          </p>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black leading-tight">
            {gradeMeta.label} · {subjectMeta.label}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {games == null ? 'Loading games…' : games.length === 0 ? 'No games yet — we\'re cooking some up.' : `${games.length} ${games.length === 1 ? 'game' : 'games'} ready to play.`}
          </p>
        </div>
      </header>

      {games == null && <SkeletonGrid />}

      {games != null && games.length === 0 && (
        <EmptyState gradeMeta={gradeMeta} subjectMeta={subjectMeta} />
      )}

      {games != null && games.length > 0 && (
        <>
          {source === 'fallback' && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-4 py-2.5 text-sm font-bold">
              Showing offline preview — an admin can run{' '}
              <Link to="/admin/games-seed" className="underline">Games Seed Importer</Link>{' '}
              to publish these to Firestore.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((g, i) => (
              <GameCard key={g.id} game={g} subjectMeta={subjectMeta} badge={i === 0 ? 'Popular' : i === 1 ? 'New' : null} />
            ))}
          </div>
        </>
      )}
    </GamesShell>
  )
}

function GameCard({ game, subjectMeta, badge }) {
  const theme = subjectTheme(subjectMeta?.slug)
  const type = gameTypeMeta(game.type)
  const badgeStyle = {
    Popular: 'bg-rose-100 text-rose-800 border-rose-200',
    New:     'bg-sky-100 text-sky-800 border-sky-200',
    Recommended: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  }[badge] || null
  return (
    <Link
      to={`/games/play/${game.id}`}
      className={`group relative rounded-[20px] border ${theme.ring} bg-gradient-to-br ${theme.soft} p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] transition overflow-hidden`}
    >
      <div aria-hidden="true" className={`absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-25 ${theme.blob} blur-2xl`} />

      <div className="relative flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${theme.gradient} text-white flex items-center justify-center shadow-md shrink-0`}>
            <theme.icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-black text-lg leading-tight text-slate-900 line-clamp-2">{game.title}</h3>
            <div className="flex items-center gap-1 mt-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
              <type.icon className="w-3 h-3" />
              <span>{type.label}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${DIFFICULTY_CHIP[game.difficulty] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
            {game.difficulty || 'easy'}
          </span>
          {badgeStyle && (
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border ${badgeStyle}`}>
              {badge}
            </span>
          )}
        </div>
      </div>

      {game.cbc_topic && (
        <p className="relative text-[11px] font-black uppercase tracking-wider text-slate-500 mt-3">
          CBC · {game.cbc_topic}
        </p>
      )}
      {game.description && (
        <p className="relative mt-2 text-sm text-slate-700 line-clamp-2">{game.description}</p>
      )}

      <div className="relative mt-4 flex items-center justify-between text-xs font-black">
        <span className="inline-flex items-center gap-2 text-slate-600">
          <span className="inline-flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" />{game.timer}s</span>
          <span className="inline-flex items-center gap-1"><StarIcon className="w-3.5 h-3.5 text-amber-500" />{game.points} pts</span>
        </span>
        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-white bg-gradient-to-r ${theme.gradient} shadow-sm group-hover:translate-x-0.5 transition`}>
          Play <ArrowRightIcon className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-[20px] border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 animate-pulse" />
            <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="h-3 w-1/3 bg-slate-100 rounded animate-pulse mb-4"></div>
          <div className="h-3 bg-slate-100 rounded animate-pulse mb-2"></div>
          <div className="h-3 bg-slate-100 rounded animate-pulse w-5/6"></div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ gradeMeta, subjectMeta }) {
  return (
    <div className="rounded-[20px] border-2 border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 flex items-center justify-center mb-3">
        <PuzzlePieceIcon className="w-8 h-8" />
      </div>
      <h2 className="font-display text-xl font-black mb-1">No games published yet</h2>
      <p className="text-slate-600 max-w-md mx-auto mb-5">
        There are no {subjectMeta.label} games for {gradeMeta.label} yet. We're
        adding fresh packs every week.
      </p>
      <Link to={`/games/g/${gradeMeta.value}`} className="inline-flex items-center gap-1 px-5 py-3 rounded-xl font-black text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-md hover:from-amber-600 hover:to-orange-600 transition">
        Pick a different subject <ArrowRightIcon className="w-4 h-4" />
      </Link>
    </div>
  )
}
