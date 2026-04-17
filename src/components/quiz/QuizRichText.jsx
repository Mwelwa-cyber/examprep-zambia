import { startTransition, useEffect, useMemo, useRef, useState } from 'react'
import {
  createMathNodeHtml,
  createTableHtml,
  ensureRichTextHtml,
  loadKaTeXAssets,
  renderMathInElement,
  richTextHasContent,
  serializeEditorElement,
} from '../../utils/quizRichText.js'

const TEXT_COLORS = ['#0f172a', '#1d4ed8', '#0f766e', '#15803d', '#b45309', '#c2410c', '#be123c', '#7c3aed', '#475569', '#dc2626']
const HIGHLIGHT_COLORS = ['#fef08a', '#fde68a', '#bfdbfe', '#bae6fd', '#bbf7d0', '#fecaca', '#f5d0fe', '#e5e7eb']
const QUICK_TEMPLATES = [
  { label: 'Fraction', value: '\\frac{a}{b}' },
  { label: 'Power', value: 'x^{2}' },
  { label: 'Root', value: '\\sqrt{x}' },
  { label: 'Subscript', value: 'x_{1}' },
  { label: 'x²', value: 'x^2' },
  { label: 'x³', value: 'x^3' },
  { label: '½', value: '\\frac{1}{2}' },
  { label: 'Equation', value: 'ax^2 + bx + c = 0' },
]
const SYMBOLS = ['\\times', '\\div', '\\pi', '\\theta', '\\sqrt{}', '\\leq', '\\geq', '\\sum', '\\alpha', '\\beta', '\\gamma', '\\Delta']

function joinClasses(...parts) {
  return parts.filter(Boolean).join(' ')
}

function getSelectionRange(editorElement) {
  const selection = window.getSelection()
  if (!selection?.rangeCount) return null
  const range = selection.getRangeAt(0)
  const anchorNode = range.commonAncestorContainer
  return editorElement.contains(anchorNode) ? range.cloneRange() : null
}

function focusEditorAtEnd(editorElement) {
  editorElement.focus()
  const range = document.createRange()
  range.selectNodeContents(editorElement)
  range.collapse(false)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
  return range
}

function restoreSelection(editorElement, savedRange) {
  const range = savedRange && editorElement.contains(savedRange.commonAncestorContainer)
    ? savedRange
    : focusEditorAtEnd(editorElement)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
  return range
}

function insertHtmlAtSelection(editorElement, savedRange, html) {
  restoreSelection(editorElement, savedRange)
  document.execCommand('insertHTML', false, html)
}

function ToolbarButton({ active = false, title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={event => event.preventDefault()}
      onClick={onClick}
      className={joinClasses(
        'min-h-0 rounded-lg border px-2.5 py-1.5 text-xs font-black transition-colors',
        active
          ? 'border-[var(--accent)] theme-accent-bg theme-accent-text'
          : 'theme-border theme-card theme-text hover:border-[var(--accent)] hover:theme-accent-bg',
      )}
    >
      {children}
    </button>
  )
}

function ColorPalette({ colors, onPick }) {
  return (
    <div className="theme-card theme-border absolute left-0 top-[calc(100%+0.5rem)] z-20 grid w-44 grid-cols-5 gap-2 rounded-2xl border p-3 shadow-xl">
      {colors.map(color => (
        <button
          key={color}
          type="button"
          onMouseDown={event => event.preventDefault()}
          onClick={() => onPick(color)}
          className="h-7 w-7 min-h-0 rounded-full border border-white/80 shadow-sm transition-transform hover:scale-105"
          style={{ backgroundColor: color }}
          aria-label={`Choose ${color}`}
        />
      ))}
    </div>
  )
}

