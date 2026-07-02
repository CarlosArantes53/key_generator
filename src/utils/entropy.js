export function charsetSize(pw) {
  let n = 0
  if (/[a-z]/.test(pw)) n += 26
  if (/[A-Z]/.test(pw)) n += 26
  if (/[0-9]/.test(pw)) n += 10
  if (/[^a-zA-Z0-9]/.test(pw)) n += 32
  return n
}

export function estimateEntropy(pw) {
  const n = charsetSize(pw)
  return n > 0 ? +(pw.length * Math.log2(n)).toFixed(1) : 0
}

export const BAR_COLORS = {
  'lvl-very-weak': '#ff4d6d',
  'lvl-weak': '#ffb703',
  'lvl-moderate': '#fdd024',
  'lvl-strong': '#06d6a0',
  'lvl-very-strong': '#0af',
  'lvl-excellent': '#b5e48c',
}

export function entropyLevel(bits) {
  if (bits < 28) return { label: '🟥 Muito Fraca', cls: 'lvl-very-weak', pct: bits / 28 * 12 }
  if (bits < 36) return { label: '🟧 Fraca', cls: 'lvl-weak', pct: 12 + (bits - 28) / 8 * 12 }
  if (bits < 60) return { label: '🟨 Moderada', cls: 'lvl-moderate', pct: 24 + (bits - 36) / 24 * 22 }
  if (bits < 80) return { label: '🟩 Forte', cls: 'lvl-strong', pct: 46 + (bits - 60) / 20 * 20 }
  if (bits < 100) return { label: '🟦 Muito Forte', cls: 'lvl-very-strong', pct: 66 + (bits - 80) / 20 * 20 }
  return { label: '🟪 Excelente', cls: 'lvl-excellent', pct: Math.min(100, 86 + (bits - 100) / 50 * 14) }
}
