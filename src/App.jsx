import { useState } from 'react'
import Header from './components/Header'
import GeneratorCard from './components/GeneratorCard'
import OutputCard from './components/OutputCard'
import EntropyMeter from './components/EntropyMeter'
import EntropyTable from './components/EntropyTable'
import Footer from './components/Footer'

export default function App() {
  const [results, setResults] = useState([])

  return (
    <div className="wrap">
      <Header />
      <GeneratorCard onResults={setResults} />
      <OutputCard results={results} />
      <EntropyMeter />
      <EntropyTable />
      <Footer />
    </div>
  )
}
