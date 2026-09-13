import Paginacao from './Paginacao'

const classesStatus = {
  Aberto: 'aberto',
  'Em atendimento': 'atendimento',
  Resolvido: 'resolvido',
}

const textosAcao = {
  Aberto: 'Iniciar atendimento',
  'Em atendimento': 'Resolver chamado',
}

export default function ListaChamados({
  dados,
  filtro,
  carregando,
  erro,
  erroStatus,
  sucessoStatus,
  idEmAlteracao,
  bloqueado,
  aoAlterarFiltro,
  aoAtualizar,
  aoAlterarStatus,
  aoMudarPagina,
}) {
  const alterandoStatus = idEmAlteracao !== null

  return (
    <section className="conteudo" aria-labelledby="titulo-lista">
      <div className="barra-filtros">
        <div>
          <h2 id="titulo-lista">Solicitações</h2>
          <p className="subtitulo">
            {carregando
              ? 'Consultando chamados…'
              : dados
                ? `${dados.totalElementos} chamado(s) encontrado(s)`
                : 'Consulta indisponível'}
          </p>
        </div>

        <div className="campo">
          <label htmlFor="status">Filtrar por status</label>
          <select
            id="status"
            value={filtro}
            onChange={(event) => aoAlterarFiltro(event.target.value)}
            disabled={carregando || bloqueado}
          >
            <option value="">Todos os status</option>
            <option value="Aberto">Aberto</option>
            <option value="Em atendimento">Em atendimento</option>
            <option value="Resolvido">Resolvido</option>
          </select>
        </div>
      </div>

      {erroStatus && (
        <div className="erro" role="alert">
          <p>{erroStatus}</p>
          <button
            type="button"
            onClick={aoAtualizar}
            disabled={carregando || bloqueado}
          >
            Atualizar lista
          </button>
        </div>
      )}

      {sucessoStatus && (
        <div className="aviso-cadastro sucesso" role="status">
          {sucessoStatus}
        </div>
      )}

      <div aria-busy={carregando || alterandoStatus}>
        {carregando ? (
          <p className="mensagem" role="status">
            Carregando chamados…
          </p>
        ) : erro ? (
          <div className="erro" role="alert">
            <p>{erro}</p>
            <button
              type="button"
              onClick={aoAtualizar}
              disabled={bloqueado}
            >
              Tentar novamente
            </button>
          </div>
        ) : dados?.chamados.length === 0 ? (
          <p className="mensagem">
            Nenhum chamado encontrado nesta página.
          </p>
        ) : (
          <ul className="lista-chamados">
            {dados?.chamados.map((chamado) => {
              const textoAcao = textosAcao[chamado.status]
              const atualizandoEste = idEmAlteracao === chamado.id

              return (
                <li key={chamado.id} className="chamado">
                  <div className="chamado-topo">
                    <span className="identificador">#{chamado.id}</span>
                    <span
                      className={`status ${classesStatus[chamado.status] || ''}`}
                    >
                      {chamado.status}
                    </span>
                  </div>

                  <div className="acoes-formulario">
                    <div>
                      <h3>{chamado.titulo}</h3>
                      <p className="descricao">{chamado.descricao}</p>
                    </div>

                    {textoAcao && (
                      <button
                        type="button"
                        className="botao-primario"
                        onClick={() => aoAlterarStatus(chamado)}
                        disabled={bloqueado}
                        aria-label={`${textoAcao}: chamado #${chamado.id}`}
                      >
                        {atualizandoEste ? 'Atualizando…' : textoAcao}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {!carregando && !erro && dados && (
        <Paginacao
          pagina={dados.pagina}
          totalPaginas={dados.totalPaginas}
          temProxima={dados.temProxima}
          bloqueado={bloqueado}
          aoMudarPagina={aoMudarPagina}
        />
      )}
    </section>
  )
}