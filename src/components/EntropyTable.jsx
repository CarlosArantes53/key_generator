import { ENTROPY_TABLE } from '../utils/constants'

export default function EntropyTable() {
  return (
    <div className="card">
      <div className="section-title">// tabela de entropia × força</div>
      <table className="entropy-table">
        <thead>
          <tr>
            <th>Força</th>
            <th>Entropia (bits)</th>
            <th>Exemplo / Descrição</th>
          </tr>
        </thead>
        <tbody>
          {ENTROPY_TABLE.map(row => (
            <tr key={row.label}>
              <td><span className="dot" style={{ background: row.color }}></span>{row.label}</td>
              <td>{row.range}</td>
              <td>{row.example}{row.code && <code>{row.code}</code>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
