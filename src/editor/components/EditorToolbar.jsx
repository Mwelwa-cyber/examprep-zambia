import { useState } from 'react'

const TX_COLORS = [
  '#1a1523', '#1e3a8a', '#dc2626', '#ea580c', '#ca8a04',
  '#15803d', '#2563eb', '#7c3aed', '#be185d', '#64748b',
]
const HL_COLORS = [
  '#fef08a', '#bbf7d0', '#bfdbfe', '#ddd6fe',
  '#fce7f3', '#fee2e2', '#fed7aa', '#e0f2fe',
]

function TBtn({ editor, cmd, args, title, active, children, extraClass = '', onMouseDown }) {
  const isActive = active !== undefined
    ? active
    : (cmd ? (() => { try { return editor.isActive(cmd, args) } catch { return false } })() : false)

  const handleMouseDown = (e) => {
    e.preventDefault()
    if (onMouseDown) { onMouseDown(e); return }
    if (cmd) editor.chain().focus()[cmd](args ?? undefined).run()
  }

  return (
    <button
      type="button"
      className={`tbb${isActive ? ' on' : ''}${extraClass ? ' ' + extraClass : ''}`}
      title={title}
      onMouseDown={handleMouseDown}
      aria-pressed={isActive}
    >
      {children}
    </button>
  )
}

