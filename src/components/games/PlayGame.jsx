import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  gradeByValue, subjectBySlug, getGame,
} from '../../utils/gamesService'
import { getFallbackGame } from '../../data/gamesSeed'
import GamesShell from './GamesShell'
import TimedQuizGame from './TimedQuizGame'
import MemoryMatchGame from './MemoryMatchGame'
import WordBuilderGame from './WordBuilderGame'
import {
  subjectTheme, gameTypeMeta,
  ClockIcon, StarIcon, AcademicCapIcon, ArrowRightIcon, PuzzlePieceIcon,
} from './gameIcons'

/**
 * /games/play/:gameId — Step 4: the play surface.
 *
 * Looks the game up in Firestore, falls back to the bundled seed if the
 * collection is empty, then dispatches to the engine matching `type`.
 */
export default function PlayGame() {
  const { gameId } = useParams()
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const live = await getGame(gameId)
        if (cancelled) return
        if (live) {
          setGame(live)
          return
        }
        const fb = getFallbackGame(gameId)
        if (fb) setGame(fb)
        else setNotFound(true)
      } catch (err) {
        if (cancelled) return
        console.error('PlayGame load failed', err)
        const fb = getFallbackGame(gameId)
        if (fb) setGame(fb)
        else setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [gameId])

  useEffect(() => {
    if (game?.title) document.title = `${game.title} — ZedExams Games`
  }, [game?.title])

  if (notFound) return <Navigate to="/games" replace />
  if (loading || !game) {
    return (
      <GamesShell crumbs={[{ label: 'Loading…' }]}>
        <div className="rounded-[20px] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md mb-3 animate-bounce">
            <PuzzlePieceIcon className="w-7 h-7" />
          </div>
          <p className="font-black">Loading game…</p>
        </div>
      </GamesShell>
    )
  }

  const gradeMeta = gradeByValue(game.grade)
  const subjectMeta = subjectBySlug(game.subject)

  const crumbs = [
    gradeMeta && { label: gradeMeta.label, to: `/games/g/${gradeMeta.value}` },
    gradeMeta && subjectMeta && { label: subjectMeta.label, to: `/games/g/${gradeMeta.value}/${subjectMeta.slug}` },
    { label: game.title },
  ].filter(Boolean)

  return (
    <GamesShell crumbs={crumbs} maxW="max-w-3xl">
      <GameHeader game={game} subjectMeta={subjectMeta} gradeMeta={gradeMeta} />
      <GameEngine game={game} />
    </GamesShell>
  )
}

function GameHeader({ game, subjectMeta, gradeMeta }) {
  const theme = subjectTheme(subjectMeta?.slug)
  const type = gameTypeMeta(game.type)
  return (
    <header className="mb-6 rounded-[20px] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm overflow-hidden relative">
      <div aria-hidden="true" className={`absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-15 ${theme.blob} blur-2xl`} />
      <div className="relative flex items-center gap-4">
        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${theme.gradient} text-white flex items-center justify-center shadow-md shrink-0`}>
          <theme.icon className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5 mb-1">
            {gradeMeta && (
              <Chip>
                <AcademicCapIcon className="w-3 h-3" />
                {gradeMeta.label}
              </Chip>
            )}
            {subjectMeta && (
              <Chip tone={theme.chip}>
                <theme.icon className="w-3 h-3" />
                {subjectMeta.label}
              </Chip>
            )}
            <Chip tone="bg-white text-slate-700 border-slate-200">
              <type.icon className="w-3 h-3" />
              {type.label}
            </Chip>
            {game.cbc_topic && <Chip>{game.cbc_topic}</Chip>}
            <Chip tone="bg-amber-100 text-amber-800 border-amber-200">{game.difficulty || 'easy'}</Chip>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black leading-tight truncate">{game.title}</h1>
          {game.description && <p className="text-sm text-slate-600 line-clamp-2">{game.description}</p>}
          <div className="mt-2 flex items-center gap-3 text-xs font-black text-slate-600">
            {game.timer > 0 && (
              <span className="inline-flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" />{game.timer}s</span>
            )}
            <span className="inline-flex items-center gap-1"><StarIcon className="w-3.5 h-3.5 text-amber-500" />{game.points} pts</span>
          </div>
        </div>
      </div>
    </header>
  )
}

function Chip({ children, tone = 'bg-slate-100 text-slate-700 border-slate-200' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${tone}`}>
      {children}
    </span>
  )
}

/**
 * Dispatches to the right engine by game.type.
 * Supported:  timed_quiz  |  memory_match  |  word_builder
 */
function GameEngine({ game }) {
  if (game.type === 'timed_quiz')   return <TimedQuizGame   game={game} />
  if (game.type === 'memory_match') return <MemoryMatchGame game={game} />
  if (game.type === 'word_builder') return <WordBuilderGame game={game} />
  return (
    <div className="rounded-[20px] border-2 border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500 flex items-center justify-center mb-3">
        <PuzzlePieceIcon className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-black mb-1">Unknown game type</h2>
      <p className="text-slate-600 max-w-md mx-auto mb-5">
        This game is saved with <span className="font-mono">type="{game.type}"</span>
        but no engine is registered for it yet.
      </p>
      <Link to="/games" className="inline-flex items-center gap-1 px-5 py-3 rounded-xl font-black text-white bg-gradient-to-r from-amber-500 to-orange-500">
        Back to all games <ArrowRightIcon className="w-4 h-4" />
      </Link>
    </div>
  )
}
