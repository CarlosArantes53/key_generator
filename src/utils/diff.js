// Algoritmo de Myers com otimização de prefixo/sufixo e diff de tokens intra-linha

export function myersDiff(a, b, equalsFn = (x, y) => x === y) {
  const n = a.length
  const m = b.length
  if (n === 0 && m === 0) return []
  if (n === 0) return b.map(item => ({ type: 'insert', a: null, b: item }))
  if (m === 0) return a.map(item => ({ type: 'delete', a: item, b: null }))

  const max = n + m
  const v = { 1: 0 }
  const trace = []

  for (let d = 0; d <= max; d++) {
    trace.push({ ...v })
    for (let k = -d; k <= d; k += 2) {
      let x
      const vPrevDown = v[k - 1] === undefined ? -Infinity : v[k - 1]
      const vPrevRight = v[k + 1] === undefined ? -Infinity : v[k + 1]

      if (k === -d || (k !== d && vPrevDown < vPrevRight)) {
        x = vPrevRight
      } else {
        x = vPrevDown + 1
      }
      let y = x - k

      while (x < n && y < m && equalsFn(a[x], b[y])) {
        x++
        y++
      }
      v[k] = x

      if (x >= n && y >= m) {
        const result = []
        let cx = n
        let cy = m
        for (let d_idx = d; d_idx >= 0; d_idx--) {
          const vp = trace[d_idx]
          const kc = cx - cy
          const vpDown = vp[kc - 1] === undefined ? -Infinity : vp[kc - 1]
          const vpRight = vp[kc + 1] === undefined ? -Infinity : vp[kc + 1]

          let pk
          if (kc === -d_idx || (kc !== d_idx && vpDown < vpRight)) {
            pk = kc + 1
          } else {
            pk = kc - 1
          }
          const px = vp[pk] !== undefined ? vp[pk] : 0
          const py = px - pk

          while (cx > px && cy > py) {
            cx--
            cy--
            result.push({ type: 'equal', a: a[cx], b: b[cy] })
          }
          if (d_idx > 0) {
            if (cx === px) {
              cy--
              result.push({ type: 'insert', a: null, b: b[cy] })
            } else if (cy === py) {
              cx--
              result.push({ type: 'delete', a: a[cx], b: null })
            }
          }
        }
        result.reverse()
        return result
      }
    }
  }
  return []
}

export function tokenizeLine(line) {
  if (!line) return []
  const tokens = line.match(/\s+|[a-zA-Z0-9_$]+|[^\s\w]/g)
  return tokens || [line]
}

