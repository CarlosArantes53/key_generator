import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  computeFullDiff,
  buildSplitRows,
  buildUnifiedRows,
  generateGitPatch,
  DIFF_SAMPLES,
} from '../utils/diff'

function renderTokens(tokens) {
  if (!tokens || tokens.length === 0) return '\u00A0'
  return tokens.map((tok, idx) => {
    if (tok.type === 'delete') {
      return (
        <span key={idx} className="gc-token-del">
          {tok.text}
        </span>
      )
    }
    if (tok.type === 'insert') {
      return (
        <span key={idx} className="gc-token-add">
          {tok.text}
        </span>
      )
    }
    return <span key={idx}>{tok.text}</span>
  })
}

export default function GitCompare() {
  const [textA, setTextA] = useState(DIFF_SAMPLES.js.a)
  const [textB, setTextB] = useState(DIFF_SAMPLES.js.b)
  const [fileNameA, setFileNameA] = useState(DIFF_SAMPLES.js.fileA)
  const [fileNameB, setFileNameB] = useState(DIFF_SAMPLES.js.fileB)
  const [hasFileBadgeA, setHasFileBadgeA] = useState(true)
  const [hasFileBadgeB, setHasFileBadgeB] = useState(true)
  const [selectedExample, setSelectedExample] = useState('js')

  const [mode, setMode] = useState('split') // 'split' | 'unified'
  const [context, setContext] = useState('all') // 'all' | '3' | '5' | '10'
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false)
  const [ignoreCase, setIgnoreCase] = useState(false)
  const [wrapLines, setWrapLines] = useState(true)
  const [inputsCollapsed, setInputsCollapsed] = useState(false)
  const [diffTheme, setDiffTheme] = useState('dark') // 'dark' | 'light'

  const [expandedFolds, setExpandedFolds] = useState({})
  const [currentHunkIndex, setCurrentHunkIndex] = useState(0)
  const [flashedHunk, setFlashedHunk] = useState(null)
  const [dragOverA, setDragOverA] = useState(false)
  const [dragOverB, setDragOverB] = useState(false)
  const [toastMsg, setToastMsg] = useState(null)

  const fileInputARef = useRef(null)
  const fileInputBRef = useRef(null)
  const textARef = useRef(null)
  const textBRef = useRef(null)
  const diffContainerRef = useRef(null)
  const toastTimerRef = useRef(null)

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => {
      setToastMsg(null)
    }, 2500)
  }, [])

  // Compute diff items
  const diffItems = useMemo(() => {
    if (!textA && !textB) return []
    return computeFullDiff(textA, textB, { ignoreWhitespace, ignoreCase })
  }, [textA, textB, ignoreWhitespace, ignoreCase])

  // Compute statistics
  const stats = useMemo(() => {
    let addCount = 0
    let delCount = 0
    let hunkCount = 0
    let inHunk = false

    for (const item of diffItems) {
      if (item.type === 'insert') {
        addCount++
        if (!inHunk) {
          hunkCount++
          inHunk = true
        }
      } else if (item.type === 'delete') {
        delCount++
        if (!inHunk) {
          hunkCount++
          inHunk = true
        }
      } else {
        inHunk = false
      }
    }

    return { addCount, delCount, hunkCount }
  }, [diffItems])

  useEffect(() => {
    setExpandedFolds({})
    setCurrentHunkIndex(stats.hunkCount > 0 ? 0 : -1)
  }, [textA, textB, mode, context, ignoreWhitespace, ignoreCase, stats.hunkCount])

  const jumpToHunk = useCallback(
    (targetIdx) => {
      if (!diffContainerRef.current) return
      const hunkElements = diffContainerRef.current.querySelectorAll('[data-hunk="true"]')
      if (hunkElements.length === 0) return

      let idx = targetIdx
      if (idx < 0) idx = hunkElements.length - 1
      if (idx >= hunkElements.length) idx = 0

      setCurrentHunkIndex(idx)
      const el = hunkElements[idx]
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setFlashedHunk(idx)
      setTimeout(() => setFlashedHunk(null), 1200)
    },
    []
  )

  const handleSwap = useCallback(() => {
    setTextA(textB)
    setTextB(textA)
    setFileNameA(fileNameB)
    setFileNameB(fileNameA)
    setHasFileBadgeA(hasFileBadgeB)
    setHasFileBadgeB(hasFileBadgeA)
    showToast('Lados invertidos com sucesso!')
  }, [textA, textB, fileNameA, fileNameB, hasFileBadgeA, hasFileBadgeB, showToast])

  const handleCompareManual = useCallback(() => {
    setExpandedFolds({})
    showToast('Comparação atualizada!')
  }, [showToast])

  // Keyboard shortcuts (Ctrl+Enter, Alt+N, Alt+P, Alt+S, Alt+E)
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleCompareManual()
      } else if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault()
        jumpToHunk(currentHunkIndex + 1)
      } else if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault()
        jumpToHunk(currentHunkIndex - 1)
      } else if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        handleSwap()
      } else if (e.altKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault()
        setInputsCollapsed((prev) => !prev)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [currentHunkIndex, jumpToHunk, handleSwap, handleCompareManual])

  const handleExampleChange = (e) => {
    const val = e.target.value
    setSelectedExample(val)
    const sample = DIFF_SAMPLES[val]
    if (sample) {
      setTextA(sample.a)
      setTextB(sample.b)
      setFileNameA(sample.fileA)
      setFileNameB(sample.fileB)
      setHasFileBadgeA(true)
      setHasFileBadgeB(true)
      showToast('Exemplo carregado com sucesso!')
    }
  }

  const loadFile = (file, side) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target.result
      if (side === 'A') {
        setTextA(content)
        setFileNameA(file.name)
        setHasFileBadgeA(true)
      } else {
        setTextB(content)
        setFileNameB(file.name)
        setHasFileBadgeB(true)
      }
      showToast(`Arquivo "${file.name}" carregado!`)
    }
    reader.readAsText(file)
  }

  const handlePaste = async (side) => {
    try {
      const clip = await navigator.clipboard.readText()
      if (clip) {
        if (side === 'A') {
          setTextA(clip)
          showToast('Código original colado!')
        } else {
          setTextB(clip)
          showToast('Código modificado colado!')
        }
      }
    } catch {
      if (side === 'A') textARef.current?.focus()
      else textBRef.current?.focus()
      showToast('Pressione Ctrl+V no campo para colar.')
    }
  }

  const handleCopyPatch = () => {
    const patch = generateGitPatch(textA, textB, fileNameA, fileNameB, {
      ignoreWhitespace,
      ignoreCase,
    })
    navigator.clipboard
      .writeText(patch)
      .then(() => showToast('✓ Patch Git copiado para a área de transferência!'))
      .catch(() => showToast('Erro ao copiar patch.'))
  }

  const handleDownloadDiff = () => {
    const patch = generateGitPatch(textA, textB, fileNameA, fileNameB, {
      ignoreWhitespace,
      ignoreCase,
    })
    const blob = new Blob([patch], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileNameB || 'alteracoes'}.diff`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Download do arquivo .diff iniciado!')
  }

  const linesCountA = textA ? textA.split('\n').length : 0
  const linesCountB = textB ? textB.split('\n').length : 0

  const expandFold = (groupId) => {
    setExpandedFolds((prev) => ({ ...prev, [groupId]: true }))
  }

  // Build rows with folding support
  const renderDiffContent = () => {
    if (!textA && !textB) {
      return (
        <div className="gc-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>
            Insira dois códigos acima ou selecione um <strong>Exemplo</strong> para comparar.
          </p>
        </div>
      )
    }

    if (stats.addCount === 0 && stats.delCount === 0) {
      return (
        <div className="gc-empty-state">
          <span style={{ fontSize: '2.4rem', display: 'block', marginBottom: '6px' }}>🎉</span>
          <h3 style={{ color: 'var(--gc-diff-add-border)', margin: '8px 0' }}>
            Códigos 100% idênticos!
          </h3>
          <p>Nenhuma diferença encontrada entre o código Original e o Modificado.</p>
        </div>
      )
    }

    const contextNum = context === 'all' ? Infinity : parseInt(context, 10)

    if (mode === 'split') {
      const splitRows = buildSplitRows(diffItems)
      const elements = []
      let i = 0
      let hunkIdCounter = 0

      while (i < splitRows.length) {
        if (splitRows[i].type === 'equal') {
          const eqStart = i
          while (i < splitRows.length && splitRows[i].type === 'equal') {
            i++
          }
          const eqLen = i - eqStart
          const isAtStart = eqStart === 0
          const isAtEnd = i === splitRows.length

          let foldStart = -1
          let foldEnd = -1

          if (!isAtStart || !isAtEnd) {
            if (isAtStart && eqLen > contextNum) {
              foldStart = eqStart
              foldEnd = i - contextNum
            } else if (isAtEnd && eqLen > contextNum) {
              foldStart = eqStart + contextNum
              foldEnd = i
            } else if (!isAtStart && !isAtEnd && eqLen > 2 * contextNum) {
              foldStart = eqStart + contextNum
              foldEnd = i - contextNum
            }
          }

          const groupId = `split-fold-${foldStart}`
          const isExpanded = !!expandedFolds[groupId]

          for (let k = eqStart; k < i; k++) {
            if (foldStart !== -1 && !isExpanded && k === foldStart) {
              const hiddenCount = foldEnd - foldStart
              elements.push(
                <tr
                  key={groupId}
                  className="gc-hunk-expander-row"
                  onClick={() => expandFold(groupId)}
                >
                  <td colSpan={4} className="gc-hunk-expander-cell">
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                      <path d="m8 3.5 3.5 3.5H9v2h2.5L8 12.5 4.5 9H7V7H4.5L8 3.5z"></path>
                    </svg>
                    Expandir {hiddenCount} linha{hiddenCount > 1 ? 's' : ''} inalterada
                    {hiddenCount > 1 ? 's' : ''}...
                  </td>
                </tr>
              )
              k = foldEnd - 1
              continue
            }

            const row = splitRows[k]
            elements.push(
              <tr key={`eq-${k}`}>
                <td className="gc-line-num">{row.left.line || ''}</td>
                <td className="gc-code-content">{row.left.text || '\u00A0'}</td>
                <td className="gc-line-num">{row.right.line || ''}</td>
                <td className="gc-code-content">{row.right.text || '\u00A0'}</td>
              </tr>
            )
          }
        } else {
          const thisHunkIdx = hunkIdCounter++
          let isFirst = true

          while (i < splitRows.length && splitRows[i].type !== 'equal') {
            const row = splitRows[i]
            const firstOfHunk = isFirst
            isFirst = false

            const leftClass =
              row.left.type === 'delete'
                ? 'gc-row-del'
                : row.left.type === 'empty'
                  ? 'gc-row-empty'
                  : ''
            const rightClass =
              row.right.type === 'insert'
                ? 'gc-row-add'
                : row.right.type === 'empty'
                  ? 'gc-row-empty'
                  : ''

            elements.push(
              <tr
                key={`chg-${i}`}
                data-hunk={firstOfHunk ? 'true' : undefined}
                style={
                  firstOfHunk && flashedHunk === thisHunkIdx
                    ? { outline: '2px solid var(--accent2)' }
                    : undefined
                }
              >
                <td className={`gc-line-num ${leftClass}`}>{row.left.line || ''}</td>
                <td className={`gc-code-content ${leftClass}`}>
                  {row.left.type === 'empty' ? '' : renderTokens(row.left.tokens)}
                </td>
                <td className={`gc-line-num ${rightClass}`}>{row.right.line || ''}</td>
                <td className={`gc-code-content ${rightClass}`}>
                  {row.right.type === 'empty' ? '' : renderTokens(row.right.tokens)}
                </td>
              </tr>
            )
            i++
          }
        }
      }

      return (
        <table className="gc-diff-table">
          <colgroup>
            <col className="gc-col-split-gutter" />
            <col className="gc-col-split-code" />
            <col className="gc-col-split-gutter" />
            <col className="gc-col-split-code" />
          </colgroup>
          <tbody>{elements}</tbody>
        </table>
      )
    } else {
      const unifiedRows = buildUnifiedRows(diffItems)
      const elements = []
      let i = 0
      let hunkIdCounter = 0

      while (i < unifiedRows.length) {
        if (unifiedRows[i].type === 'equal') {
          const eqStart = i
          while (i < unifiedRows.length && unifiedRows[i].type === 'equal') {
            i++
          }
          const eqLen = i - eqStart
          const isAtStart = eqStart === 0
          const isAtEnd = i === unifiedRows.length

          let foldStart = -1
          let foldEnd = -1

          if (!isAtStart || !isAtEnd) {
            if (isAtStart && eqLen > contextNum) {
              foldStart = eqStart
              foldEnd = i - contextNum
            } else if (isAtEnd && eqLen > contextNum) {
              foldStart = eqStart + contextNum
              foldEnd = i
            } else if (!isAtStart && !isAtEnd && eqLen > 2 * contextNum) {
              foldStart = eqStart + contextNum
              foldEnd = i - contextNum
            }
          }

          const groupId = `uni-fold-${foldStart}`
          const isExpanded = !!expandedFolds[groupId]

          for (let k = eqStart; k < i; k++) {
            if (foldStart !== -1 && !isExpanded && k === foldStart) {
              const hiddenCount = foldEnd - foldStart
              elements.push(
                <tr
                  key={groupId}
                  className="gc-hunk-expander-row"
                  onClick={() => expandFold(groupId)}
                >
                  <td colSpan={4} className="gc-hunk-expander-cell">
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                      <path d="m8 3.5 3.5 3.5H9v2h2.5L8 12.5 4.5 9H7V7H4.5L8 3.5z"></path>
                    </svg>
                    Expandir {hiddenCount} linha{hiddenCount > 1 ? 's' : ''} inalterada
                    {hiddenCount > 1 ? 's' : ''}...
                  </td>
                </tr>
              )
              k = foldEnd - 1
              continue
            }

            const row = unifiedRows[k]
            elements.push(
              <tr key={`ueq-${k}`}>
                <td className="gc-line-num">{row.oldLine || ''}</td>
                <td className="gc-line-num">{row.newLine || ''}</td>
                <td className="gc-sign-col">{row.sign}</td>
                <td className="gc-code-content">{ renderTokens(row.tokens) }</td>
              </tr>
            )
          }
        } else {
          const thisHunkIdx = hunkIdCounter++
          let isFirst = true

          while (i < unifiedRows.length && unifiedRows[i].type !== 'equal') {
            const row = unifiedRows[i]
            const firstOfHunk = isFirst
            isFirst = false
            const rowClass = row.type === 'delete' ? 'gc-row-del' : 'gc-row-add'

            elements.push(
              <tr
                key={`uchg-${i}`}
                className={rowClass}
                data-hunk={firstOfHunk ? 'true' : undefined}
                style={
                  firstOfHunk && flashedHunk === thisHunkIdx
                    ? { outline: '2px solid var(--accent2)' }
                    : undefined
                }
              >
                <td className="gc-line-num">{row.oldLine || ''}</td>
                <td className="gc-line-num">{row.newLine || ''}</td>
                <td className="gc-sign-col">{row.sign}</td>
                <td className="gc-code-content">{renderTokens(row.tokens)}</td>
              </tr>
            )
            i++
          }
        }
      }

      return (
        <table className="gc-diff-table">
          <colgroup>
            <col className="gc-col-uni-gutter" />
            <col className="gc-col-uni-gutter" />
            <col className="gc-col-uni-sign" />
            <col className="gc-col-uni-code" />
          </colgroup>
          <tbody>{elements}</tbody>
        </table>
      )
    }
  }

  return (
    <div className="gc-wrapper" data-gc-theme={diffTheme}>
      {/* Top Action Bar for Git Compare */}
      <div className="card gc-top-card">
        <div className="gc-top-bar">
          <div>
            <div className="section-title" style={{ marginBottom: '0.25rem' }}>
              // comparador de código · git diff
            </div>
            <p className="gc-subtitle">
              Algoritmo de Myers com diff de tokens intra-linha, exportação .patch e visão lado a lado
            </p>
          </div>

          <div className="gc-header-actions">
            <select
              value={selectedExample}
              onChange={handleExampleChange}
              className="gc-select"
              title="Carregar exemplos prontos"
            >
              <option value="">⚡ Carregar Exemplo...</option>
              <option value="js">JavaScript (Refatoração de API)</option>
              <option value="py">Python (Otimização & Tipagem)</option>
              <option value="json">JSON (Atualização de Dependências)</option>
              <option value="html">HTML / CSS (Design Responsivo)</option>
            </select>

            <button
              type="button"
              className="gc-btn gc-btn-sm"
              onClick={() => setInputsCollapsed((c) => !c)}
              title="Ocultar / Mostrar caixas de código (Alt+E)"
            >
              <span>{inputsCollapsed ? '👁️ Mostrar Entradas' : '👁️ Ocultar Entradas'}</span>
            </button>

            <button
              type="button"
              className="gc-btn gc-btn-icon"
              onClick={() => setDiffTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              title="Alternar tema do Diff (Claro / Escuro)"
            >
              <span>{diffTheme === 'dark' ? '☀️' : '🌙'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Code Inputs */}
      {!inputsCollapsed && (
        <section className="gc-inputs-grid">
          {/* Original Code Card */}
          <div className="gc-input-card">
            <div className="gc-card-header">
              <div className="gc-card-title">
                <span>Original (Base / Antes)</span>
                {hasFileBadgeA && <span className="gc-badge-file">{fileNameA}</span>}
              </div>
              <div className="gc-card-tools">
                <input
                  ref={fileInputARef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) => loadFile(e.target.files[0], 'A')}
                />
                <button
                  type="button"
                  className="gc-btn gc-btn-sm"
                  onClick={() => fileInputARef.current?.click()}
                  title="Carregar arquivo local"
                >
                  📁 Arquivo
                </button>
                <button
                  type="button"
                  className="gc-btn gc-btn-sm"
                  onClick={() => handlePaste('A')}
                  title="Colar da área de transferência"
                >
                  📋 Colar
                </button>
                <button
                  type="button"
                  className="gc-btn gc-btn-sm"
                  onClick={() => {
                    setTextA('')
                    setHasFileBadgeA(false)
                    setFileNameA('codigo_original')
                  }}
                  title="Limpar código original"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div
              className={`gc-editor-wrapper ${dragOverA ? 'drag-over' : ''}`}
              onDragEnter={(e) => {
                e.preventDefault()
                setDragOverA(true)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverA(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setDragOverA(false)
              }}
              onDrop={(e) => {
                e.preventDefault()
                setDragOverA(false)
                if (e.dataTransfer.files?.length > 0) {
                  loadFile(e.dataTransfer.files[0], 'A')
                }
              }}
            >
              <div className="gc-dropzone-overlay">Solte o arquivo original aqui</div>
              <textarea
                ref={textARef}
                value={textA}
                onChange={(e) => setTextA(e.target.value)}
                className="gc-code-textarea"
                placeholder="Cole o código original aqui ou arraste um arquivo..."
                spellCheck={false}
              />
            </div>

            <div className="gc-card-footer">
              <span>
                {linesCountA} linha{linesCountA === 1 ? '' : 's'} | {textA.length} caracteres
              </span>
              <span>Versão Antiga</span>
            </div>
          </div>

          {/* Center Swap & Compare Actions */}
          <div className="gc-center-actions">
            <button
              type="button"
              className="gc-btn gc-btn-icon gc-swap-btn"
              onClick={handleSwap}
              title="Inverter lados (Original ↔ Modificado) [Alt+S]"
            >
              ⇄
            </button>
            <button
              type="button"
              className="gc-btn gc-btn-primary"
              onClick={handleCompareManual}
              title="Executar comparação (Ctrl + Enter)"
            >
              🔍 Comparar
            </button>
          </div>

          {/* Modified Code Card */}
          <div className="gc-input-card">
            <div className="gc-card-header">
              <div className="gc-card-title">
                <span>Modificado (Compare / Depois)</span>
                {hasFileBadgeB && <span className="gc-badge-file">{fileNameB}</span>}
              </div>
              <div className="gc-card-tools">
                <input
                  ref={fileInputBRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) => loadFile(e.target.files[0], 'B')}
                />
                <button
                  type="button"
                  className="gc-btn gc-btn-sm"
                  onClick={() => fileInputBRef.current?.click()}
                  title="Carregar arquivo local"
                >
                  📁 Arquivo
                </button>
                <button
                  type="button"
                  className="gc-btn gc-btn-sm"
                  onClick={() => handlePaste('B')}
                  title="Colar da área de transferência"
                >
                  📋 Colar
                </button>
                <button
                  type="button"
                  className="gc-btn gc-btn-sm"
                  onClick={() => {
                    setTextB('')
                    setHasFileBadgeB(false)
                    setFileNameB('codigo_modificado')
                  }}
                  title="Limpar código modificado"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div
              className={`gc-editor-wrapper ${dragOverB ? 'drag-over' : ''}`}
              onDragEnter={(e) => {
                e.preventDefault()
                setDragOverB(true)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverB(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setDragOverB(false)
              }}
              onDrop={(e) => {
                e.preventDefault()
                setDragOverB(false)
                if (e.dataTransfer.files?.length > 0) {
                  loadFile(e.dataTransfer.files[0], 'B')
                }
              }}
            >
              <div className="gc-dropzone-overlay">Solte o arquivo modificado aqui</div>
              <textarea
                ref={textBRef}
                value={textB}
                onChange={(e) => setTextB(e.target.value)}
                className="gc-code-textarea"
                placeholder="Cole o código modificado aqui ou arraste um arquivo..."
                spellCheck={false}
              />
            </div>

            <div className="gc-card-footer">
              <span>
                {linesCountB} linha{linesCountB === 1 ? '' : 's'} | {textB.length} caracteres
              </span>
              <span>Nova Versão</span>
            </div>
          </div>
        </section>
      )}

      {/* Toolbar Controls */}
      <div className="gc-controls-bar">
        <div className="gc-control-group">
          <div className="gc-view-mode-tabs">
            <button
              type="button"
              className={`gc-mode-tab ${mode === 'split' ? 'active' : ''}`}
              onClick={() => setMode('split')}
              title="Visualização Lado a Lado"
            >
              ◫ Lado a Lado
            </button>
            <button
              type="button"
              className={`gc-mode-tab ${mode === 'unified' ? 'active' : ''}`}
              onClick={() => setMode('unified')}
              title="Visualização Unificada"
            >
              ☰ Unificado
            </button>
          </div>

          <select
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="gc-select"
            title="Linhas de contexto ao redor das modificações"
          >
            <option value="3">Contexto: 3 linhas</option>
            <option value="5">Contexto: 5 linhas</option>
            <option value="10">Contexto: 10 linhas</option>
            <option value="all">Mostrar Tudo (Sem ocultar)</option>
          </select>
        </div>

        <div className="gc-control-group">
          <label
            className="gc-toggle-checkbox"
            title="Desconsidera espaços iniciais e finais na comparação"
          >
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={(e) => setIgnoreWhitespace(e.target.checked)}
            />
            <span>Ignorar espaços</span>
          </label>

          <label className="gc-toggle-checkbox" title="Desconsidera maiúsculas e minúsculas">
            <input
              type="checkbox"
              checked={ignoreCase}
              onChange={(e) => setIgnoreCase(e.target.checked)}
            />
            <span>Ignorar caixa</span>
          </label>

          <label className="gc-toggle-checkbox" title="Quebrar linhas longas">
            <input
              type="checkbox"
              checked={wrapLines}
              onChange={(e) => setWrapLines(e.target.checked)}
            />
            <span>Quebrar linhas</span>
          </label>
        </div>

        <div className="gc-control-group">
          <button
            type="button"
            className="gc-btn gc-btn-sm"
            onClick={handleCopyPatch}
            title="Copiar em formato de patch Git (.patch)"
          >
            📋 Copiar Patch Git
          </button>
          <button
            type="button"
            className="gc-btn gc-btn-sm"
            onClick={handleDownloadDiff}
            title="Baixar como arquivo .diff"
          >
            💾 Baixar .diff
          </button>
        </div>
      </div>

      {/* Diff Viewer Section */}
      <section>
        <div className="gc-diff-header-bar">
          <div className="gc-diff-stats-box">
            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Diferenças:</span>
            <span className="gc-stat-pill gc-stat-add">
              +{stats.addCount} adiç{stats.addCount === 1 ? 'ão' : 'ões'}
            </span>
            <span className="gc-stat-pill gc-stat-del">
              -{stats.delCount} remoç{stats.delCount === 1 ? 'ão' : 'ões'}
            </span>
            <span className="gc-stat-pill gc-stat-changes">
              {stats.hunkCount} bloco{stats.hunkCount === 1 ? '' : 's'}
            </span>
          </div>

          <div className="gc-jump-nav">
            <span>
              {stats.hunkCount === 0
                ? 'Sem alterações'
                : `Bloco ${currentHunkIndex + 1} de ${stats.hunkCount}`}
            </span>
            <button
              type="button"
              className="gc-btn gc-btn-sm gc-btn-icon"
              onClick={() => jumpToHunk(currentHunkIndex - 1)}
              title="Alteração anterior (Alt + P)"
            >
              ↑
            </button>
            <button
              type="button"
              className="gc-btn gc-btn-sm gc-btn-icon"
              onClick={() => jumpToHunk(currentHunkIndex + 1)}
              title="Próxima alteração (Alt + N)"
            >
              ↓
            </button>
          </div>
        </div>

        <div
          ref={diffContainerRef}
          className={`gc-diff-container ${wrapLines ? 'wrap-lines' : ''}`}
        >
          {renderDiffContent()}
        </div>
      </section>

      {/* Toast Notification */}
      <div className={`gc-toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </div>
  )
}
