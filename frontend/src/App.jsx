import { useEffect, useRef, useState } from 'react'
import './App.css'

const classesStatus = {
  Aberto: 'aberto',
  'Em atendimento': 'atendimento',
  Resolvido: 'resolvido',
}

const acoesStatus = {
  Aberto: {
    endpoint: 'atendimento',
    texto: 'Iniciar atendimento',
    sucesso: 'Atendimento iniciado',
  },
  'Em atendimento': {
    endpoint: 'resolucao',
    texto: 'Resolver chamado',
    sucesso: 'Chamado resolvido',
  },
}

export default function App() {
  const [filtro, setFiltro] = useState('')
  const [pagina, setPagina] = useState(0)
  const [atualizacao, setAtualizacao] = useState(0)
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erroCadastro, setErroCadastro] = useState('')
  const [sucessoCadastro, setSucessoCadastro] = useState('')

  const [idEmAlteracao, setIdEmAlteracao] = useState(null)
  const [erroStatus, setErroStatus] = useState('')
  const [sucessoStatus, setSucessoStatus] = useState('')

  const operacaoEmAndamento = useRef(false)
  const alterandoStatus = idEmAlteracao !== null
  const operacaoPendente = salvando || alterandoStatus

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
          throw new Error(
            'A resposta recebida não contém uma lista de chamados.',
          )
        }

        if (controller.signal.aborted) {
          return
        }

        // Uma mudança de status pode esvaziar a última página do filtro.
        const ultimaPagina = Math.max(0, resultado.totalPaginas - 1)

        if (pagina > ultimaPagina) {
          setPagina(ultimaPagina)
          return
        }

        setDados(resultado)
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

  async function cadastrarChamado(event) {
    event.preventDefault()

    if (operacaoEmAndamento.current) {
      return
    }

    setErroCadastro('')
    setSucessoCadastro('')
    setErroStatus('')
    setSucessoStatus('')

    const tituloLimpo = titulo.trim()
    const descricaoLimpa = descricao.trim()

    if (!tituloLimpo || !descricaoLimpa) {
      setErroCadastro(
        'Preencha o título e a descrição. Os campos não podem conter apenas espaços.',
      )
      return
    }

    operacaoEmAndamento.current = true
    setSalvando(true)

    try {
      const resposta = await fetch('/api/chamados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titulo: tituloLimpo,
          descricao: descricaoLimpa,
        }),
      })

      const resultado = await resposta.json().catch(() => null)

      if (!resposta.ok) {
        throw new Error(
          resultado?.erro || 'Não foi possível cadastrar o chamado.',
        )
      }

      setTitulo('')
      setDescricao('')
      setSucessoCadastro(
        resultado?.id != null
          ? `Chamado #${resultado.id} cadastrado com sucesso! Status inicial: Aberto.`
          : 'Chamado cadastrado com sucesso! Status inicial: Aberto.',
      )

      atualizar()
    } catch (error) {
      setErroCadastro(
        error instanceof TypeError
          ? 'Não foi possível confirmar o cadastro por uma falha de conexão. Atualize a lista para verificar se o chamado foi criado antes de enviar novamente.'
          : error.message,
      )
    } finally {
      operacaoEmAndamento.current = false
      setSalvando(false)
    }
  }

  async function alterarStatus(chamado) {
    const acao = acoesStatus[chamado.status]

    if (!acao || operacaoEmAndamento.current) {
      return
    }

    operacaoEmAndamento.current = true
    setIdEmAlteracao(chamado.id)
    setErroStatus('')
    setSucessoStatus('')
    setSucessoCadastro('')

    try {
      const resposta = await fetch(
        `/api/chamados/${chamado.id}/${acao.endpoint}`,
        { method: 'PATCH' },
      )

      const resultado = await resposta.json().catch(() => null)

      if (!resposta.ok) {
        throw new Error(
          resultado?.erro || 'Não foi possível alterar o status do chamado.',
        )
      }

      setSucessoStatus(`${acao.sucesso} com sucesso! Solicitação #${chamado.id}.`)
      atualizar()
    } catch (error) {
      setErroStatus(
        error instanceof TypeError
          ? 'Não foi possível confirmar a alteração por uma falha de conexão. Atualize a lista para conferir o status antes de tentar novamente.'
          : error.message,
      )
    } finally {
      operacaoEmAndamento.current = false
      setIdEmAlteracao(null)
    }
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
          type="button"
          className="botao-primario"
          onClick={atualizar}
          disabled={carregando || operacaoPendente}
        >
          {carregando ? 'Carregando…' : 'Atualizar lista'}
        </button>
      </header>

      <section
        className="conteudo cadastro"
        aria-labelledby="titulo-cadastro"
      >
        <h2 id="titulo-cadastro">Novo chamado</h2>
        <p className="subtitulo">
          Informe o problema para abrir uma solicitação de suporte.
        </p>

        <form
          className="formulario"
          onSubmit={cadastrarChamado}
          aria-busy={salvando}
        >
          <div className="campo">
            <label htmlFor="titulo">Título</label>
            <input
              id="titulo"
              name="titulo"
              type="text"
              placeholder="Ex.: Impressora não imprime"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              disabled={operacaoPendente}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="descricao">Descrição</label>
            <textarea
              id="descricao"
              name="descricao"
              placeholder="Descreva o problema e o que você já tentou fazer."
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              disabled={operacaoPendente}
              rows={5}
              required
            />
          </div>

          {erroCadastro && (
            <div className="aviso-cadastro erro" role="alert">
              {erroCadastro}
            </div>
          )}

          {sucessoCadastro && (
            <div className="aviso-cadastro sucesso" role="status">
              <p>{sucessoCadastro}</p>
              <p>
                O filtro e a página foram mantidos. Para localizar o novo
                chamado, selecione Todos os status ou Aberto e avance até
                a última página.
              </p>
            </div>
          )}

          <div className="acoes-formulario">
            <p className="subtitulo">Todos os campos são obrigatórios.</p>
            <button
              type="submit"
              className="botao-primario"
              disabled={operacaoPendente}
            >
              {salvando ? 'Cadastrando…' : 'Cadastrar chamado'}
            </button>
          </div>
        </form>
      </section>

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
              disabled={carregando || operacaoPendente}
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
              onClick={atualizar}
              disabled={carregando || operacaoPendente}
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
                onClick={atualizar}
                disabled={operacaoPendente}
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
                const acao = acoesStatus[chamado.status]
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

                      {acao && (
                        <button
                          type="button"
                          className="botao-primario"
                          onClick={() => alterarStatus(chamado)}
                          disabled={operacaoPendente}
                          aria-label={`${acao.texto}: chamado #${chamado.id}`}
                        >
                          {atualizandoEste ? 'Atualizando…' : acao.texto}
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
          <nav className="paginacao" aria-label="Paginação dos chamados">
            <button
              type="button"
              disabled={pagina === 0 || operacaoPendente}
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
              type="button"
              disabled={!dados.temProxima || operacaoPendente}
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