function MathModal({ open, onClose, onInsert }) {
  const [latex, setLatex] = useState('')
  const previewRef = useRef(null)

  useEffect(() => {
    if (!open) return
    loadKaTeXAssets()
  }, [open])

  useEffect(() => {
    if (!open || !previewRef.current) return
    const container = previewRef.current
    const previewNode = container.querySelector('.mnode')
    if (!previewNode) return

    loadKaTeXAssets().then(() => {
      renderMathInElement(container)
    })
  }, [latex, open])

  useEffect(() => {
    if (!open) setLatex('')
  }, [open])

  if (!open) return null

  const previewHtml = latex ? createMathNodeHtml(latex) : '<p class="quiz-rich-muted">Type LaTeX or choose a template</p>'

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="theme-card theme-border w-full max-w-3xl rounded-[28px] border p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="theme-text text-lg font-black">Insert Math</p>
            <p className="theme-text-muted mt-1 text-sm">Pick a template, tap symbols, or type raw LaTeX.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="theme-text-muted min-h-0 bg-transparent p-1 text-xl shadow-none hover:theme-text"
          >
            ×
          </button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div>
              <p className="theme-text-muted mb-2 text-xs font-black uppercase tracking-wide">Quick Templates</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {QUICK_TEMPLATES.map(template => (
                  <button
                    key={template.label}
                    type="button"
                    onClick={() => setLatex(template.value)}
                    className="theme-bg-subtle theme-border theme-text min-h-0 rounded-xl border px-3 py-2 text-left text-sm font-bold transition-colors hover:border-[var(--accent)]"
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="theme-text-muted mb-2 text-xs font-black uppercase tracking-wide">Symbols</p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {SYMBOLS.map(symbol => (
                  <button
                    key={symbol}
                    type="button"
                    onClick={() => setLatex(current => `${current}${symbol}`)}
                    className="theme-card theme-border theme-text min-h-0 rounded-xl border px-2 py-2 text-sm font-black transition-colors hover:border-[var(--accent)] hover:theme-accent-bg"
                  >
                    {symbol.replace(/\\/g, '')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="theme-text-muted mb-2 block text-xs font-black uppercase tracking-wide">LaTeX</span>
              <textarea
                value={latex}
                onChange={event => setLatex(event.target.value)}
                placeholder="e.g. \frac{1}{2}x^2"
                rows={5}
                className="theme-input w-full rounded-2xl border-2 px-3 py-3 text-sm outline-none transition-colors focus:border-[var(--accent)]"
              />
            </label>

            <div className="theme-bg-subtle theme-border min-h-[9rem] rounded-2xl border p-4">
              <p className="theme-text-muted mb-2 text-xs font-black uppercase tracking-wide">Preview</p>
              <div
                ref={previewRef}
                className="quiz-rich-content min-h-[5rem]"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!latex.trim()) return
                onInsert(latex)
                onClose()
              }}
              disabled={!latex.trim()}
              className="theme-accent-fill theme-on-accent w-full rounded-2xl py-3 font-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Insert Math
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TablePopover({ open, onClose, onPick }) {
  const [hovered, setHovered] = useState({ rows: 2, columns: 2 })

  useEffect(() => {
    if (!open) setHovered({ rows: 2, columns: 2 })
  }, [open])

  if (!open) return null

  return (
    <div className="theme-card theme-border absolute right-0 top-[calc(100%+0.5rem)] z-20 rounded-2xl border p-3 shadow-xl">
      <p className="theme-text text-sm font-black">Insert Table</p>
      <p className="theme-text-muted mt-1 text-xs font-bold">{hovered.columns} × {hovered.rows}</p>
      <div className="mt-3 grid grid-cols-6 gap-1">
        {Array.from({ length: 8 }).map((_, rowIndex) =>
          Array.from({ length: 6 }).map((_, columnIndex) => {
            const active = rowIndex < hovered.rows && columnIndex < hovered.columns
            return (
              <button
                key={`${rowIndex}-${columnIndex}`}
                type="button"
                onMouseEnter={() => setHovered({ rows: rowIndex + 1, columns: columnIndex + 1 })}
                onMouseDown={event => event.preventDefault()}
                onClick={() => {
                  onPick(rowIndex + 1, columnIndex + 1)
                  onClose()
                }}
                className={joinClasses(
                  'h-6 w-6 min-h-0 rounded-md border transition-colors',
                  active
                    ? 'border-[var(--accent)] bg-[var(--accent-bg)]'
                    : 'theme-border theme-bg-subtle',
                )}
                aria-label={`Insert ${columnIndex + 1} columns and ${rowIndex + 1} rows`}
              />
            )
          }),
        )}
      </div>
    </div>
  )
}

export function RichTextContent({ value, className = '' }) {
  const rootRef = useRef(null)
  const safeHtml = useMemo(() => ensureRichTextHtml(value), [value])

  useEffect(() => {
    if (!rootRef.current || !safeHtml) return
    loadKaTeXAssets().then(() => renderMathInElement(rootRef.current))
  }, [safeHtml])

  if (!safeHtml) return null

  return (
    <div
      ref={rootRef}
      className={joinClasses('quiz-rich-content', className)}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeightClass = 'min-h-[7rem]',
  compact = false,
}) {
  const editorRef = useRef(null)
  const savedRangeRef = useRef(null)
  const [commandState, setCommandState] = useState({})
  const [paletteOpen, setPaletteOpen] = useState(null)
  const [mathOpen, setMathOpen] = useState(false)
  const [tableOpen, setTableOpen] = useState(false)
  const [isEmpty, setIsEmpty] = useState(!richTextHasContent(value))

  function syncFromEditor() {
    if (!editorRef.current) return
    const nextHtml = serializeEditorElement(editorRef.current)
    setIsEmpty(!richTextHasContent(nextHtml))
    startTransition(() => onChange(nextHtml))
  }

  function refreshCommandState() {
    if (!editorRef.current) return
    const selection = window.getSelection()
    const anchorNode = selection?.anchorNode
    if (!anchorNode || !editorRef.current.contains(anchorNode)) {
      setCommandState({})
      return
    }

    setCommandState({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      subscript: document.queryCommandState('subscript'),
      superscript: document.queryCommandState('superscript'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
    })
  }

  function rememberSelection() {
    if (!editorRef.current) return
    const range = getSelectionRange(editorRef.current)
    if (range) savedRangeRef.current = range
  }

  function runCommand(command, valueArg = null) {
    if (!editorRef.current) return
    restoreSelection(editorRef.current, savedRangeRef.current)
    document.execCommand('styleWithCSS', false, true)
    document.execCommand(command, false, valueArg)
    editorRef.current.focus()
    syncFromEditor()
    refreshCommandState()
  }

  useEffect(() => {
    if (!editorRef.current) return
    const nextHtml = ensureRichTextHtml(value)
    const currentHtml = serializeEditorElement(editorRef.current)

    if (currentHtml !== nextHtml) {
      editorRef.current.innerHTML = nextHtml
      loadKaTeXAssets().then(() => renderMathInElement(editorRef.current))
    }

    setIsEmpty(!richTextHasContent(nextHtml))
  }, [value])

  useEffect(() => {
    loadKaTeXAssets()
  }, [])

  useEffect(() => {
    function handleSelectionChange() {
      refreshCommandState()
      rememberSelection()
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [])

  return (
    <>
      <div className={joinClasses('theme-card theme-border overflow-hidden rounded-2xl border', compact ? '' : 'shadow-sm')}>
        <div className="theme-bg-subtle theme-border relative flex flex-wrap items-center gap-2 border-b px-3 py-2">
          <ToolbarButton title="Undo" onClick={() => runCommand('undo')}>↩</ToolbarButton>
          <ToolbarButton title="Redo" onClick={() => runCommand('redo')}>↪</ToolbarButton>
          <span className="theme-border h-6 border-l" />
          <ToolbarButton title="Bold" active={commandState.bold} onClick={() => runCommand('bold')}>B</ToolbarButton>
          <ToolbarButton title="Italic" active={commandState.italic} onClick={() => runCommand('italic')}><span className="italic">I</span></ToolbarButton>
          <ToolbarButton title="Underline" active={commandState.underline} onClick={() => runCommand('underline')}><span className="underline">U</span></ToolbarButton>
          <ToolbarButton title="Strike" active={commandState.strikeThrough} onClick={() => runCommand('strikeThrough')}><span className="line-through">S</span></ToolbarButton>
          <ToolbarButton title="Superscript" active={commandState.superscript} onClick={() => runCommand('superscript')}>x²</ToolbarButton>
          <ToolbarButton title="Subscript" active={commandState.subscript} onClick={() => runCommand('subscript')}>x₂</ToolbarButton>
          <span className="theme-border h-6 border-l" />
          <ToolbarButton title="Bullet List" active={commandState.insertUnorderedList} onClick={() => runCommand('insertUnorderedList')}>• List</ToolbarButton>
          <ToolbarButton title="Numbered List" active={commandState.insertOrderedList} onClick={() => runCommand('insertOrderedList')}>1. List</ToolbarButton>
          <ToolbarButton title="Align Left" active={commandState.justifyLeft} onClick={() => runCommand('justifyLeft')}>⇤</ToolbarButton>
          <ToolbarButton title="Align Center" active={commandState.justifyCenter} onClick={() => runCommand('justifyCenter')}>≡</ToolbarButton>
          <ToolbarButton title="Align Right" active={commandState.justifyRight} onClick={() => runCommand('justifyRight')}>⇥</ToolbarButton>

          <div className="relative">
            <ToolbarButton
              title="Text Color"
              onClick={() => {
                rememberSelection()
                setTableOpen(false)
                setPaletteOpen(current => current === 'text' ? null : 'text')
              }}
            >
              A
            </ToolbarButton>
            {paletteOpen === 'text' && (
              <ColorPalette
                colors={TEXT_COLORS}
                onPick={color => {
                  runCommand('foreColor', color)
                  setPaletteOpen(null)
                }}
              />
            )}
          </div>

          <div className="relative">
            <ToolbarButton
              title="Highlight"
              onClick={() => {
                rememberSelection()
                setTableOpen(false)
                setPaletteOpen(current => current === 'highlight' ? null : 'highlight')
              }}
            >
              H
            </ToolbarButton>
            {paletteOpen === 'highlight' && (
              <ColorPalette
                colors={HIGHLIGHT_COLORS}
                onPick={color => {
                  runCommand('hiliteColor', color)
                  setPaletteOpen(null)
                }}
              />
            )}
          </div>

          <span className="theme-border h-6 border-l" />
          <ToolbarButton
            title="Insert Math"
            onClick={() => {
              rememberSelection()
              setPaletteOpen(null)
              setMathOpen(true)
            }}
          >
            ∑ Math
          </ToolbarButton>

          <div className="relative ml-auto">
            <ToolbarButton
              title="Insert Table"
              onClick={() => {
                rememberSelection()
                setPaletteOpen(null)
                setTableOpen(current => !current)
              }}
            >
              ⊞ Table
            </ToolbarButton>
            <TablePopover
              open={tableOpen}
              onClose={() => setTableOpen(false)}
              onPick={(rows, columns) => {
                if (!editorRef.current) return
                insertHtmlAtSelection(editorRef.current, savedRangeRef.current, createTableHtml(rows, columns))
                syncFromEditor()
              }}
            />
          </div>
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          data-empty={isEmpty ? 'true' : 'false'}
          className={joinClasses(
            'quiz-rich-editor theme-text w-full px-4 py-3 text-sm leading-relaxed outline-none',
            minHeightClass,
          )}
          onFocus={rememberSelection}
          onClick={rememberSelection}
          onKeyUp={rememberSelection}
          onInput={() => {
            setPaletteOpen(null)
            setTableOpen(false)
            syncFromEditor()
          }}
          onPaste={event => {
            const html = event.clipboardData.getData('text/html')
            if (html && editorRef.current) {
              event.preventDefault()
              insertHtmlAtSelection(editorRef.current, savedRangeRef.current, ensureRichTextHtml(html))
              loadKaTeXAssets().then(() => renderMathInElement(editorRef.current))
              syncFromEditor()
            }
          }}
        />
      </div>

      <MathModal
        open={mathOpen}
        onClose={() => setMathOpen(false)}
        onInsert={latex => {
          if (!editorRef.current) return
          insertHtmlAtSelection(editorRef.current, savedRangeRef.current, createMathNodeHtml(latex))
          loadKaTeXAssets().then(() => renderMathInElement(editorRef.current))
          syncFromEditor()
        }}
      />
    </>
  )
}
