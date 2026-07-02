import { ENV_FORMATS } from '../utils/constants'

const COUNT_OPTIONS = [1, 3, 5]

export default function EnvPanel({ active, options, onChange }) {
  const { prefix, length, format, count } = options

  return (
    <div id="tab-env" className={`panel ${active ? 'active' : ''}`}>
      <div className="field">
        <label>Prefixo da variável (ex: DB_PASSWORD)</label>
        <div className="env-field">
          <input
            type="text"
            placeholder="MY_SECRET_KEY"
            value={prefix}
            onChange={e => onChange({ ...options, prefix: e.target.value })}
          />
        </div>
      </div>

      <div className="field">
        <label>Comprimento do valor: <span>{length}</span></label>
        <input
          type="range"
          min="16"
          max="128"
          value={length}
          onChange={e => onChange({ ...options, length: parseInt(e.target.value) })}
        />
      </div>

      <div className="field">
        <label>Formato de saída:</label>
        <div className="count-btns">
          {ENV_FORMATS.map(f => (
            <button
              key={f.value}
              className={`count-btn ${format === f.value ? 'active' : ''}`}
              onClick={() => onChange({ ...options, format: f.value })}
            >
              {f.label}
            </button>
          ))}
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
