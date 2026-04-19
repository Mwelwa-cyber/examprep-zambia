/**
 * src/editor/components/modals/MathModal.jsx
 *
 * Math insert / edit modal.
 * Identical visual design to the working demo.
 * All state is local — no external dependencies beyond the editor ref.
 *
 * Props:
 *   editor      {object|null}    The Tiptap editor instance
 *   editState   {object|null}    { latex: string, pos: number|null } for editing;
 *                                null for inserting new math
 *   onClose     {function}       Close the modal
 */

import { useState, useEffect } from 'react'
import katex from 'katex'

const SYMBOLS = [
  {s:"−",l:"-"},{s:"+",l:"+"},{s:"×",l:"\\times"},{s:"÷",l:"\\div"},
  {s:"=",l:"="},{s:"≠",l:"\\neq"},{s:"<",l:"<"},{s:">",l:">"},
  {s:"≤",l:"\\leq"},{s:"≥",l:"\\geq"},{s:"±",l:"\\pm"},{s:"π",l:"\\pi"},
  {s:"θ",l:"\\theta"},{s:"°",l:"^{\\circ}"},{s:"√",l:"\\sqrt{}"},
  {s:"∞",l:"\\infty"},{s:"∑",l:"\\sum"},{s:"∫",l:"\\int"},
  {s:"α",l:"\\alpha"},{s:"β",l:"\\beta"},{s:"γ",l:"\\gamma"},
  {s:"λ",l:"\\lambda"},{s:"σ",l:"\\sigma"},{s:"μ",l:"\\mu"},
]

const TEMPLATES = [
  {label:"Fraction",  latex:"\\frac{a}{b}",          preview:"a⁄b"},
  {label:"xⁿ Power",  latex:"x^{n}",                 preview:"xⁿ"},
  {label:"√ Root",    latex:"\\sqrt{x}",              preview:"√x"},
  {label:"ⁿ√ Root",   latex:"\\sqrt[n]{x}",          preview:"ⁿ√x"},
  {label:"x²",        latex:"x^{2}",                  preview:"x²"},
  {label:"x³",        latex:"x^{3}",                  preview:"x³"},
  {label:"½",         latex:"\\frac{1}{2}",           preview:"½"},
  {label:"¾",         latex:"\\frac{3}{4}",           preview:"¾"},
  {label:"Subscript", latex:"x_{n}",                  preview:"xₙ"},
  {label:"Quadratic", latex:"ax^{2}+bx+c=0",         preview:"ax²…"},
  {label:"%",         latex:"\\frac{x}{100}\\times n",preview:"%"},
  {label:"Log",       latex:"\\log_{b}(x)",           preview:"logb"},
]

export default function MathModal({ editor, editState, onClose }) {
  const isEditing = editState !== null && editState !== undefined

  const [latex,    setLatex]    = useState(isEditing ? editState.latex : TEMPLATES[0].latex)
  const [selTpl,   setSelTpl]   = useState(isEditing ? -1 : 0)
  const [prevHTML, setPrevHTML] = useState('')
  const [prevErr,  setPrevErr]  = useState(false)

  // Re-render KaTeX preview whenever latex changes
  useEffect(() => {
    try {
      const html = katex.renderToString(latex, { throwOnError: true, displayMode: true })
      setPrevHTML(html)
      setPrevErr(false)
    } catch {
      setPrevErr(true)
      setPrevHTML('')
    }
  }, [latex])

  const handleSave = () => {
    if (prevErr || !latex.trim() || !editor) return

    if (isEditing && editState.pos !== null) {
      // UPDATE: modify the existing node via ProseMirror transaction.
      // This is tracked by History — undo/redo works correctly.
      const { state, view } = editor
      const tr = state.tr
      tr.setNodeMarkup(editState.pos, undefined, { latex })
      view.dispatch(tr)
    } else {
      // INSERT: use our custom Tiptap command.
      editor.chain().focus().insertMathNode(latex).run()
    }
    onClose()
  }

  const handleDelete = () => {
    if (!editor || !isEditing || editState.pos === null) return
    const { state, view } = editor
    const node = state.doc.nodeAt(editState.pos)
    if (node) {
      const tr = state.tr
      tr.delete(editState.pos, editState.pos + node.nodeSize)
      view.dispatch(tr)
    }
    onClose()
  }

  return (
    <div
      className="overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal" role="dialog" aria-modal="true"
        aria-label={isEditing ? 'Edit math expression' : 'Insert math expression'}>
        <div className="mhd">
          <span className="mtitle">{isEditing ? '✏️ Edit Math' : '∑ Insert Math'}</span>
          <button className="mx" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="mbd">
          {/* Template grid */}
          <div className="mlbl">Quick Templates</div>
          <div className="tgrid">
            {TEMPLATES.map((t, i) => (
              <div
                key={i}
                className={`tc${selTpl === i ? ' sel' : ''}`}
                onClick={() => { setSelTpl(i); setLatex(t.latex) }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && (setSelTpl(i), setLatex(t.latex))}
              >
                <div className="tp">{t.preview}</div>
                <div className="tl">{t.label}</div>
              </div>
            ))}
          </div>

          {/* Symbol palette */}
          <div className="mlbl">Symbols — click to append</div>
          <div className="sgrid">
            {SYMBOLS.map((s, i) => (
              <button
                key={i}
                type="button"
                className="sbtn"
                title={s.l}
                onMouseDown={(e) => {
                  e.preventDefault()  // prevent focus loss from editor
                  setLatex((prev) => prev + s.l)
                  setSelTpl(-1)
                }}
              >
                {s.s}
              </button>
            ))}
          </div>

          {/* LaTeX input */}
          <div className="mlbl">LaTeX Expression</div>
          <input
            type="text"
            className="qe-inp"
            value={latex}
            style={{ fontFamily: 'monospace', fontSize: '12.5px', marginBottom: '12px' }}
            spellCheck={false}
            placeholder="\frac{a}{b} · x^{2} · \sqrt{x}"
            onChange={(e) => { setLatex(e.target.value); setSelTpl(-1) }}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus={isEditing}
          />

          {/* Live preview */}
          <div className="mlbl">Live Preview</div>
          <div className="kprev">
            {prevHTML
              ? <span dangerouslySetInnerHTML={{ __html: prevHTML }} />
              : <span style={{ color: 'var(--ro)', fontSize: '13px' }}>
                  {prevErr ? 'Invalid LaTeX — check syntax' : '…'}
                </span>
            }
          </div>
        </div>

        <div className="mft">
          {isEditing && (
            <button type="button" className="btn btn-d" onClick={handleDelete}>
              Delete
            </button>
          )}
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-p"
            onClick={handleSave}
            disabled={prevErr || !latex.trim()}
          >
            {isEditing ? 'Update Math' : 'Insert Math'}
          </button>
        </div>
      </div>
    </div>
  )
}
