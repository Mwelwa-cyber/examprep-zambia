/**
 * src/editor/components/modals/TableModal.jsx
 */

import { useState } from 'react'

export default function TableModal({ editor, onClose }) {
  const [hover, setHover] = useState([0, 0])

  const doInsert = (rows, cols) => {
    if (!editor) return
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
    onClose()
  }

  return (
    <div
      className="overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal" style={{ width: 340 }} role="dialog" aria-modal="true"
        aria-label="Insert table">
        <div className="mhd">
          <span className="mtitle">⊞ Insert Table</span>
          <button className="mx" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="mbd">
          <p style={{ fontSize: '13px', color: 'var(--sl5)', marginBottom: '12px' }}>
            Hover to choose dimensions. First row is a header row.
          </p>
          <div className="tpgrid">
            {Array.from({ length: 6 }, (_, r) =>
              Array.from({ length: 8 }, (_, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`tpcell${r < hover[0] && c < hover[1] ? ' hi' : ''}`}
                  onMouseEnter={() => setHover([r + 1, c + 1])}
                  onClick={() => doInsert(hover[0], hover[1])}
                />
              ))
            )}
          </div>
          <div className="tpsize">
            {hover[0] > 0
              ? `${hover[0]} rows × ${hover[1]} columns`
              : 'Hover to select size'}
          </div>
        </div>
        <div className="mft">
          <button type="button" className="btn btn-s" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn-p"
            disabled={hover[0] === 0}
            onClick={() => hover[0] > 0 && doInsert(hover[0], hover[1])}
          >
            Insert Table
          </button>
        </div>
      </div>
    </div>
  )
}
