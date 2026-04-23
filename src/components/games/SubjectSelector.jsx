import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { gradeByValue, listGames, SUBJECTS } from '../../utils/gamesService'
import { getFallbackGames } from '../../data/gamesSeed'
import GamesShell from './GamesShell'
import {
  subjectTheme,
  AcademicCapIcon, ArrowRightIcon, LockClosedIcon, SparklesIcon,
} from './gameIcons'

/**
 * /games/g/:grade — Step 2: pick a subject within the chosen grade.
 * Counts the games in each subject so empty subjects can be deprioritised.
 */
export default function SubjectSelector() {
  const { grade } = useParams()
  const gradeMeta = gradeByValue(grade)
  const [counts, setCounts] = useState(null) // { subjectSlug: count }

  useEffect(() => {
    if (!gradeMeta) return
    document.title = `${gradeMeta.label} Games — ZedExams`
    let cancelled = false
    async function load() {
      try {
        const live = await listGames({ grade: gradeMeta.value })
        const list = live.length ? live : getFallbackGames({ grade: gradeMeta.value })
        const acc = {}
        for (const s of SUBJECTS) acc[s.slug] = 0
        for (const g of list) acc[g.subject] = (acc[g.subject] || 0) + 1
        if (!cancelled) setCounts(acc)
      } catch {
        if (!cancelled) setCounts({})
      }
    }
    load()
    return () => { cancelled = true }
  }, [gradeMeta])

  if (!gradeMeta) return <Navigate to="/games" replace />

  const totalGames = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0

  return (
    <GamesShell crumbs={[{ label: gradeMeta.label }]}>
      <header className="mb-6 sm:mb-8 rounded-[20px] border border-slate-200 bg-gradient-to-r from-amber-50 via-white to-emerald-50 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 inline-flex items-center gap-1">
              <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
              Step 2 of 4 · Pick a subject
            </p>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black mt-1">
              {gradeMeta.label} — choose your subject
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {counts == null ? 'Loading games…' : `${totalGames} ${totalGames === 1 ? 'game' : 'games'} available for ${gradeMeta.label}.`}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="inline-flex items-center gap-2 w-auto px-3 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white font-black shadow-md">
              <AcademicCapIcon className="w-5 h-5" />
              G{gradeMeta.value}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SUBJECTS.map((s) => {
          const theme = subjectTheme(s.slug)
          const n = counts?.[s.slug]
          const isLoading = n == null
          const isEmpty = !isLoading && n === 0
          const progress = isLoading ? 0 : Math.min(100, Math.max(5, n * 15))

          const cardContent = (
            <>
              <div aria-hidden="true" className={`absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-25 ${theme.blob} blur-2xl`} />
              <div className="relative flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${theme.gradient} text-white flex items-center justify-center shadow-md shrink-0`}>
                  <theme.icon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-xl font-black text-slate-900">{s.label}</h2>
                    {isEmpty && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                        <LockClosedIcon className="w-2.5 h-2.5" />
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-bold ${isEmpty ? 'text-slate-500' : theme.text}`}>
                    {isLoading ? 'Checking…' : isEmpty ? 'Fresh games landing soon' : `${n} ${n === 1 ? 'game' : 'games'} available`}
                  </p>
                </div>
              </div>

              {!isEmpty && (
                <div className="relative mt-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    <span>Progress</span>
                    <span>{isLoading ? '—' : `${progress}% catalogue`}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/80 overflow-hidden">
                    <div
                      className={`h-full ${theme.bar} rounded-full transition-[width] duration-700`}
                      style={{ width: isLoading ? '30%' : `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="relative mt-4 flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  {isEmpty ? 'Check back soon' : 'Tap to play'}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs font-black ${isEmpty ? 'text-slate-400' : theme.text} group-hover:translate-x-0.5 transition`}>
                  {isEmpty ? (
                    <>Locked <LockClosedIcon className="w-3.5 h-3.5" /></>
                  ) : (
                    <>Play now <ArrowRightIcon className="w-3.5 h-3.5" /></>
                  )}
                </span>
              </div>
            </>
          )

          if (isEmpty) {
            return (
              <div
                key={s.slug}
                aria-disabled="true"
                className="group relative block rounded-[20px] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm opacity-80 overflow-hidden"
              >
                {cardContent}
              </div>
            )
          }

          return (
            <Link
              key={s.slug}
              to={`/games/g/${gradeMeta.value}/${s.slug}`}
              className={`group relative block rounded-[20px] border ${theme.ring} bg-gradient-to-br ${theme.soft} p-5 sm:p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] transition overflow-hidden`}
            >
              {cardContent}
            </Link>
          )
        })}
      </div>
    </GamesShell>
  )
}
