import { useRef, useState } from 'react'
import { cadastrarUsuario } from '../services/autenticacaoApi'

export default function FormularioCadastroUsuario({
  aoConcluir,
  aoVoltar,
}) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
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

    if (!nome.trim() || !email.trim() || !senha || !confirmacao) {
      setErro('Preencha todos os campos.')
      return
    }

    if (Array.from(senha).length < 8) {
        setErro('A senha deve ter pelo menos 8 caracteres.')
        return
    }

    if (new TextEncoder().encode(senha).length > 72) {
      setErro(
        'A senha ultrapassa o limite permitido. Use uma senha menor; letras acentuadas e emojis ocupam mais espaço.',
      )
      return
    }

    if (senha !== confirmacao) {
      setErro('A confirmação de senha deve ser igual à senha.')
      return
    }

    operacaoEmAndamento.current = true
    setEnviando(true)

    try {
      await cadastrarUsuario({ nome, email, senha })
      setSenha('')
      setConfirmacao('')
      aoConcluir()
    } catch (error) {
      setSenha('')
      setConfirmacao('')
      setMostrarSenha(false)
      setErro(
        error instanceof TypeError
          ? 'Não foi possível confirmar o cadastro por uma falha de conexão. Tente entrar com os dados informados antes de cadastrar novamente.'
          : error.message,
      )
    } finally {
      operacaoEmAndamento.current = false
      setEnviando(false)
    }
  }

  return (
    <section
      className="login cadastro-usuario"
      aria-labelledby="titulo-cadastro-usuario"
    >
      <h2 id="titulo-cadastro-usuario">Criar conta</h2>

      <p className="login-descricao">
        Cadastre-se para abrir e acompanhar seus chamados.
      </p>

      <form
        className="formulario"
        onSubmit={enviar}
        aria-busy={enviando}
      >
        <div className="campo">
          <label htmlFor="cadastro-nome">Nome</label>
          <input
            id="cadastro-nome"
            name="nome"
            type="text"
            autoComplete="name"
            maxLength={100}
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            disabled={enviando}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="cadastro-email">E-mail</label>
          <input
            id="cadastro-email"
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

        <div className="cadastro-senhas">
          <div className="campo">
            <label htmlFor="cadastro-senha">Senha</label>

            <div className="login-senha">
              <input
                id="cadastro-senha"
                name="senha"
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="new-password"
                aria-describedby="cadastro-orientacao-senha"
                placeholder="Crie uma senha"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                disabled={enviando}
                required
              />

              <button
                type="button"
                className="login-mostrar-senha"
                onClick={() => setMostrarSenha((atual) => !atual)}
                aria-label={
                  mostrarSenha ? 'Ocultar senhas' : 'Mostrar senhas'
                }
                aria-controls="cadastro-senha cadastro-confirmacao"
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

          <div className="campo">
            <label htmlFor="cadastro-confirmacao">Confirmar senha</label>
            <input
              id="cadastro-confirmacao"
              name="confirmacao"
              type={mostrarSenha ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repita a senha"
              value={confirmacao}
              onChange={(event) => setConfirmacao(event.target.value)}
              disabled={enviando}
              required
            />
          </div>

          <p
            id="cadastro-orientacao-senha"
            className="acesso-ajuda"
          >
            Use pelo menos 8 caracteres. Prefira uma senha longa e exclusiva.
          </p>
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
          {enviando ? 'Criando conta…' : 'Cadastrar'}
        </button>
      </form>

      <p className="acesso-alternativa">
        Já tem conta?{' '}
        <button
          type="button"
          className="acesso-link"
          onClick={aoVoltar}
          disabled={enviando}
        >
          Voltar para entrar
        </button>
      </p>
    </section>
  )
}