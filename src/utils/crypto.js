import { LOWER, UPPER, DIGITS, SYMBOLS } from './constants'

export function secureRand(charset, length) {
  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  return Array.from(arr, v => charset[v % charset.length]).join('')
}

export function generatePassword(length, lower, upper, digits, symbols) {
  let charset = ''
  const required = []
  if (lower) { charset += LOWER; required.push(secureRand(LOWER, 1)) }
  if (upper) { charset += UPPER; required.push(secureRand(UPPER, 1)) }
  if (digits) { charset += DIGITS; required.push(secureRand(DIGITS, 1)) }
  if (symbols) { charset += SYMBOLS; required.push(secureRand(SYMBOLS, 1)) }
  if (!charset) charset = LOWER + DIGITS

  const rest = secureRand(charset, Math.max(0, length - required.length))
  const raw = required.join('') + rest

  const a = raw.split('')
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.join('')
}
