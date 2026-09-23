import { useEffect, useRef, useState } from 'react'
import PainelChamados from './PainelChamados'
import FormularioLogin from './components/FormularioLogin'
import { consultarSessao, sair } from './services/autenticacaoApi'
import './App.css'

function Acesso({ children }) {
  return (
    <main className="acesso-elodesk">
      <div className="acesso-orbita" aria-hidden="true" />

      <div className="acesso-centro">
        <header className="acesso-marca">
          <div className="elodesk-identidade">
            <svg
              className="elodesk-simbolo"
              viewBox="0 0 48 48"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="5"
                y="15"
                width="27"
                height="18"
                rx="9"
                transform="rotate(-35 18.5 24)"
                stroke="currentColor"
                strokeWidth="4"
              />
              <rect
                x="16"
                y="15"
                width="27"
                height="18"
                rx="9"
                transform="rotate(-35 29.5 24)"
                stroke="currentColor"
                strokeWidth="4"
              />
            </svg>

            <h1>EloDesk</h1>
          </div>

          <p>Seu suporte, mais próximo.</p>
        </header>

        {children}
      </div>

      <footer className="acesso-rodape">
        EloDesk · Desenvolvido por Guilherme Tonelli
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
      <PainelChamados
        usuario={usuario}
        aoSair={encerrarSessao}
      />
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