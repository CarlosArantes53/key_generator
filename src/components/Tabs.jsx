const TABS = [
  { id: 'password', label: '🔑 Senha' },
  { id: 'env', label: '⚙️ Script / ENV' },
]

export default function Tabs({ active, onChange }) {
  return (
    <div className="tabs">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`tab ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