export default function EditorToolbar({ editor, onMath, onTable }) {
  const [showTxColor, setShowTxColor] = useState(false)
  const [showHlColor, setShowHlColor] = useState(false)

  if (!editor) return <div className="toolbar" />

  const inTable = (() => { try { return editor.isActive('table') } catch { return false } })()
  const run = (cmd) => (...args) => editor.chain().focus()[cmd](...args).run()

  return (
    <>
      <div className="toolbar">
        <TBtn editor={editor} title="Undo (Ctrl+Z)"
          onMouseDown={(e) => { e.preventDefault(); run('undo')() }}>↩</TBtn>
        <TBtn editor={editor} title="Redo (Ctrl+Y)"
          onMouseDown={(e) => { e.preventDefault(); run('redo')() }}>↪</TBtn>
        <div className="tbsep" />

        <TBtn editor={editor} cmd="toggleBold"      title="Bold (Ctrl+B)">
          <b style={{ fontWeight: 900, fontSize: '13px' }}>B</b>
        </TBtn>
        <TBtn editor={editor} cmd="toggleItalic"    title="Italic (Ctrl+I)">
          <i style={{ fontSize: '13px' }}>I</i>
        </TBtn>
        <TBtn editor={editor} cmd="toggleUnderline" title="Underline (Ctrl+U)"><u>U</u></TBtn>
        <TBtn editor={editor} cmd="toggleStrike"    title="Strikethrough"><s>S</s></TBtn>
        <div className="tbsep" />

        <TBtn editor={editor} cmd="toggleSuperscript" title="Superscript">x²</TBtn>
        <TBtn editor={editor} cmd="toggleSubscript"   title="Subscript">x₂</TBtn>
        <div className="tbsep" />

        <TBtn editor={editor} cmd="toggleBulletList"  title="Bullet list">• ≡</TBtn>
        <TBtn editor={editor} cmd="toggleOrderedList" title="Numbered list">1.≡</TBtn>
        <div className="tbsep" />

        <TBtn editor={editor} cmd="setTextAlign" args="left"
          active={(() => { try { return editor.isActive({ textAlign: 'left' }) } catch { return false } })()}
          title="Align left">⬅≡</TBtn>
        <TBtn editor={editor} cmd="setTextAlign" args="center"
          active={(() => { try { return editor.isActive({ textAlign: 'center' }) } catch { return false } })()}
          title="Centre">≡</TBtn>
        <TBtn editor={editor} cmd="setTextAlign" args="right"
          active={(() => { try { return editor.isActive({ textAlign: 'right' }) } catch { return false } })()}
          title="Align right">≡➡</TBtn>
        <div className="tbsep" />

        <TBtn editor={editor} cmd="toggleHeading" args={{ level: 1 }} title="Heading 1">H1</TBtn>
        <TBtn editor={editor} cmd="toggleHeading" args={{ level: 2 }} title="Heading 2">H2</TBtn>
        <div className="tbsep" />

        <div className="crel">
          <button
            type="button" className="tbb" title="Text colour"
            onMouseDown={(e) => { e.preventDefault(); setShowHlColor(false); setShowTxColor((v) => !v) }}
          >
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <span style={{ fontWeight: 900, fontSize: '12px', lineHeight: 1 }}>A</span>
              <span style={{ width: '13px', height: '3px', background: '#dc2626', borderRadius: '2px' }} />
            </span>
          </button>
          {showTxColor && (
            <div className="cpop">
              {TX_COLORS.map((c) => (
                <div
                  key={c} className="sw" style={{ background: c }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    editor.chain().focus().setColor(c).run()
                    setShowTxColor(false)
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="crel">
          <button
            type="button" className="tbb" title="Highlight"
            onMouseDown={(e) => { e.preventDefault(); setShowTxColor(false); setShowHlColor((v) => !v) }}
          >
            🖌
          </button>
          {showHlColor && (
            <div className="cpop" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {HL_COLORS.map((c) => (
                <div
                  key={c} className="sw" style={{ background: c }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    editor.chain().focus().toggleHighlight({ color: c }).run()
                    setShowHlColor(false)
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="tbsep" />

        <button
          type="button" className="tbb tbm" title="Insert Math (∑)"
          onMouseDown={(e) => { e.preventDefault(); onMath() }}
        >
          ∑ Math
        </button>
        <button
          type="button" className="tbb tbt" title="Insert Table"
          onMouseDown={(e) => { e.preventDefault(); onTable() }}
        >
          ⊞ Table
        </button>
      </div>

      {inTable && (
        <div className="tblstrip">
          <span className="tblslbl">Table:</span>
          <button type="button" className="tbb"
            onMouseDown={(e) => { e.preventDefault(); run('addRowBefore')() }} title="Add row before">
            +Row↑
          </button>
          <button type="button" className="tbb"
            onMouseDown={(e) => { e.preventDefault(); run('addRowAfter')() }} title="Add row after">
            +Row↓
          </button>
          <button type="button" className="tbb tbd"
            onMouseDown={(e) => { e.preventDefault(); run('deleteRow')() }} title="Delete row">
            −Row
          </button>
          <div className="tbsep" />
          <button type="button" className="tbb"
            onMouseDown={(e) => { e.preventDefault(); run('addColumnBefore')() }} title="Add column before">
            +Col←
          </button>
          <button type="button" className="tbb"
            onMouseDown={(e) => { e.preventDefault(); run('addColumnAfter')() }} title="Add column after">
            +Col→
          </button>
          <button type="button" className="tbb tbd"
            onMouseDown={(e) => { e.preventDefault(); run('deleteColumn')() }} title="Delete column">
            −Col
          </button>
          <div className="tbsep" />
          <button type="button" className="tbb"
            onMouseDown={(e) => { e.preventDefault(); run('mergeCells')() }} title="Merge selected cells">
            ⊞Merge
          </button>
          <button type="button" className="tbb"
            onMouseDown={(e) => { e.preventDefault(); run('splitCell')() }} title="Split merged cell">
            ⊡Split
          </button>
          <button type="button" className="tbb"
            onMouseDown={(e) => { e.preventDefault(); run('toggleHeaderRow')() }} title="Toggle header row">
            Header
          </button>
          <div className="tbsep" />
          <button type="button" className="tbb tbd"
            onMouseDown={(e) => { e.preventDefault(); run('deleteTable')() }} title="Delete this table">
            ✕ Table
          </button>
        </div>
      )}
    </>
  )
}
