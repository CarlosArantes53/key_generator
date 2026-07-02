import { estimateEntropy, entropyLevel } from '../utils/entropy'
import { useClipboard } from '../hooks/useClipboard'

export default function OutputRow({ text, delay = 0 }) {
  const { copied, copy } = useClipboard()
  const ent = estimateEntropy(text)
  const info = entropyLevel(ent)
  const badgeLabel = `${ent} bits · ${info.label.split(' ').slice(1).join(' ')}`

  return (
    <div className="pw-row" style={{ animationDelay: `${delay}ms` }}>
      <span className="pw-text">{text}</span>
      <span className={`entropy-badge ${info.cls}`}>{badgeLabel}</span>
      <button className={`copy-btn ${copied ? 'copied' : ''}`} title="Copiar" onClick={() => copy(text)}>
        {copied ? '✓' : '⧉'}
      </button>
    </div>
  )
}
