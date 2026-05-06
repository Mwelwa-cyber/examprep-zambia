// src/features/notes/components/NoteEditor.jsx
//
// Rich-text editor for note content. Uses @tiptap/react directly with
// the same extension factory the quiz editor uses, so notes look and
// behave like other rich-text in the app (math, tables, etc.).
//
// Stores HTML strings in Firestore (matches the firestore.rules
// `content` validator: string, max 200KB). The editor's getHTML()
// is the single conversion point.
//
// Inline image insertion is intentionally NOT wired here yet — that's
// a Phase 3 concern.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import EditorToolbar from '../../../editor/components/EditorToolbar'
import MathModal from '../../../editor/components/modals/MathModal'
import TableModal from '../../../editor/components/modals/TableModal'
import { buildExtensions } from '../../../editor/extensions/buildExtensions'
import { sanitizePastedHTML } from '../../../editor/utils/sanitize'
import 'katex/dist/katex.min.css'
import '../../../editor/editor.css'

export function NoteEditor({ value, onChange, placeholder = 'Start typing your note…' }) {
  const [showMath,  setShowMath]  = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [mathEdit,  setMathEdit]  = useState(null)

  // Stable onChange ref so the editor isn't re-created on parent re-renders.
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  // Memoise the initial value so subsequent parent re-renders don't reset
  // the editor mid-edit. Tiptap accepts HTML strings as `content`.
  const initialContentRef = useRef(value ?? '')

  const editor = useEditor({
    extensions: buildExtensions({ placeholder, readOnly: false }),
    content: initialContentRef.current || '<p></p>',
    editorProps: {
      attributes: {
        class: 'editor-area prose-note',
        'data-placeholder': placeholder,
      },
      transformPastedHTML: sanitizePastedHTML,
    },
    onUpdate({ editor: ed }) {
      onChangeRef.current?.(ed.getHTML())
    },
  })

  // Math node click-to-edit — same wiring RichEditor uses.
  useEffect(() => {
    if (!editor?.isInitialized) return
    const dom = editor.view.dom
    const handleMathClick = (e) => {
      setMathEdit({ latex: e.detail.latex, pos: e.detail.pos })
      setShowMath(true)
    }
    dom.addEventListener('tiptap-math-click', handleMathClick)
    return () => dom.removeEventListener('tiptap-math-click', handleMathClick)
  }, [editor, editor?.isInitialized])

  // Late-arriving content (e.g. async note load): push it in only if the
  // editor is currently empty so we don't fight the user's typing.
  useEffect(() => {
    if (!editor) return
    if (editor.isEmpty && value && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [editor, value])

  const handleOpenMath  = useCallback(() => { setMathEdit(null); setShowMath(true) }, [])
  const handleOpenTable = useCallback(() => setShowTable(true), [])
  const handleCloseMath = useCallback(() => { setShowMath(false); setMathEdit(null) }, [])

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="re-wrap">
        <EditorToolbar
          editor={editor}
          onMath={handleOpenMath}
          onTable={handleOpenTable}
        />
        <EditorContent editor={editor} style={{ minHeight: 400 }} />
      </div>

      {showMath && (
        <MathModal
          editor={editor}
          editState={mathEdit}
          onClose={handleCloseMath}
        />
      )}
      {showTable && (
        <TableModal
          editor={editor}
          onClose={() => setShowTable(false)}
        />
      )}
    </div>
  )
}
