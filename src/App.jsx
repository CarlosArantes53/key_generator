import { useState } from 'react'
import Header from './components/Header'
import GeneratorCard from './components/GeneratorCard'
import OutputCard from './components/OutputCard'
import EntropyMeter from './components/EntropyMeter'
import EntropyTable from './components/EntropyTable'
import GitCompare from './components/GitCompare'
import Footer from './components/Footer'

export default function App() {
  const [activeTool, setActiveTool] = useState('keygen')
  const [results, setResults] = useState([])

  return (
    <div className={`app-shell ${activeTool === 'gitcompare' ? 'is-wide' : ''}`}>
      <Header activeTool={activeTool} onSelectTool={setActiveTool} />

      {activeTool === 'keygen' ? (
        <main className="wrap">
          <GeneratorCard onResults={setResults} />
          <OutputCard results={results} />
          <EntropyMeter />
          <EntropyTable />
        </main>
      ) : (
        <main className="wrap wrap-wide">
          <GitCompare />
        </main>
      )}

      <Footer activeTool={activeTool} />
    </div>
  )
}
