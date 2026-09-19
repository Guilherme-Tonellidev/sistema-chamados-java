import { useEffect, useRef, useState } from 'react'
import PainelChamados from './PainelChamados'
import FormularioLogin from './components/FormularioLogin'
import { consultarSessao, sair } from './services/autenticacaoApi'
import './App.css'

const CHAVE_TEMA = 'sistema-chamados-tema'

function lerTemaSalvo() {
  try {
    return localStorage.getItem(CHAVE_TEMA) === 'escuro'
      ? 'escuro'
      : 'claro'
  } catch {
    return 'claro'
  }
}

function Acesso({ children }) {
  const [tema, setTema] = useState(lerTemaSalvo)
  const temaEscuro = tema === 'escuro'

  useEffect(() => {
    document.documentElement.dataset.tema = tema

    try {
      localStorage.setItem(CHAVE_TEMA, tema)
    } catch {
      // A troca de tema funciona mesmo sem acesso ao armazenamento.
    }
  }, [tema])

  return (
    <main className="painel painel-acesso">
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
          className="botao-tema"
          onClick={() =>
            setTema((atual) => (atual === 'claro' ? 'escuro' : 'claro'))
          }
          aria-label={
            temaEscuro ? 'Ativar tema claro' : 'Ativar tema escuro'
          }
        >
          <span className="icone-tema" aria-hidden="true">
            {temaEscuro ? '☀' : '☾'}
          </span>
          {temaEscuro ? 'Tema claro' : 'Tema escuro'}
        </button>
      </header>

      {children}

      <footer className="rodape">
        Sistema de Chamados · Guilherme Tonelli
      </footer>
    </main>
  )
}

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [estado, setEstado] = useState('consultando')
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)
  const logoutEmAndamento = useRef(false)

  useEffect(() => {
    const controller = new AbortController()

    async function carregarSessao() {
      try {
        const resultado = await consultarSessao({
          signal: controller.signal,
        })

        if (controller.signal.aborted) {
          return
        }

        setUsuario(resultado)
        setEstado(resultado ? 'autenticado' : 'anonimo')
      } catch (error) {
        if (!controller.signal.aborted) {
          setErro(
            error instanceof TypeError
              ? 'Não foi possível conectar ao serviço. Tente novamente.'
              : error.message,
          )
          setEstado('erro')
        }
      }
    }

    carregarSessao()

    return () => controller.abort()
  }, [tentativa])

  function tentarNovamente() {
    setErro('')
    setUsuario(null)
    setEstado('consultando')
    setTentativa((atual) => atual + 1)
  }

  function concluirLogin(usuarioConectado) {
    setErro('')
    setUsuario(usuarioConectado)
    setEstado('autenticado')
  }

  async function encerrarSessao() {
    if (logoutEmAndamento.current) {
      return
    }

    logoutEmAndamento.current = true
    setErro('')
    setEstado('saindo')

    try {
      await sair()
      setUsuario(null)
      setEstado('anonimo')
    } catch {
      setUsuario(null)
      setErro(
        'Não foi possível confirmar a saída. Verifique a sessão e tente sair novamente.',
      )
      setEstado('erro')
    } finally {
      logoutEmAndamento.current = false
    }
  }

  if (estado === 'autenticado' && usuario) {
    return (
      <>
        <div className="barra-sessao">
          <p>
            Conectado como <strong>{usuario.nome}</strong>
          </p>
          <button type="button" onClick={encerrarSessao}>
            Sair
          </button>
        </div>

        <PainelChamados />
      </>
    )
  }

  return (
    <Acesso>
      {(estado === 'consultando' || estado === 'saindo') && (
        <section className="conteudo" aria-busy="true">
          <p className="mensagem" role="status">
            {estado === 'saindo'
              ? 'Encerrando sessão…'
              : 'Verificando sessão…'}
          </p>
        </section>
      )}

      {estado === 'erro' && (
        <section className="conteudo">
          <div className="erro" role="alert">
            <p>{erro}</p>
          </div>
          <button type="button" onClick={tentarNovamente}>
            Verificar sessão novamente
          </button>
        </section>
      )}

      {estado === 'anonimo' && (
        <FormularioLogin aoEntrar={concluirLogin} />
      )}
    </Acesso>
  )
}