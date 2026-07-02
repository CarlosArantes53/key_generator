export const LOWER = 'abcdefghijklmnopqrstuvwxyz'
export const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const DIGITS = '0123456789'
export const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?/~`'

export const ENV_FORMATS = [
  { value: 'bash', label: 'bash export' },
  { value: 'dotenv', label: '.env' },
  { value: 'docker', label: 'docker --env' },
]

export const ENTROPY_TABLE = [
  { color: '#ff4d6d', label: 'Muito Fraca', range: '< 28', example: 'Palavras simples — ', code: 'password123' },
  { color: '#ffb703', label: 'Fraca', range: '28 – 35', example: 'Variações curtas — ', code: 'MeuCao2025' },
  { color: '#fdd024', label: 'Moderada', range: '36 – 59', example: 'Adequada para contas descartáveis' },
  { color: '#06d6a0', label: 'Forte', range: '60 – 79', example: 'Padrão NIST/OWASP moderno' },
  { color: '#0af', label: 'Muito Forte', range: '80 – 99', example: 'Excelente proteção para maioria dos casos' },
  { color: '#b5e48c', label: 'Excelente', range: '100+', example: 'Praticamente inquebrável por força bruta' },
]
