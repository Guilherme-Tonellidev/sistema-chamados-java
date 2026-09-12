import { useEffect, useState } from 'react'
import './App.css'

const classesStatus = {
  Aberto: 'aberto',
  'Em atendimento': 'atendimento',
  Resolvido: 'resolvido',
}

export default function App() {
  const [filtro, setFiltro] = useState('')
  const [pagina, setPagina] = useState(0)
  const [atualizacao, setAtualizacao] = useState(0)
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function carregarChamados() {
      setCarregando(true)
      setErro('')

      const parametros = new URLSearchParams({
        pagina: String(pagina),
        tamanho: '5',
      })

      if (filtro) {
        parametros.set('status', filtro)
      }

      try {
        const resposta = await fetch(
          `/api/chamados/paginados?${parametros}`,
          { signal: controller.signal },
        )

        const resultado = await resposta.json().catch(() => null)

        if (!resposta.ok) {
          throw new Error(
            resultado?.erro || 'Não foi possível carregar os chamados.',
          )
        }

        if (!resultado || !Array.isArray(resultado.chamados)) {
          throw new Error('A resposta recebida não contém uma lista de chamados.')
        }

        if (!controller.signal.aborted) {
          setDados(resultado)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setDados(null)
          setErro(
            error instanceof TypeError
              ? 'Não foi possível conectar ao serviço. Tente novamente.'
              : error.message,
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setCarregando(false)
        }
      }
    }

    carregarChamados()

    return () => controller.abort()
  }, [filtro, pagina, atualizacao])

  function alterarFiltro(event) {
    setCarregando(true)
    setFiltro(event.target.value)
    setPagina(0)
  }

  function mudarPagina(novaPagina) {
    setCarregando(true)
    setPagina(novaPagina)
  }

  function atualizar() {
    setCarregando(true)
    setAtualizacao((valor) => valor + 1)
  }

  return (
    <main className="painel">
      <header className="cabecalho">
        <div>
          <p className="marca">CENTRAL DE SUPORTE</p>
          <h1>Chamados de TI</h1>
          <p className="subtitulo">
            Acompanhe as solicitações e o andamento dos atendimentos.
          </p>
        </div>

        <button
          className="botao-primario"
          onClick={atualizar}
          disabled={carregando}
        >
          {carregando ? 'Carregando…' : 'Atualizar lista'}
        </button>
      </header>

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
              onChange={alterarFiltro}
              disabled={carregando}
            >
              <option value="">Todos os status</option>
              <option value="Aberto">Aberto</option>
              <option value="Em atendimento">Em atendimento</option>
              <option value="Resolvido">Resolvido</option>
            </select>
          </div>
        </div>

        <div aria-busy={carregando}>
          {carregando ? (
            <p className="mensagem" role="status">
              Carregando chamados…
            </p>
          ) : erro ? (
            <div className="erro" role="alert">
              <p>{erro}</p>
              <button onClick={atualizar}>Tentar novamente</button>
            </div>
          ) : dados?.chamados.length === 0 ? (
            <p className="mensagem">
              Nenhum chamado encontrado nesta página.
            </p>
          ) : (
            <ul className="lista-chamados">
              {dados?.chamados.map((chamado) => (
                <li key={chamado.id} className="chamado">
                  <div className="chamado-topo">
                    <span className="identificador">#{chamado.id}</span>
                    <span
                      className={`status ${classesStatus[chamado.status] || ''}`}
                    >
                      {chamado.status}
                    </span>
                  </div>
                  <h3>{chamado.titulo}</h3>
                  <p className="descricao">{chamado.descricao}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!carregando && !erro && dados && (
          <nav className="paginacao" aria-label="Paginação dos chamados">
            <button
              disabled={pagina === 0}
              onClick={() => mudarPagina(pagina - 1)}
            >
              Anterior
            </button>

            <span>
              {dados.totalPaginas === 0
                ? 'Nenhuma página'
                : `Página ${dados.pagina + 1} de ${dados.totalPaginas}`}
            </span>

            <button
              disabled={!dados.temProxima}
              onClick={() => mudarPagina(pagina + 1)}
            >
              Próxima
            </button>
          </nav>
        )}
      </section>

      <footer className="rodape">
        Sistema de Chamados · Guilherme Tonelli
      </footer>
    </main>
  )
}