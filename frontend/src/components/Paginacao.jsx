export default function Paginacao({
  pagina,
  totalPaginas,
  temProxima,
  bloqueado,
  aoMudarPagina,
}) {
  return (
    <nav className="paginacao" aria-label="Paginação dos chamados">
      <button
        type="button"
        disabled={pagina === 0 || bloqueado}
        onClick={() => aoMudarPagina(pagina - 1)}
      >
        Anterior
      </button>

      <span>
        {totalPaginas === 0
          ? 'Nenhuma página'
          : `Página ${pagina + 1} de ${totalPaginas}`}
      </span>

      <button
        type="button"
        disabled={!temProxima || bloqueado}
        onClick={() => aoMudarPagina(pagina + 1)}
      >
        Próxima
      </button>
    </nav>
  )
}