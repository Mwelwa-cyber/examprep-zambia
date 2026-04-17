import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Logo from '../ui/Logo'
import ThemeSelector from '../ui/ThemeSelector'

const NAV = [
  { to: '/admin',             icon: '📊', label: 'Dashboard',      end: true },
  { to: '/admin/lessons',     icon: '▦', label: 'Lessons'                   },
  { to: '/admin/lessons/new', icon: '📖', label: 'Create Lesson'             },
  { to: '/admin/quizzes/new', icon: '✏️', label: 'Create Quiz'               },
  { to: '/admin/papers/upload', icon: '📤', label: 'Upload Paper'            },
  { to: '/admin/content',     icon: '📁', label: 'Manage Content'            },
  { to: '/admin/approvals',   icon: '🔔', label: 'Approvals'                 },
  { to: '/admin/teacher-applications', icon: '🧑‍🏫', label: 'Teacher Apps'   },
  { to: '/admin/results',     icon: '📈', label: 'Results'                   },
  { to: '/admin/payments',    icon: '💳', label: 'Payments'                  },
]

export default function AdminLayout({ children }) {
  const { logout, userProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isLessonWorkspace = location.pathname.startsWith('/admin/lessons')

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="theme-bg theme-text min-h-screen flex">
      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside className="theme-card theme-border theme-shadow hidden w-60 flex-shrink-0 flex-col border-r md:flex">
        {/* Logo */}
        <div className="theme-border px-4 py-5 border-b">
          <Link to="/admin" className="inline-flex">
            <Logo variant="full" size="md" />
          </Link>
          <div className="mt-2 flex items-center justify-between gap-2 pl-1">
            <p className="theme-accent-text text-xs font-bold">Admin Panel</p>
            <ThemeSelector compact />
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1">
          <Link
            to="/dashboard"
            className="theme-bg-subtle theme-text hover:theme-accent-bg hover:theme-accent-text flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors"
          >
            <span className="text-base">🏠</span>
            Learner Dashboard
          </Link>
          <div className="theme-border my-2 border-t" />
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  isActive ? 'theme-accent-bg theme-accent-text shadow-sm' : 'theme-text-muted hover:theme-bg-subtle hover:theme-text'
                }`
              }>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info + Logout */}
        <div className="theme-border p-3 border-t">
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div className="theme-accent-fill theme-on-accent flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-black">
              {(userProfile?.displayName || 'A')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="theme-text truncate text-xs font-black">{userProfile?.displayName || 'Admin'}</p>
              <p className="theme-text-muted truncate text-xs">{userProfile?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors min-h-0">
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile Header ───────────────────────────────── */}
      <div className="theme-card theme-border theme-shadow fixed left-0 right-0 top-0 z-40 border-b md:hidden">
        <div className="flex items-center justify-between px-4 h-20">
          <Link to="/admin" className="flex items-center gap-2.5">
            <Logo variant="icon" size="md" />
            <span className="theme-text text-sm font-black">Admin Panel</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeSelector compact />
            <button onClick={() => setMobileOpen(o => !o)}
              aria-label={mobileOpen ? 'Close admin navigation' : 'Open admin navigation'}
              className="theme-text-muted hover:theme-bg-subtle min-h-0 rounded-lg p-2 transition-colors">
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Drawer Overlay ────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <nav className="theme-card theme-border absolute left-0 right-0 top-20 space-y-1 border-t p-3 shadow-xl"
            onClick={e => e.stopPropagation()}>
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="theme-bg-subtle theme-text hover:theme-accent-bg hover:theme-accent-text flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-colors"
            >
              <span>🏠</span>Learner Dashboard
            </Link>
            <div className="theme-border my-2 border-t" />
            {NAV.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                    isActive ? 'theme-accent-bg theme-accent-text' : 'theme-text-muted hover:theme-bg-subtle hover:theme-text'
                  }`
                }>
                <span>{item.icon}</span>{item.label}
              </NavLink>
            ))}
            <button onClick={handleLogout}
              className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 min-h-0">
              🚪 Sign Out
            </button>
          </nav>
        </div>
      )}

      {/* ── Main Content ────────────────────────────────── */}
      <main className="flex-1 min-w-0 md:pt-0 pt-20">
        <div className={`${isLessonWorkspace ? 'max-w-7xl' : 'max-w-4xl'} mx-auto px-4 py-6`}>
          {children}
        </div>
      </main>
    </div>
  )
}
