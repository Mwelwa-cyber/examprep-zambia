import { useState, useEffect, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { buildExtensions } from '../extensions/buildExtensions.js'
import { migrateContent } from '../utils/migration.js'
import { sanitizePastedHTML } from '../utils/sanitize.js'
import EditorToolbar from './EditorToolbar.jsx'
import MathModal from './modals/MathModal.jsx'
import TableModal from './modals/TableModal.jsx'

export default function RichEditor({
  label,
  badge,
  badgeCls = 'bopt',
  initialContent = null,
  onChange,
  placeholder = 'Type here…',
  minHeight = 85,
  readOnly = false,
}) {
  const [showMath,  setShowMath]  = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [mathEdit,  setMathEdit]  = useState(null)

  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  const migratedContent = useRef(migrateContent(initialContent))

  const editor = useEditor({
    extensions: buildExtensions({ placeholder, readOnly }),
    content: migratedContent.current ?? '<p></p>',
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'editor-area',
        'data-placeholder': placeholder,
      },
      transformPastedHTML: sanitizePastedHTML,
    },
    onUpdate({ editor: ed }) {
      onChangeRef.current?.(ed.getJSON())
    },
  })

  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom
    const handleMathClick = (e) => {
      setMathEdit({ latex: e.detail.latex, pos: e.detail.pos })
      setShowMath(true)
    }
    dom.addEventListener('tiptap-math-click', handleMathClick)
    return () => dom.removeEventListener('tiptap-math-click', handleMathClick)
  }, [editor])

  const handleOpenMath  = useCallback(() => { setMathEdit(null); setShowMath(true) }, [])
  const handleOpenTable = useCallback(() => setShowTable(true), [])
  const handleCloseMath = useCallback(() => { setShowMath(false); setMathEdit(null) }, [])

  return (
    <div className="qe-field">
      {label && (
        <label className="qe-lbl">
          {label}
          {badge && (
            <span className={`cbadge ${badgeCls}`} style={{ marginLeft: 6, verticalAlign: 'middle' }}>
              {badge}
            </span>
          )}
        </label>
      )}

      <div className="re-wrap">
        {!readOnly && (
          <EditorToolbar
            editor={editor}
            onMath={handleOpenMath}
            onTable={handleOpenTable}
          />
        )}
        <EditorContent
          editor={editor}
          style={{ minHeight }}
        />
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