export function computeFullDiff(origText, modText, options = {}) {
  const { ignoreWhitespace = false, ignoreCase = false } = options
  const cleanOrig = origText ? origText.replace(/\r\n/g, '\n').replace(/\r/g, '\n') : ''
  const cleanMod = modText ? modText.replace(/\r\n/g, '\n').replace(/\r/g, '\n') : ''
  const origLines = cleanOrig.length > 0 ? cleanOrig.split('\n') : []
  const modLines = cleanMod.length > 0 ? cleanMod.split('\n') : []

  const normalize = (line) => {
    let s = line
    if (ignoreWhitespace) s = s.trim().replace(/\s+/g, ' ')
    if (ignoreCase) s = s.toLowerCase()
    return s
  }

  // 1. Common Prefix
  let prefixCount = 0
  while (
    prefixCount < origLines.length &&
    prefixCount < modLines.length &&
    normalize(origLines[prefixCount]) === normalize(modLines[prefixCount])
  ) {
    prefixCount++
  }

  // 2. Common Suffix
  let suffixOrig = origLines.length - 1
  let suffixMod = modLines.length - 1
  while (
    suffixOrig >= prefixCount &&
    suffixMod >= prefixCount &&
    normalize(origLines[suffixOrig]) === normalize(modLines[suffixMod])
  ) {
    suffixOrig--
    suffixMod--
  }

  const midOrig = origLines.slice(prefixCount, suffixOrig + 1)
  const midMod = modLines.slice(prefixCount, suffixMod + 1)

  // 3. Myers diff on middle chunk
  const midDiff = myersDiff(midOrig, midMod, (a, b) => normalize(a) === normalize(b))

  // 4. Assemble final diff array
  const fullDiff = []
  let curOld = 1
  let curNew = 1

  for (let i = 0; i < prefixCount; i++) {
    fullDiff.push({
      type: 'equal',
      oldLine: curOld++,
      newLine: curNew++,
      oldText: origLines[i],
      newText: modLines[i],
    })
  }

  for (const item of midDiff) {
    if (item.type === 'equal') {
      fullDiff.push({
        type: 'equal',
        oldLine: curOld++,
        newLine: curNew++,
        oldText: item.a,
        newText: item.b,
      })
    } else if (item.type === 'delete') {
      fullDiff.push({
        type: 'delete',
        oldLine: curOld++,
        newLine: null,
        oldText: item.a,
        newText: null,
      })
    } else if (item.type === 'insert') {
      fullDiff.push({
        type: 'insert',
        oldLine: null,
        newLine: curNew++,
        oldText: null,
        newText: item.b,
      })
    }
  }

  for (let i = suffixOrig + 1, j = suffixMod + 1; i < origLines.length; i++, j++) {
    fullDiff.push({
      type: 'equal',
      oldLine: curOld++,
      newLine: curNew++,
      oldText: origLines[i],
      newText: modLines[j],
    })
  }

  return fullDiff
}

export function buildSplitRows(diffItems) {
  const rows = []
  let i = 0
  const n = diffItems.length

  while (i < n) {
    if (diffItems[i].type === 'equal') {
      const item = diffItems[i]
      rows.push({
        type: 'equal',
        left: { line: item.oldLine, text: item.oldText, tokens: [{ type: 'equal', text: item.oldText }], type: 'equal' },
        right: { line: item.newLine, text: item.newText, tokens: [{ type: 'equal', text: item.newText }], type: 'equal' },
      })
      i++
    } else {
      const deletes = []
      const inserts = []
      while (i < n && diffItems[i].type !== 'equal') {
        if (diffItems[i].type === 'delete') deletes.push(diffItems[i])
        else if (diffItems[i].type === 'insert') inserts.push(diffItems[i])
        i++
      }

      const count = Math.max(deletes.length, inserts.length)
      for (let k = 0; k < count; k++) {
        const delItem = k < deletes.length ? deletes[k] : null
        const insItem = k < inserts.length ? inserts[k] : null

        if (delItem && insItem) {
          const tokenDiff = myersDiff(tokenizeLine(delItem.oldText), tokenizeLine(insItem.newText))
          const leftTokens = []
          const rightTokens = []

          for (const tok of tokenDiff) {
            if (tok.type === 'equal') {
              leftTokens.push({ type: 'equal', text: tok.a })
              rightTokens.push({ type: 'equal', text: tok.a })
            } else if (tok.type === 'delete') {
              leftTokens.push({ type: 'delete', text: tok.a })
            } else if (tok.type === 'insert') {
              rightTokens.push({ type: 'insert', text: tok.b })
            }
          }

          rows.push({
            type: 'modify',
            left: { line: delItem.oldLine, text: delItem.oldText, tokens: leftTokens, type: 'delete' },
            right: { line: insItem.newLine, text: insItem.newText, tokens: rightTokens, type: 'insert' },
          })
        } else if (delItem) {
          rows.push({
            type: 'delete',
            left: { line: delItem.oldLine, text: delItem.oldText, tokens: [{ type: 'equal', text: delItem.oldText }], type: 'delete' },
            right: { line: null, text: '', tokens: [], type: 'empty' },
          })
        } else if (insItem) {
          rows.push({
            type: 'insert',
            left: { line: null, text: '', tokens: [], type: 'empty' },
            right: { line: insItem.newLine, text: insItem.newText, tokens: [{ type: 'equal', text: insItem.newText }], type: 'insert' },
          })
        }
      }
    }
  }
  return rows
}

