import { useEffect, useRef } from 'react'
import OutputRow from './OutputRow'
import { useClipboard } from '../hooks/useClipboard'

export default function OutputCard({ results }) {
  const cardRef = useRef(null)
  const { copied, copy } = useClipboard(1800)

  useEffect(() => {
    if (results.length > 0) {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [results])

  if (results.length === 0) return null

  const copyAll = () => copy(results.join('\n'))

  return (
    <div className="card" ref={cardRef}>
      <div className="section-title">// resultado</div>
      <div className="output-area">
        {results.map((text, i) => (
          <OutputRow key={`${text}-${i}`} text={text} delay={i * 60} />
        ))}
      </div>
      <button
        className="btn-gen"
        style={{ marginTop: '1rem', background: 'linear-gradient(135deg,#1e2330,#2a3040)', color: 'var(--text)', border: '1px solid var(--border)' }}
        onClick={copyAll}
      >
        {copied ? '✓ COPIADO!' : '📋 COPIAR TODOS'}
      </button>
    </div>
  )
}
