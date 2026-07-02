import { useState } from 'react'

export function useClipboard(resetDelay = 1500) {
  const [copied, setCopied] = useState(false)

  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), resetDelay)
    })
  }

  return { copied, copy }
}
