import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { useFirestore } from '../../../hooks/useFirestore'
import {
  listMyGenerations,
  titleForGeneration,
  formatDate,
} from '../../../utils/teacherLibraryService'

const SECTIONS = [
  {
    key: 'lesson_plan',
    label: 'Lesson Plans',
    icon: '🦊',
    accent: '#fde2c4',
    createTo: '/teacher/generate/lesson-plan',
    emptyHint: 'Generate your first lesson plan to see it here.',
    source: 'generations',
  },
  {
    key: 'notes',
    label: 'Notes',
    icon: '🦉',
    accent: '#dbe7f4',
    createTo: '/teacher/generate/notes',
    emptyHint: 'Generate teacher delivery notes from a lesson plan.',
    source: 'generations',
  },
  {
    key: 'scheme_of_work',
    label: 'Schemes of Work',
    icon: '🦁',
    accent: '#faecb8',
    createTo: '/teacher/generate/scheme-of-work',
    emptyHint: 'Plan a whole term with a scheme of work.',
    source: 'generations',
  },
  {
    key: 'worksheet',
    label: 'Worksheets',
    icon: '🐢',
    accent: '#d8ecd0',
    createTo: '/teacher/generate/worksheet',
    emptyHint: 'Generate practice worksheets aligned to your lesson.',
    source: 'generations',
  },
  {
    key: 'flashcards',
    label: 'Flashcards',
    icon: '🎴',
    accent: '#fde9b8',
    createTo: '/teacher/generate/flashcards',
    emptyHint: 'Build a flashcard deck for quick recall practice.',
    source: 'generations',
  },
  {
    key: 'rubric',
    label: 'Rubrics',
    icon: '📋',
    accent: '#f0d6e0',
    createTo: '/teacher/generate/rubric',
    emptyHint: 'Generate a marking rubric for an assessment.',
    source: 'generations',
  },
  {
    key: 'assessments',
    label: 'Assessments',
    icon: '🦅',
    accent: '#e8d8f0',
    createTo: '/teacher/assessments',
    emptyHint: 'Create a topic, monthly or end-of-term assessment.',
    source: 'quizzes',
  },
]

