import { useState } from 'react'
import { charsetSize, estimateEntropy, entropyLevel, BAR_COLORS } from '../utils/entropy'

export default function EntropyMeter() {
  const [pw, setPw] = useState('')
  const [checked, setChecked] = useState('')

  const check = () => { if (pw) setChecked(pw) }
  const onKeyDown = e => { if (e.key === 'Enter') check() }

  const visible = checked.length > 0
  const ent = visible ? estimateEntropy(checked) : 0
  const info = visible ? entropyLevel(ent) : null
  const pct = visible ? Math.min(100, info.pct) : 0
  const cs = visible ? charsetSize(checked) : 0

  return (
    <div className="card meter-card">
      <div className="section-title">// verificar entropia de uma senha</div>
      <div className="meter-input-row">
        <input
          className="meter-input"
          type="text"
          placeholder="Digite ou cole uma senha..."
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button className="btn-check" onClick={check}>ANALISAR</button>
      </div>

      <div className={`meter-result ${visible ? 'visible' : ''}`}>
        <div className="entropy-bar-wrap">
          <div
            className="entropy-bar"
            style={{ width: `${pct}%`, background: visible ? BAR_COLORS[info.cls] : undefined }}
          />
        </div>
        <div className="meter-stats">
          <span>Entropia: <strong>{visible ? ent : '—'}</strong> bits</span>
          <span>Charset: <strong>{visible ? cs : '—'}</strong></span>
          <span>Tamanho: <strong>{visible ? checked.length : '—'}</strong></span>
        </div>
        {visible && (
          <div className={`strength-label entropy-badge ${info.cls}`}>{info.label}</div>
        )}
      </div>
    </div>
  )
}