export function buildUnifiedRows(diffItems) {
  const rows = []
  let i = 0
  const n = diffItems.length

  while (i < n) {
    if (diffItems[i].type === 'equal') {
      const item = diffItems[i]
      rows.push({
        type: 'equal',
        oldLine: item.oldLine,
        newLine: item.newLine,
        sign: ' ',
        tokens: [{ type: 'equal', text: item.oldText }],
      })
      i++
    } else {
      const deletes = []
      const inserts = []
      while (i < n && diffItems[i].type !== 'equal') {
        if (diffItems[i].type === 'delete') deletes.push(diffItems[i])
        else if (diffItems[i].type === 'insert') inserts.push(diffItems[i])
        i++
      }

      const minCount = Math.min(deletes.length, inserts.length)
      const delTokensList = []
      const insTokensList = []

      for (let k = 0; k < minCount; k++) {
        const tokenDiff = myersDiff(tokenizeLine(deletes[k].oldText), tokenizeLine(inserts[k].newText))
        const leftT = []
        const rightT = []
        for (const tok of tokenDiff) {
          if (tok.type === 'equal') {
            leftT.push({ type: 'equal', text: tok.a })
            rightT.push({ type: 'equal', text: tok.a })
          } else if (tok.type === 'delete') {
            leftT.push({ type: 'delete', text: tok.a })
          } else if (tok.type === 'insert') {
            rightT.push({ type: 'insert', text: tok.b })
          }
        }
        delTokensList.push(leftT)
        insTokensList.push(rightT)
      }

      for (let k = minCount; k < deletes.length; k++) {
        delTokensList.push([{ type: 'equal', text: deletes[k].oldText }])
      }
      for (let k = minCount; k < inserts.length; k++) {
        insTokensList.push([{ type: 'equal', text: inserts[k].newText }])
      }

      for (let k = 0; k < deletes.length; k++) {
        rows.push({
          type: 'delete',
          oldLine: deletes[k].oldLine,
          newLine: null,
          sign: '-',
          tokens: delTokensList[k],
        })
      }
      for (let k = 0; k < inserts.length; k++) {
        rows.push({
          type: 'insert',
          oldLine: null,
          newLine: inserts[k].newLine,
          sign: '+',
          tokens: insTokensList[k],
        })
      }
    }
  }
  return rows
}

export function generateGitPatch(origText, modText, fileNameA = 'codigo_original', fileNameB = 'codigo_modificado', options = {}) {
  const diffItems = computeFullDiff(origText, modText, options)
  let patch = `--- a/${fileNameA}\n+++ b/${fileNameB}\n`
  let i = 0
  const n = diffItems.length

  while (i < n) {
    if (diffItems[i].type !== 'equal') {
      const hunkStart = Math.max(0, i - 3)
      while (i < n && diffItems[i].type !== 'equal') {
        i++
      }
      const hunkEnd = Math.min(n, i + 3)

      const slice = diffItems.slice(hunkStart, hunkEnd)
      let oldLinesCount = 0
      let newLinesCount = 0
      let startOld = null
      let startNew = null

      for (const item of slice) {
        if (item.type === 'equal') {
          if (startOld === null && item.oldLine) startOld = item.oldLine
          if (startNew === null && item.newLine) startNew = item.newLine
          oldLinesCount++
          newLinesCount++
        } else if (item.type === 'delete') {
          if (startOld === null && item.oldLine) startOld = item.oldLine
          oldLinesCount++
        } else if (item.type === 'insert') {
          if (startNew === null && item.newLine) startNew = item.newLine
          newLinesCount++
        }
      }

      patch += `@@ -${startOld || 1},${oldLinesCount} +${startNew || 1},${newLinesCount} @@\n`
      for (const item of slice) {
        if (item.type === 'equal') {
          patch += ` ${item.oldText}\n`
        } else if (item.type === 'delete') {
          patch += `-${item.oldText}\n`
        } else if (item.type === 'insert') {
          patch += `+${item.newText}\n`
        }
      }
    } else {
      i++
    }
  }
  return patch
}

