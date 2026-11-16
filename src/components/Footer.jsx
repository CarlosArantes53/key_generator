export default function Footer({ activeTool }) {
  return (
    <footer>
      {activeTool === 'keygen' ? (
        <>
          baseado no artigo de{' '}
          <a href="https://medium.com/@anand_pillai" target="_blank" rel="noreferrer">
            Anand B Pillai
          </a>{' '}
          · fórmula H = L × log₂(N)
        </>
      ) : (
        <>
          algoritmo de <strong>Myers O(ND)</strong> · diff intra-linha e exportação Git Patch
        </>
      )}
      {' · '}
      <span>Canivete Suíço do Dev</span>
    </footer>
  )
}
