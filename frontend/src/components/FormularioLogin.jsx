import { useRef, useState } from 'react'
import { entrar } from '../services/autenticacaoApi'

export default function FormularioLogin({ aoEntrar }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const operacaoEmAndamento = useRef(false)

  async function enviar(event) {
    event.preventDefault()

    if (operacaoEmAndamento.current) {
      return
    }

    setErro('')

    if (!email.trim() || !senha) {
      setErro('Informe o e-mail e a senha.')
      return
    }

    operacaoEmAndamento.current = true
    setEnviando(true)

    try {
      const usuario = await entrar(email, senha)
      setSenha('')
      setMostrarSenha(false)
      aoEntrar(usuario)
    } catch (error) {
      setSenha('')
      setMostrarSenha(false)
      setErro(
        error instanceof TypeError
          ? 'Não foi possível conectar ao serviço. Tente novamente.'
          : error.message,
      )
    } finally {
      operacaoEmAndamento.current = false
      setEnviando(false)
    }
  }

  return (
    <section className="login" aria-labelledby="titulo-login">
      <h2 id="titulo-login">Entrar</h2>
      <p className="login-descricao">
        Use sua conta para acessar o painel de chamados.
      </p>

      <form
        className="formulario"
        onSubmit={enviar}
        aria-busy={enviando}
      >
        <div className="campo">
          <label htmlFor="login-email">E-mail</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="voce@empresa.com"
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={enviando}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="login-senha">Senha</label>

          <div className="login-senha">
            <input
              id="login-senha"
              name="senha"
              type={mostrarSenha ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              disabled={enviando}
              required
            />

            <button
              type="button"
              className="login-mostrar-senha"
              onClick={() => setMostrarSenha((atual) => !atual)}
              aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              aria-controls="login-senha"
              disabled={enviando}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
                {mostrarSenha && <path d="m3 3 18 18" />}
              </svg>
            </button>
          </div>
        </div>

        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}

        <button
          type="submit"
          className="botao-primario"
          disabled={enviando}
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </section>
  )
}