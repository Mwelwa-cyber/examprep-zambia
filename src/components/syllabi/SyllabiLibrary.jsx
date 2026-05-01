import { useEffect, useMemo, useRef, useState } from 'react'
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url'
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Lock,
  RefreshCw,
  Search,
} from '../ui/icons'
import Icon from '../ui/Icon'

let pdfjsLoader = null

async function loadPdfjs() {
  if (!pdfjsLoader) {
    pdfjsLoader = import('pdfjs-dist/legacy/build/pdf.mjs').then(module => {
      module.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
      return module
    })
  }
  return pdfjsLoader
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)} MB`
  return `${Math.ceil(bytes / 1024)} KB`
}

function phaseTone(phase) {
  const tones = {
    'Curriculum Framework': 'bg-amber-500/15 text-amber-100 ring-1 ring-amber-300/30',
    'Early Childhood': 'bg-pink-500/15 text-pink-100 ring-1 ring-pink-300/30',
    'Lower Primary': 'bg-sky-500/15 text-sky-100 ring-1 ring-sky-300/30',
    'Upper Primary': 'bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-300/30',
    Secondary: 'bg-violet-500/15 text-violet-100 ring-1 ring-violet-300/30',
    'Special Education': 'bg-orange-500/15 text-orange-100 ring-1 ring-orange-300/30',
  }
  return tones[phase] || 'theme-bg-subtle theme-text-muted ring-1 ring-white/10'
}

function ReaderButton({ children, disabled, ...props }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="inline-flex min-h-0 items-center justify-center gap-1.5 rounded-xl border theme-border theme-card px-3 py-2 text-xs font-black theme-text shadow-sm transition hover:theme-card-hover disabled:cursor-not-allowed disabled:opacity-45"
      {...props}
    >
      {children}
    </button>
  )
}

function SyllabusReader({ syllabus }) {
  const canvasRef = useRef(null)
  const [pdfDoc, setPdfDoc] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageCount, setPageCount] = useState(0)
  const [scale, setScale] = useState(1)
  const [loading, setLoading] = useState(false)
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!syllabus?.file) return undefined

    let cancelled = false
    let loadedDoc = null
    let loadingTask = null

    setLoading(true)
    setError('')
    setPdfDoc(null)
    setPageNumber(1)
    setPageCount(0)

    async function loadDocument() {
      try {
        const pdfjsLib = await loadPdfjs()
        loadingTask = pdfjsLib.getDocument({ url: syllabus.file })
        loadedDoc = await loadingTask.promise
        if (cancelled) {
          await loadedDoc.destroy()
          return
        }
        setPdfDoc(loadedDoc)
        setPageCount(loadedDoc.numPages)
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Could not open this syllabus.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDocument()

    return () => {
      cancelled = true
      loadingTask?.destroy?.()
      loadedDoc?.destroy?.()
    }
  }, [syllabus?.file])

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return undefined

    let cancelled = false
    let renderTask = null

    async function renderPage() {
      setRendering(true)
      setError('')
      try {
        const page = await pdfDoc.getPage(pageNumber)
        if (cancelled) return

        const canvas = canvasRef.current
        const context = canvas.getContext('2d', { alpha: false })
        const viewport = page.getViewport({ scale })
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)

        canvas.width = Math.floor(viewport.width * pixelRatio)
        canvas.height = Math.floor(viewport.height * pixelRatio)
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, viewport.width, viewport.height)

        renderTask = page.render({ canvasContext: context, viewport })
        await renderTask.promise
      } catch (err) {
        if (!cancelled && err?.name !== 'RenderingCancelledException') {
          setError(err?.message || 'Could not render this page.')
        }
      } finally {
        if (!cancelled) setRendering(false)
      }
    }

    renderPage()

    return () => {
      cancelled = true
      renderTask?.cancel?.()
    }
  }, [pdfDoc, pageNumber, scale])

  if (!syllabus) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl border theme-border theme-card p-8 text-center">
        <div>
          <Icon as={FileText} size="xl" className="mx-auto theme-text-muted" />
          <p className="mt-3 text-sm font-black theme-text">No syllabus selected</p>
        </div>
      </div>
    )
  }

  return (
    <section className="zx-card theme-card overflow-hidden rounded-3xl border theme-border shadow-sm">
      <div className="border-b theme-border p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${phaseTone(syllabus.phase)}`}>
                {syllabus.phase}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border theme-border theme-bg-subtle px-2.5 py-1 text-xs font-black theme-text-muted">
                <Icon as={Lock} size="xs" strokeWidth={2.1} />
                View only
              </span>
            </div>
            <h1 className="mt-3 break-words text-2xl font-black leading-tight theme-text sm:text-3xl">
              {syllabus.title}
            </h1>
            <p className="mt-1 text-sm font-bold theme-text-muted">
              {formatBytes(syllabus.sizeBytes)} PDF
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ReaderButton
              onClick={() => setPageNumber(page => Math.max(1, page - 1))}
              disabled={loading || rendering || pageNumber <= 1}
              aria-label="Previous page"
            >
              <Icon as={ChevronLeft} size="xs" strokeWidth={2.1} />
              Prev
            </ReaderButton>
            <div className="rounded-xl border theme-border theme-bg-subtle px-3 py-2 text-xs font-black theme-text">
              Page {pageCount ? pageNumber : '-'} / {pageCount || '-'}
            </div>
            <ReaderButton
              onClick={() => setPageNumber(page => Math.min(pageCount || page, page + 1))}
              disabled={loading || rendering || !pageCount || pageNumber >= pageCount}
              aria-label="Next page"
            >
              Next
              <Icon as={ChevronRight} size="xs" strokeWidth={2.1} />
            </ReaderButton>
            <ReaderButton
              onClick={() => setScale(value => Math.max(0.75, Number((value - 0.1).toFixed(2))))}
              disabled={loading || rendering || scale <= 0.75}
              aria-label="Zoom out"
            >
              -
            </ReaderButton>
            <ReaderButton
              onClick={() => setScale(value => Math.min(1.5, Number((value + 0.1).toFixed(2))))}
              disabled={loading || rendering || scale >= 1.5}
              aria-label="Zoom in"
            >
              +
            </ReaderButton>
          </div>
        </div>
      </div>

      <div className="relative min-h-[520px] theme-bg-subtle p-3 sm:p-5">
        {(loading || rendering) && (
          <div className="absolute right-5 top-5 z-10 inline-flex items-center gap-2 rounded-full border theme-border theme-card px-3 py-1.5 text-xs font-black theme-text shadow-sm">
            <Icon as={RefreshCw} size="xs" className="animate-spin" />
            {loading ? 'Opening' : 'Rendering'}
          </div>
        )}

        {error ? (
          <div className="flex min-h-[420px] items-center justify-center text-center">
            <div className="max-w-sm rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
              <p className="font-black">Could not load syllabus</p>
              <p className="mt-1 text-sm font-bold">{error}</p>
            </div>
          </div>
        ) : (
          <div className="overflow-auto rounded-2xl border theme-border bg-slate-200/70 p-3 shadow-inner">
            <canvas
              ref={canvasRef}
              onContextMenu={event => event.preventDefault()}
              className="mx-auto block max-w-none bg-white shadow-xl"
            />
          </div>
        )}
      </div>
    </section>
  )
}

