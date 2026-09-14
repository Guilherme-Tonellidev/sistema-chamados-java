import { useEffect, useRef, useState } from 'react'
import FormularioChamado from './components/FormularioChamado'
import ListaChamados from './components/ListaChamados'
import './App.css'

const CHAVE_TEMA = 'sistema-chamados-tema'

const acoesStatus = {
  Aberto: {
    endpoint: 'atendimento',
    sucesso: 'Atendimento iniciado',
  },
  'Em atendimento': {
    endpoint: 'resolucao',
    sucesso: 'Chamado resolvido',
  },
}

function lerTemaSalvo() {
  try {
    return localStorage.getItem(CHAVE_TEMA) === 'escuro'
      ? 'escuro'
      : 'claro'
  } catch {
    return 'claro'
  }
}

export default function App() {
  const [tema, setTema] = useState(lerTemaSalvo)

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
  const operacaoPendente = salvando || idEmAlteracao !== null
  const temaEscuro = tema === 'escuro'

  useEffect(() => {
    document.documentElement.dataset.tema = tema

    try {
      localStorage.setItem(CHAVE_TEMA, tema)
    } catch {
      // O tema continua funcionando mesmo se o navegador bloquear o armazenamento.
      return
    }
  }, [tema])

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

  function alternarTema() {
    setTema((atual) => (atual === 'claro' ? 'escuro' : 'claro'))
  }

  function alterarFiltro(novoFiltro) {
    setCarregando(true)
    setFiltro(novoFiltro)
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

        <div className="acoes-cabecalho">
          <button
            type="button"
            className="botao-tema"
            onClick={alternarTema}
            aria-label={
              temaEscuro ? 'Ativar tema claro' : 'Ativar tema escuro'
            }
          >
            <span className="icone-tema" aria-hidden="true">
              {temaEscuro ? '☀' : '☾'}
            </span>
            {temaEscuro ? 'Tema claro' : 'Tema escuro'}
          </button>

          <button
            type="button"
            className="botao-primario"
            onClick={atualizar}
            disabled={carregando || operacaoPendente}
          >
            {carregando ? 'Carregando…' : 'Atualizar lista'}
          </button>
        </div>
      </header>

      <FormularioChamado
        titulo={titulo}
        descricao={descricao}
        salvando={salvando}
        bloqueado={operacaoPendente}
        erro={erroCadastro}
        sucesso={sucessoCadastro}
        aoAlterarTitulo={setTitulo}
        aoAlterarDescricao={setDescricao}
        aoCadastrar={cadastrarChamado}
      />

      <ListaChamados
        dados={dados}
        filtro={filtro}
        carregando={carregando}
        erro={erro}
        erroStatus={erroStatus}
        sucessoStatus={sucessoStatus}
        idEmAlteracao={idEmAlteracao}
        bloqueado={operacaoPendente}
        aoAlterarFiltro={alterarFiltro}
        aoAtualizar={atualizar}
        aoAlterarStatus={alterarStatus}
        aoMudarPagina={mudarPagina}
      />

      <footer className="rodape">
        Sistema de Chamados · Guilherme Tonelli
      </footer>
    </main>
  )
}