export const DIFF_SAMPLES = {
  js: {
    fileA: 'apiService.old.js',
    fileB: 'apiService.new.js',
    a: `// Serviço de API Legado
function fetchUserData(userId, callback) {
    console.log("Iniciando requisição para ID: " + userId);
    var url = "https://api.exemplo.com/users/" + userId;
    
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            callback(null, data);
        } else {
            callback("Erro ao buscar dados do usuário");
        }
    };
    
    xhr.send();
}`,
    b: `// Serviço de API Moderno com Retry e TypeScript
export async function fetchUserData(userId: string, retries = 3): Promise<UserData> {
    console.info(\`[API] Buscando usuário: \${userId} (tentativas restantes: \${retries})\`);
    const url = \`https://api.exemplo.com/v2/users/\${encodeURIComponent(userId)}\`;
    
    try {
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            throw new Error(\`Falha na requisição: HTTP \${response.status}\`);
        }
        
        const userData: UserData = await response.json();
        return userData;
    } catch (error) {
        if (retries > 0) {
            console.warn(\`Tentando novamente para \${userId}...\`);
            return fetchUserData(userId, retries - 1);
        }
        throw new ApiError("Erro ao buscar dados do usuário", error);
    }
}`,
  },
  py: {
    fileA: 'models.py',
    fileB: 'models.py',
    a: `# Script Python básico
class Produto:
    def __init__(self, id, nome, preco, estoque):
        self.id = id
        self.nome = nome
        self.preco = preco
        self.estoque = estoque

    def calcular_desconto(self, taxa):
        return self.preco * (1 - taxa)

    def __repr__(self):
        return "Produto(" + str(self.id) + ", " + self.nome + ")"`,
    b: `from dataclasses import dataclass
from typing import Optional
from functools import lru_cache

@dataclass(frozen=True)
class Produto:
    id: int
    nome: str
    preco: float
    estoque: int = 0
    categoria: Optional[str] = "Geral"

    @lru_cache(maxsize=128)
    def calcular_desconto(self, taxa: float = 0.05) -> float:
        """Aplica desconto percentual no valor do produto."""
        if not (0.0 <= taxa <= 1.0):
            raise ValueError("A taxa de desconto deve estar entre 0.0 e 1.0")
        return round(self.preco * (1 - taxa), 2)`,
  },
  json: {
    fileA: 'package.json',
    fileB: 'package.json',
    a: `{
  "name": "meu-projeto",
  "version": "1.0.0",
  "description": "Exemplo de pacote",
  "main": "index.js",
  "scripts": {
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "dependencies": {
    "express": "^4.17.1",
    "lodash": "^4.17.20"
  }
}`,
    b: `{
  "name": "meu-projeto",
  "version": "2.0.0",
  "description": "Pacote moderno e otimizado",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "express": "^4.19.2"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "vite": "^5.2.10",
    "vitest": "^1.5.0"
  }
}`,
  },
  html: {
    fileA: 'index.html',
    fileB: 'index.html',
    a: `<div id="menu">
  <table width="100%" border="0" cellpadding="5">
    <tr>
      <td><a href="/home">Home</a></td>
      <td><a href="/sobre">Sobre</a></td>
      <td><a href="/contato">Contato</a></td>
    </tr>
  </table>
</div>`,
    b: `<header class="navbar">
  <nav class="nav-container" aria-label="Navegação principal">
    <a href="/home" class="nav-link active">Início</a>
    <a href="/servicos" class="nav-link">Serviços</a>
    <a href="/sobre" class="nav-link">Sobre Nós</a>
    <a href="/contato" class="nav-link btn-cta">Fale Conosco</a>
  </nav>
</header>`,
  },
}
