import { useState, useEffect, useRef } from 'react'
import { toHTML, hydrateKatex }  from './utils/safeRender.js'
import { migrateContent }         from './utils/migration.js'
import './editor.css'

const LETTERS = 'ABCDE'

function SafeHTML({ content, className = '' }) {
  const ref  = useRef(null)
  const html = toHTML(content)

  useEffect(() => {
    if (ref.current) hydrateKatex(ref.current)
  }, [html])

  if (!html) return null
  return (
    <div
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default function QuizViewer({
  question,
  selected: controlledSelected,
  onSelect,
  onSubmit,
  showExplanation: forceExplanation = false,
  readOnly = false,
  className = '',
}) {
  const q = {
    ...question,
    instructions: migrateContent(question.instructions),
    passage:       migrateContent(question.passage),
    questionText:  migrateContent(question.questionText),
    explanation:   migrateContent(question.explanation),
  }

  const [internalSelected, setInternalSelected] = useState(null)
  const [submitted,         setSubmitted]        = useState(false)
  const [showExplanation,   setShowExplanation]  = useState(forceExplanation)

  const isControlled  = controlledSelected !== undefined
  const selected      = isControlled ? controlledSelected : internalSelected

  const handleSelect = (i) => {
    if (readOnly || submitted) return
    if (isControlled) {
      onSelect?.(i)
    } else {
      setInternalSelected(i)
    }
  }

  const handleSubmit = () => {
    if (selected === null || selected === undefined) return
    setSubmitted(true)
    setShowExplanation(true)
    onSubmit?.({
      selected,
      correct:   q.correct,
      isCorrect: selected === q.correct,
    })
  }

  const handleReset = () => {
    setSubmitted(false)
    setShowExplanation(false)
    if (!isControlled) setInternalSelected(null)
  }

  const isTF      = q.type === 'tf'
  const displayOptions = isTF ? ['True', 'False'] : (q.options ?? [])
  const isAnswerable   = q.type === 'mcq' || q.type === 'tf'

  const getOptClass = (i) => {
    if (!submitted) return selected === i ? 'popt selected' : 'popt'
    if (i === q.correct)  return 'popt correct'
    if (i === selected)   return 'popt wrong'
    return 'popt'
  }

  return (
    <div className={`pcard viewer ${className}`}>
      <div className="pmeta">
        <span className="pmarks">
          {q.marks} Mark{q.marks !== 1 ? 's' : ''}
        </span>
        {q.topic && <span className="ptopic">{q.topic}</span>}
        {q.difficulty && (
          <span style={{ marginLeft: 'auto', fontSize: '10.5px', color: 'var(--sl4)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
            {q.difficulty}
          </span>
        )}
      </div>

      <SafeHTML content={q.instructions} className="pinstr" />
      <SafeHTML content={q.passage} className="ppassage" />
      <SafeHTML content={q.questionText} className="pq" />

      {isAnswerable && (
        <div>
          {displayOptions.map((opt, i) => (
            <div
              key={i}
              className={getOptClass(i)}
              onClick={() => handleSelect(i)}
              role="radio"
              aria-checked={selected === i}
              tabIndex={readOnly || submitted ? -1 : 0}
              onKeyDown={(e) => e.key === 'Enter' && handleSelect(i)}
            >
              <div className="poltr">{LETTERS[i]}</div>
              <div>{opt}</div>
            </div>
          ))}
        </div>
      )}

      {(q.type === 'short' || q.type === 'fill') && (
        <textarea
          className="qe-inp"
          placeholder="Type your answer here…"
          rows={3}
          style={{ resize: 'vertical', marginTop: '8px' }}
          readOnly={readOnly || submitted}
        />
      )}

      {isAnswerable && !submitted && !readOnly && (
        <button
          type="button"
          className="btn btn-p"
          style={{ marginTop: '14px', width: '100%' }}
          onClick={handleSubmit}
          disabled={selected === null || selected === undefined}
        >
          Submit Answer
        </button>
      )}
      {submitted && (
        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '14px', fontWeight: 700,
            color: selected === q.correct ? '#16a34a' : 'var(--ro)',
          }}>
            {selected === q.correct ? '✓ Correct!' : '✗ Incorrect'}
          </span>
          {!readOnly && (
            <button type="button" className="btn btn-s" style={{ marginLeft: 'auto' }}
              onClick={handleReset}>
              Try Again
            </button>
          )}
        </div>
      )}

      {(showExplanation || forceExplanation) && q.explanation && (
        <div className="pexpl" style={{ marginTop: '14px' }}>
          <div className="pexpl-hd">💡 Explanation / Model Answer</div>
          <SafeHTML content={q.explanation} />
        </div>
      )}
    </div>
  )
}
