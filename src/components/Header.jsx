const TOOLS = [
  {
    id: 'keygen',
    icon: '🔑',
    name: 'Gerador de Chaves',
    badge: 'CRYPTO · ENV',
    desc: 'Senhas criptográficas, scripts .env e medidor de entropia',
  },
  {
    id: 'gitcompare',
    icon: '🔀',
    name: 'Git Code Compare',
    badge: 'MYERS DIFF',
    desc: 'Comparador de código estilo GitHub (Lado a Lado / Unificado / .patch)',
  },
]

export default function Header({ activeTool, onSelectTool }) {
  return (
    <header className="swiss-header">
      <div className="swiss-badge">🛠️ CANIVETE SUÍÇO DO DEV</div>
      <div className="logo">
        Dev<span>Swiss</span>
      </div>
      <p className="tagline">
        Kit de Ferramentas para Desenvolvedores · Gerador de Chaves &amp; Git Compare
      </p>

      <nav className="swiss-menu" aria-label="Menu de ferramentas">
        {TOOLS.map((tool) => {
          const isActive = activeTool === tool.id
          return (
            <button
              key={tool.id}
              type="button"
              className={`swiss-menu-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTool(tool.id)}
            >
              <div className="swiss-menu-top">
                <span className="swiss-menu-icon">{tool.icon}</span>
                <span className="swiss-menu-title">{tool.name}</span>
                <span className="swiss-menu-tag">{tool.badge}</span>
              </div>
              <p className="swiss-menu-desc">{tool.desc}</p>
            </button>
          )
        })}
      </nav>
    </header>
  )
}
