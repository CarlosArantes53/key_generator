const COUNT_OPTIONS = [1, 3, 5, 10]

export default function PasswordPanel({ active, options, onChange }) {
  const { length, lower, upper, digits, symbols, count } = options

  const toggle = (key) => onChange({ ...options, [key]: !options[key] })

  return (
    <div id="tab-password" className={`panel ${active ? 'active' : ''}`}>
      <div className="field">
        <label>Comprimento: <span>{length}</span></label>
        <input
          type="range"
          min="8"
          max="64"
          value={length}
          onChange={e => onChange({ ...options, length: parseInt(e.target.value) })}
        />
      </div>

      <div className="field">
        <label>Caracteres incluídos:</label>
        <div className="checks">
          <label className="check-label">
            <input type="checkbox" checked={lower} onChange={() => toggle('lower')} />
            <span className="check-box"></span>
            Minúsculas (a-z)
          </label>
          <label className="check-label">
            <input type="checkbox" checked={upper} onChange={() => toggle('upper')} />
            <span className="check-box"></span>
            Maiúsculas (A-Z)
          </label>
          <label className="check-label">
            <input type="checkbox" checked={digits} onChange={() => toggle('digits')} />
            <span className="check-box"></span>
            Números (0-9)
          </label>
          <label className="check-label">
            <input type="checkbox" checked={symbols} onChange={() => toggle('symbols')} />
            <span className="check-box"></span>
            Símbolos (!@#…)
          </label>
        </div>
      </div>

      <div className="field">
        <label>Quantidade:</label>
        <div className="count-btns">
          {COUNT_OPTIONS.map(n => (
            <button
              key={n}
              className={`count-btn ${count === n ? 'active' : ''}`}
              onClick={() => onChange({ ...options, count: n })}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
