import { useEffect, useState } from 'react'
import Tabs from './Tabs'
import PasswordPanel from './PasswordPanel'
import EnvPanel from './EnvPanel'
import { usePasswordGenerator } from '../hooks/usePasswordGenerator'

const DEFAULT_PW_OPTIONS = { length: 16, lower: true, upper: true, digits: true, symbols: true, count: 1 }
const DEFAULT_ENV_OPTIONS = { prefix: '', length: 32, format: 'bash', count: 1 }

export default function GeneratorCard({ onResults }) {
  const [activeTab, setActiveTab] = useState('password')
  const [pwOptions, setPwOptions] = useState(DEFAULT_PW_OPTIONS)
  const [envOptions, setEnvOptions] = useState(DEFAULT_ENV_OPTIONS)
  const { results, generate, clear } = usePasswordGenerator(activeTab)

  useEffect(() => { onResults(results) }, [results, onResults])

  const switchTab = (tab) => {
    setActiveTab(tab)
    clear()
  }

  const handleGenerate = () => {
    generate(activeTab === 'password' ? pwOptions : envOptions)
  }

  return (
    <div className="card">
      <div className="section-title">// configurações</div>

      <Tabs active={activeTab} onChange={switchTab} />

      <PasswordPanel active={activeTab === 'password'} options={pwOptions} onChange={setPwOptions} />
      <EnvPanel active={activeTab === 'env'} options={envOptions} onChange={setEnvOptions} />

      <button className="btn-gen" onClick={handleGenerate}>▶ GERAR</button>
    </div>
  )
}
