import { useState } from 'react'
import { generatePassword } from '../utils/crypto'

/**
 * @param {'password'|'env'} mode
 */
export function usePasswordGenerator(mode) {
  const [results, setResults] = useState([])

  const generate = (options) => {
    const items = []

    if (mode === 'password') {
      const { length, lower, upper, digits, symbols, count } = options
      for (let i = 0; i < count; i++) {
        items.push(generatePassword(length, lower, upper, digits, symbols))
      }
    } else {
      const { prefix, length, format, count } = options
      const cleanPrefix = (prefix || 'SECRET').toUpperCase().replace(/[^A-Z0-9_]/g, '_')
      for (let i = 0; i < count; i++) {
        const key = count > 1 ? `${cleanPrefix}_${i + 1}` : cleanPrefix
        const val = generatePassword(length, true, true, true, false)
        let line
        if (format === 'bash') line = `export ${key}="${val}"`
        else if (format === 'dotenv') line = `${key}=${val}`
        else line = `--env ${key}="${val}"`
        items.push(line)
      }
    }

    setResults(items)
  }

  const clear = () => setResults([])

  return { results, generate, clear }
}