function formatSubject(s) {
  return String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function genSubtitle(g) {
  const parts = [g.inputs?.grade, g.inputs?.subject ? formatSubject(g.inputs.subject) : ''].filter(Boolean)
  return parts.join(' · ')
}

function quizSubtitle(q) {
  const parts = [q.grade || q.targetGrade, q.subject ? formatSubject(q.subject) : ''].filter(Boolean)
  return parts.join(' · ')
}

export default function TeacherLibrary() {
  const { currentUser } = useAuth()
  const { getMyQuizzes } = useFirestore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const activeFolder = searchParams.get('tool') || ''
  const initialQuery = searchParams.get('q') || ''

  const [generations, setGenerations] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [errorMessage, setErrorMessage] = useState('')
  const [search, setSearch] = useState(initialQuery)

  useEffect(() => {
    if (!currentUser) return
    let cancelled = false
    setStatus('loading')
    Promise.all([
      listMyGenerations({ uid: currentUser.uid }),
      getMyQuizzes(currentUser.uid).catch(() => []),
    ])
      .then(([gens, qs]) => {
        if (cancelled) return
        setGenerations(gens)
        setQuizzes(qs)
        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setErrorMessage(err?.message || 'Could not load your library.')
        setStatus('error')
      })
    return () => { cancelled = true }
  }, [currentUser])

  const term = search.trim().toLowerCase()

  const filteredGenerations = useMemo(() => {
    if (!term) return generations
    return generations.filter((r) => {
      const haystack = [
        r.inputs?.topic, r.inputs?.subtopic,
        titleForGeneration(r), r.inputs?.grade, r.inputs?.subject,
      ].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(term)
    })
  }, [generations, term])

  const filteredQuizzes = useMemo(() => {
    if (!term) return quizzes
    return quizzes.filter((q) => {
      const haystack = [q.title, q.topic, q.subject, q.grade].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(term)
    })
  }, [quizzes, term])

  const sectionData = useMemo(() => {
    const result = {}
    SECTIONS.forEach((s) => { result[s.key] = [] })
    filteredGenerations.forEach((g) => {
      if (result[g.tool]) {
        result[g.tool].push({
          id: g.id,
          title: titleForGeneration(g),
          subtitle: genSubtitle(g),
          metaLabel: formatDate(g.createdAt),
          to: `/teacher/library/${g.id}`,
        })
      }
    })
    filteredQuizzes.forEach((q) => {
      result.assessments.push({
        id: q.id,
        title: q.title || q.topic || 'Untitled assessment',
        subtitle: quizSubtitle(q),
        metaLabel: q.createdAt ? formatDate(q.createdAt) : '',
        to: `/teacher/assessments/${q.id}/edit`,
      })
    })
    return result
  }, [filteredGenerations, filteredQuizzes])

  const totalSaved = generations.length + quizzes.length

  const sectionCounts = useMemo(() => {
    const counts = {}
    SECTIONS.forEach((s) => { counts[s.key] = 0 })
    generations.forEach((g) => {
      if (counts[g.tool] != null) counts[g.tool] += 1
    })
    counts.assessments = (counts.assessments || 0) + quizzes.length
    return counts
  }, [generations, quizzes])

  const visibleSections = activeFolder
    ? SECTIONS.filter((s) => s.key === activeFolder)
    : SECTIONS

  function setFolder(key) {
    const params = new URLSearchParams(searchParams)
    if (!key) params.delete('tool')
    else params.set('tool', key)
    navigate(`/teacher/library${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: '#f5efe1' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <Link
              to="/teacher"
              className="inline-flex items-center gap-1.5 mb-3 no-underline text-sm font-bold rounded-xl border-2 px-3 py-1.5 transition-colors"
              style={{ borderColor: '#0e2a32', color: '#0e2a32', background: '#fff' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f5efe1' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
            >
              ← Home
            </Link>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 800, fontSize: 32, color: '#0e2a32', margin: 0, letterSpacing: '-.3px' }}>
              Library
            </h1>
            <p style={{ fontSize: 13, color: '#566f76', margin: '4px 0 0' }}>
              {status === 'ready'
                ? `${totalSaved} saved item${totalSaved === 1 ? '' : 's'} across all studios`
                : 'Everything you have saved across studios.'}
            </p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your library…"
            className="px-4 py-2.5 rounded-xl border-2 text-sm focus:outline-none w-full sm:w-72"
            style={{ borderColor: '#0e2a32', background: '#fff', color: '#0e2a32' }}
          />
        </div>

        {/* Folders */}
        {status === 'ready' && (
          <FolderGrid
            sections={SECTIONS}
            counts={sectionCounts}
            active={activeFolder}
            total={totalSaved}
            onSelect={setFolder}
          />
        )}

        {/* Body */}
        {status === 'loading' && <LoadingState />}
        {status === 'error' && <ErrorState message={errorMessage} />}

        {status === 'ready' && (
          <div>
            {visibleSections.map((section) => (
              <LibrarySection
                key={section.key}
                section={section}
                items={sectionData[section.key]}
                initialFocus={activeFolder}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FolderGrid({ sections, counts, active, total, onSelect }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 800, fontSize: 18, color: '#0e2a32', margin: 0 }}>
          Folders
        </h2>
        {active && (
          <button
            type="button"
            onClick={() => onSelect('')}
            className="text-xs font-bold rounded-lg border-2 px-3 py-1.5 transition-colors"
            style={{ borderColor: '#0e2a32', color: '#0e2a32', background: '#fff' }}
          >
            ← All folders
          </button>
        )}
      </div>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}
      >
        <FolderCard
          icon="📚"
          label="All items"
          count={total}
          accent="#f0eee8"
          isActive={!active}
          onClick={() => onSelect('')}
        />
        {sections.map((s) => (
          <FolderCard
            key={s.key}
            icon={s.icon}
            label={s.label}
            count={counts[s.key] || 0}
            accent={s.accent}
            isActive={active === s.key}
            onClick={() => onSelect(s.key)}
          />
        ))}
      </div>
    </div>
  )
}

function FolderCard({ icon, label, count, accent, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-2xl border-2 p-3 transition-all hover:-translate-y-0.5"
      style={{
        background: isActive ? '#0e2a32' : '#fff',
        borderColor: '#0e2a32',
        color: isActive ? '#fff' : '#0e2a32',
        boxShadow: isActive ? '0 8px 18px rgba(14,42,50,.18)' : 'none',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          style={{
            width: 36, height: 36, borderRadius: 10, background: accent,
            display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p
            className="truncate"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 800, fontSize: 13.5, margin: 0, lineHeight: 1.2 }}
          >
            {label}
          </p>
          <p
            style={{ fontSize: 11, margin: '2px 0 0', fontWeight: 600, opacity: isActive ? 0.85 : 0.6 }}
          >
            {count} {count === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>
    </button>
  )
}

function LibrarySection({ section, items, initialFocus }) {
  const isFocused = initialFocus === section.key
  return (
    <section
      id={`section-${section.key}`}
      className="mb-8 rounded-2xl"
      style={isFocused ? { background: 'rgba(255,122,46,.06)', padding: 12, marginInline: -12 } : undefined}
    >
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div style={{ width: 42, height: 42, borderRadius: 12, background: section.accent, display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0 }}>
            {section.icon}
          </div>
          <div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 800, fontSize: 20, color: '#0e2a32', margin: 0, lineHeight: 1.1 }}>
              {section.label}
            </h2>
            <p style={{ fontSize: 12, color: '#8a9aa1', margin: '3px 0 0', fontWeight: 600 }}>
              {items.length} saved
            </p>
          </div>
        </div>
        {section.createTo && (
          <Link
            to={section.createTo}
            className="inline-flex items-center gap-1.5 rounded-xl font-bold no-underline transition-colors"
            style={{ background: '#0e2a32', color: '#fff', padding: '8px 14px', fontSize: 12.5 }}
          >
            + New
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div
          className="rounded-2xl border-2 border-dashed py-6 px-4 text-center"
          style={{ background: '#fff', borderColor: '#d4cab2' }}
        >
          <p style={{ fontSize: 13, color: '#8a9aa1', margin: 0 }}>
            {section.emptyHint}
          </p>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {items.map((item) => (
            <LibraryCard
              key={item.id}
              icon={section.icon}
              accent={section.accent}
              title={item.title}
              subtitle={item.subtitle}
              meta={item.metaLabel}
              to={item.to}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function LibraryCard({ icon, accent, title, subtitle, meta, to }) {
  return (
    <Link
      to={to}
      className="block no-underline rounded-2xl border-2 p-4 transition-all hover:-translate-y-0.5"
      style={{ background: '#fff', borderColor: '#0e2a32', minHeight: 140, color: '#0e2a32' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 20px rgba(14,42,50,.1)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 11, background: accent, display: 'grid', placeItems: 'center', fontSize: 20, marginBottom: 10, flexShrink: 0 }}>
        {icon}
      </div>
      <p style={{ fontFamily: "'Fraunces', serif", fontWeight: 800, fontSize: 15, color: '#0e2a32', margin: '0 0 4px', lineHeight: 1.25 }} className="line-clamp-2">
        {title}
      </p>
      {subtitle && (
        <p style={{ fontSize: 12, color: '#566f76', margin: 0, lineHeight: 1.4 }} className="line-clamp-1">
          {subtitle}
        </p>
      )}
      {meta && (
        <p style={{ fontSize: 11, color: '#8a9aa1', margin: '10px 0 0', fontWeight: 600 }}>
          {meta}
        </p>
      )}
    </Link>
  )
}

function LoadingState() {
  return (
    <div className="rounded-2xl border-2 border-dashed p-12 text-center" style={{ background: '#fff', borderColor: '#d4cab2' }}>
      <div className="text-4xl mb-3 animate-bounce">📚</div>
      <p style={{ fontSize: 13, color: '#8a9aa1' }}>Loading your library…</p>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div className="rounded-2xl border-2 border-dashed p-12 text-center" style={{ background: '#fff', borderColor: '#d4cab2' }}>
      <div className="text-4xl mb-3">⚠️</div>
      <p style={{ fontFamily: "'Fraunces', serif", fontWeight: 800, fontSize: 16, color: '#0e2a32', marginBottom: 6 }}>
        Could not load your library
      </p>
      <p style={{ fontSize: 13, color: '#8a9aa1', margin: 0 }}>{message}</p>
    </div>
  )
}
