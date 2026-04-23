import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  HomeIcon, ClipboardDocumentListIcon, BookOpenIcon, PuzzlePieceIcon,
  TrophyIcon, BellIcon, UserCircleIcon, SpeakerWaveIcon, SpeakerXMarkIcon,
} from '@heroicons/react/24/outline'
import { isMuted, toggleMute } from '../../utils/gameSounds'
import { useAuth } from '../../contexts/AuthContext'

/**
 * Shared chrome for every /games page. Provides the light-themed layout,
 * a sticky nav and a breadcrumb strip. All icons use Heroicons for visual
 * consistency with the rest of the redesigned games surface.
 */
export default function GamesShell({ crumbs = [], children, maxW = 'max-w-6xl' }) {
  const { currentUser, userProfile } = useAuth()
  const firstName = userProfile?.displayName?.split(' ')[0] ?? null
  const initial = (firstName || userProfile?.email || 'Z').charAt(0).toUpperCase()
  const { pathname } = useLocation()
  const onGames = pathname.startsWith('/games')

  return (
    <div className="force-light-theme min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <nav className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className={`${maxW} mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3`}>
          <Link to={currentUser ? '/dashboard' : '/'} className="flex items-center gap-2 shrink-0">
            <picture>
              <source type="image/webp" srcSet="/zedexams-logo.webp?v=1" />
              <img
                src="/zedexams-logo.png?v=4"
                alt="ZedExams"
                className="h-9 w-auto object-contain flex-shrink-0"
                loading="eager"
              />
            </picture>
            <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-amber-100 text-amber-800">
              <PuzzlePieceIcon className="w-3 h-3" strokeWidth={2.5} />
              Games
            </span>
          </Link>

          {currentUser && (
            <div className="hidden md:flex items-center gap-1 text-sm font-bold text-slate-600">
              <NavTab to="/dashboard" icon={HomeIcon} label="Dashboard" active={pathname === '/dashboard'} />
              <NavTab to="/exams"     icon={ClipboardDocumentListIcon} label="Exams" active={pathname.startsWith('/exams')} />
              <NavTab to="/lessons"   icon={BookOpenIcon} label="Lessons" active={pathname.startsWith('/lessons')} />
              <NavTab to="/games"     icon={PuzzlePieceIcon} label="Games" active={onGames} />
            </div>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              to="/games/leaderboard"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-black bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
              title="Open live leaderboard"
            >
              <TrophyIcon className="w-4 h-4" strokeWidth={2.25} />
              <span className="hidden sm:inline">Leaderboard</span>
            </Link>
            <NotificationBell />
            <MuteToggle />
            {currentUser ? (
              <Link
                to="/profile"
                className="flex items-center gap-2 pl-1 pr-2 sm:pr-3 py-1 rounded-full bg-white border border-slate-200 hover:bg-slate-50 shadow-sm"
                title="Your profile"
              >
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-black flex items-center justify-center">
                  {initial}
                </span>
                <span className="hidden sm:inline text-xs font-black text-slate-700 max-w-[96px] truncate">{firstName ?? 'Profile'}</span>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-slate-700 hover:text-slate-900 px-2">
                  <UserCircleIcon className="w-4 h-4" />
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-2 sm:px-4 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-sm"
                >
                  Join free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {crumbs.length > 0 && (
        <div className="bg-white border-b border-slate-200">
          <div className={`${maxW} mx-auto px-4 sm:px-6 py-3 flex items-center flex-wrap gap-1 text-sm`}>
            <Link to="/games" className="font-bold text-slate-600 hover:text-slate-900">Games</Link>
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="text-slate-400">/</span>
                {c.to ? (
                  <Link to={c.to} className="font-bold text-slate-600 hover:text-slate-900">{c.label}</Link>
                ) : (
                  <span className="font-black text-slate-900">{c.label}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      <main className={`${maxW} mx-auto px-4 sm:px-6 py-6 sm:py-10`}>
        {children}
      </main>
    </div>
  )
}

function NavTab({ to, icon: Icon, label, active }) {
  return (
    <Link
      to={to}
      className={
        active
          ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800'
          : 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900'
      }
    >
      <Icon className="w-4 h-4" strokeWidth={2} />
      <span>{label}</span>
    </Link>
  )
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 text-slate-600"
        aria-label="Notifications"
        title="Notifications"
      >
        <BellIcon className="w-5 h-5" strokeWidth={2} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white shadow-xl p-3 z-30 animate-slide-in-soft">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 px-1">Updates</p>
          <ul className="space-y-1.5 text-sm">
            <li className="px-2 py-1.5 rounded-lg bg-amber-50 text-amber-900 font-bold">
              New daily challenge is live — earn streak points today!
            </li>
            <li className="px-2 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700">
              Fresh Grade 4 spelling games added this week.
            </li>
            <li className="px-2 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700">
              Leaderboard resets at midnight GMT.
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

function MuteToggle() {
  const [muted, setMuted] = useState(() => isMuted())
  const Icon = muted ? SpeakerXMarkIcon : SpeakerWaveIcon
  return (
    <button
      type="button"
      onClick={() => setMuted(toggleMute())}
      className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 text-slate-600"
      aria-label={muted ? 'Unmute game sounds' : 'Mute game sounds'}
      title={muted ? 'Unmute' : 'Mute'}
    >
      <Icon className="w-5 h-5" strokeWidth={2} />
    </button>
  )
}
