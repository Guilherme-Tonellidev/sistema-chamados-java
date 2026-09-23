import Paginacao from './Paginacao'
import StatusChamado from './StatusChamado'

const filtrosStatus = [
  { valor: '', nome: 'Todos' },
  { valor: 'Aberto', nome: 'Abertos' },
  { valor: 'Em atendimento', nome: 'Em atendimento' },
  { valor: 'Resolvido', nome: 'Resolvidos' },
]

const textosAcao = {
  Aberto: 'Iniciar atendimento',
  'Em atendimento': 'Resolver chamado',
}

const classesPrioridade = {
  Baixa: 'selo-baixa',
  Normal: 'selo-normal',
  Alta: 'selo-alta',
}

const formatadorData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function DataAbertura({ valor }) {
  if (!valor) {
    return <span className="tabela-data">Não registrada</span>
  }

  const data = new Date(valor)

  if (Number.isNaN(data.getTime())) {
    return <span className="tabela-data">Indisponível</span>
  }

  return (
    <time className="tabela-data" dateTime={data.toISOString()}>
      {formatadorData.format(data)}
    </time>
  )
}

export default function ListaChamados({
  aoAbrirChamado,
  dados,
  filtro,
  filtroPrioridade,
  carregando,
  erro,
  erroStatus,
  sucessoStatus,
  idEmAlteracao,
  bloqueado,
  aoAlterarFiltro,
  aoAlterarFiltroPrioridade,
  aoAtualizar,
  aoAlterarStatus,
  aoMudarPagina,
}) {
  const alterandoStatus = idEmAlteracao !== null
  const filtrosBloqueados = carregando || bloqueado

  return (
    <section className="elodesk-listagem" aria-labelledby="titulo-lista">
      <div
        className="elodesk-abas"
        role="group"
        aria-label="Filtrar por status"
      >
        {filtrosStatus.map((item) => (
          <button
            key={item.valor}
            type="button"
            className={filtro === item.valor ? 'aba-ativa' : ''}
            aria-pressed={filtro === item.valor}
            disabled={filtrosBloqueados}
            onClick={() => aoAlterarFiltro(item.valor)}
          >
            {item.nome}
          </button>
        ))}
      </div>

      <div className="elodesk-resumo">
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
          <label htmlFor="filtro-prioridade">
            Filtrar por prioridade
          </label>
          <select
            id="filtro-prioridade"
            value={filtroPrioridade}
            onChange={(event) =>
              aoAlterarFiltroPrioridade(event.target.value)
            }
            disabled={filtrosBloqueados}
          >
            <option value="">Todas as prioridades</option>
            <option value="Baixa">Baixa</option>
            <option value="Normal">Normal</option>
            <option value="Alta">Alta</option>
          </select>
        </div>
      </div>

      {erroStatus && (
        <div className="erro" role="alert">
          <p>{erroStatus}</p>
          <button
            type="button"
            onClick={aoAtualizar}
            disabled={filtrosBloqueados}
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
        ) : dados ? (
          <div
            className="elodesk-tabela-rolagem"
            role="region"
            aria-label="Tabela de chamados"
            tabIndex={0}
          >
            <table className="elodesk-tabela">
              <caption className="elodesk-somente-leitor">
                Chamados da página atual
              </caption>

              <thead>
                <tr>
                  <th scope="col">Chamado</th>
                  <th scope="col">Título</th>
                  <th scope="col">Prioridade</th>
                  <th scope="col">Status</th>
                  <th scope="col">Abertura</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>

              <tbody>
                {dados.chamados.map((chamado) => {
                  const textoAcao = textosAcao[chamado.status]
                  const atualizandoEste = idEmAlteracao === chamado.id

                  return (
                    <tr key={chamado.id}>
                      <th scope="row">
                        <button
                          type="button"
                          className="tabela-link"
                          onClick={() => aoAbrirChamado(chamado.id)}
                          aria-label={`Abrir chamado #${chamado.id}`}
                        >
                          #{chamado.id}
                        </button>
                      </th>

                      <td className="tabela-assunto">
                        <h3>
                          <button
                            type="button"
                            className="tabela-link tabela-link-titulo"
                            onClick={() => aoAbrirChamado(chamado.id)}
                          >
                            {chamado.titulo}
                          </button>
                        </h3>
                      </td>

                      <td>
                        <span
                          className={`selo-prioridade ${
                            classesPrioridade[chamado.prioridade] || ''
                          }`}
                        >
                          {chamado.prioridade || 'Não informada'}
                        </span>
                      </td>

                      <td>
                        <StatusChamado chamado={chamado} />
                      </td>

                      <td>
                        <DataAbertura valor={chamado.dataAbertura} />
                      </td>

                      <td>
                        {textoAcao ? (
                          <button
                            type="button"
                            className="tabela-acao"
                            onClick={() => aoAlterarStatus(chamado)}
                            disabled={bloqueado}
                            aria-label={`${textoAcao}: chamado #${chamado.id}`}
                          >
                            {atualizandoEste ? 'Atualizando…' : textoAcao}
                          </button>
                        ) : (
                          <span className="tabela-concluido">
                            Concluído
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}
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