export default function SyllabiLibrary() {
  const [syllabi, setSyllabi] = useState([])
  const [query, setQuery] = useState('')
  const [phase, setPhase] = useState('All')
  const [subject, setSubject] = useState('All')
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadManifest() {
      try {
        const response = await fetch('/syllabi/manifest.json', { cache: 'no-store' })
        if (!response.ok) throw new Error(`Manifest request failed: ${response.status}`)
        const data = await response.json()
        if (cancelled) return
        const list = Array.isArray(data) ? data : []
        setSyllabi(list)
        setSelectedId(list[0]?.id || '')
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Could not load syllabi.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadManifest()

    return () => {
      cancelled = true
    }
  }, [])

  const phases = useMemo(() => {
    const unique = Array.from(new Set(syllabi.map(item => item.phase).filter(Boolean)))
    return ['All', ...unique]
  }, [syllabi])

  const subjects = useMemo(() => {
    const unique = Array.from(new Set(syllabi.map(item => item.subject).filter(Boolean)))
    return ['All', ...unique.sort()]
  }, [syllabi])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return syllabi.filter(item => {
      const matchesPhase = phase === 'All' || item.phase === phase
      const matchesSubject = subject === 'All' || item.subject === subject
      const matchesQuery = !term
        || item.title.toLowerCase().includes(term)
        || item.phase.toLowerCase().includes(term)
        || (item.subject && item.subject.toLowerCase().includes(term))
      return matchesPhase && matchesSubject && matchesQuery
    })
  }, [phase, subject, query, syllabi])

  const selected = useMemo(() => {
    return filtered.find(item => item.id === selectedId) || filtered[0] || null
  }, [filtered, selectedId])

  useEffect(() => {
    if (filtered.length && !filtered.some(item => item.id === selectedId)) {
      setSelectedId(filtered[0].id)
    }
  }, [filtered, selectedId])

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-28 sm:px-6 lg:px-8">
      <section className="mb-5 overflow-hidden rounded-3xl border theme-border bg-[linear-gradient(135deg,rgba(6,78,59,0.95)_0%,rgba(15,23,42,0.96)_58%,rgba(30,41,59,0.96)_100%)] p-5 text-white shadow-elev-md sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
              <Icon as={FileText} size="lg" strokeWidth={2.1} />
            </div>
            <h1 className="text-3xl font-black leading-tight sm:text-4xl">Syllabi</h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-relaxed text-white/72 sm:text-base">
              Official curriculum PDFs collected from the new syllabus archive.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-left sm:text-right">
            <p className="text-2xl font-black leading-none">{syllabi.length || '-'}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-wide text-white/65">View-only files</p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-black">Could not load syllabi</p>
          <p className="mt-1 text-sm font-bold">{error}</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="zx-card theme-card h-fit rounded-3xl border theme-border p-4 shadow-sm lg:sticky lg:top-24">
            <label className="relative block">
              <span className="sr-only">Search syllabi</span>
              <Icon as={Search} size="sm" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 theme-text-muted" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search syllabi"
                className="w-full rounded-2xl border theme-border theme-bg-subtle py-3 pl-10 pr-3 text-sm font-bold theme-text outline-none transition focus:ring-2 focus:ring-emerald-400/50"
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-2">
              {phases.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPhase(item)}
                  className={`min-h-0 rounded-full px-3 py-1.5 text-xs font-black transition ${
                    phase === item
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'theme-bg-subtle theme-text-muted hover:theme-card-hover'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-black uppercase tracking-wide theme-text-muted">Subject</p>
              <div className="flex flex-wrap gap-2">
                {subjects.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSubject(item)}
                    className={`min-h-0 rounded-full px-3 py-1.5 text-xs font-black transition ${
                      subject === item
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'theme-bg-subtle theme-text-muted hover:theme-card-hover'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 max-h-[62vh] space-y-2 overflow-y-auto pr-1">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-2xl theme-bg-subtle" />
                ))
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl border theme-border theme-bg-subtle p-4 text-center">
                  <p className="text-sm font-black theme-text">No matches</p>
                </div>
              ) : filtered.map(item => {
                const active = item.id === selected?.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={active ? 'true' : undefined}
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full min-h-0 rounded-2xl border p-3 text-left transition ${
                      active
                        ? 'border-emerald-400 bg-emerald-500/15 shadow-sm'
                        : 'theme-border theme-bg-subtle hover:theme-card-hover'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        active ? 'bg-emerald-600 text-white' : 'theme-card theme-text-muted'
                      }`}>
                        <Icon as={FileText} size="sm" strokeWidth={2.1} />
                      </span>
                      <span className="min-w-0">
                        <span className="block break-words text-sm font-black leading-snug theme-text">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-xs font-bold theme-text-muted">
                          {item.phase} · {formatBytes(item.sizeBytes)}
                        </span>
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>

          <SyllabusReader syllabus={selected} />
        </div>
      )}
    </main>
  )
}
