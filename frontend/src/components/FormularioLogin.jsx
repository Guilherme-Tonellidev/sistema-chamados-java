import { useRef, useState } from 'react'
import { entrar } from '../services/autenticacaoApi'

export default function FormularioLogin({ aoEntrar }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
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
      aoEntrar(usuario)
    } catch (error) {
      setSenha('')
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
    <section className="conteudo login" aria-labelledby="titulo-login">
      <h2 id="titulo-login">Entrar</h2>
      <p className="subtitulo">
        Use sua conta para acessar o painel de chamados.
      </p>

      <form className="formulario" onSubmit={enviar} aria-busy={enviando}>
        <div className="campo">
          <label htmlFor="login-email">E-mail</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={enviando}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="login-senha">Senha</label>
          <input
            id="login-senha"
            name="senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            disabled={enviando}
            required
          />
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