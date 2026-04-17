export default function AnswerOptions({ options, correct, onChange, onCorrect, isTF }) {
  const LETTERS = 'ABCDE'

  if (isTF) {
    return (
      <div className="alist">
        {['True', 'False'].map((opt, i) => (
          <div key={i} className={`arow${correct === i ? ' correct' : ''}`}>
            <input
              type="radio"
              name="qe-answer-tf"
              checked={correct === i}
              onChange={() => onCorrect(i)}
              aria-label={`Mark ${opt} as correct`}
            />
            <div className="altr">{opt[0]}</div>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{opt}</span>
          </div>
        ))}
        <p style={{ fontSize: '11px', color: 'var(--sl4)', marginTop: '4px' }}>
          ● Click the radio button to mark the correct answer
        </p>
      </div>
    )
  }

  const updateOption = (i, value) => {
    const next = [...options]
    next[i] = value
    onChange(next)
  }

  const removeOption = (i) => {
    const next = options.filter((_, idx) => idx !== i)
    onChange(next)
    if (correct >= next.length) onCorrect(0)
  }

  return (
    <div className="alist">
      {options.map((opt, i) => (
        <div key={i} className={`arow${correct === i ? ' correct' : ''}`}>
          <input
            type="radio"
            name="qe-answer-mcq"
            checked={correct === i}
            onChange={() => onCorrect(i)}
            title="Mark as correct answer"
            aria-label={`Mark option ${LETTERS[i]} as correct`}
          />
          <div className="altr">{LETTERS[i]}</div>
          <input
            className="qe-inp"
            value={opt}
            placeholder={`Option ${LETTERS[i]}`}
            onChange={(e) => updateOption(i, e.target.value)}
          />
          {options.length > 2 && (
            <button
              type="button"
              className="tbb tbd"
              onClick={() => removeOption(i)}
              title={`Remove option ${LETTERS[i]}`}
              aria-label={`Remove option ${LETTERS[i]}`}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      {options.length < 5 && (
        <button
          type="button"
          className="addopt"
          onClick={() => onChange([...options, ''])}
        >
          + Add option
        </button>
      )}
      <p style={{ fontSize: '11px', color: 'var(--sl4)', marginTop: '4px' }}>
        ● Click a radio button to mark the correct answer
      </p>
    </div>
  )
}
