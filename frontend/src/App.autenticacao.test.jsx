import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import {
  consultarSessao,
  entrar,
  sair,
  cadastrarUsuario,
} from './services/autenticacaoApi'

vi.mock('./services/autenticacaoApi', () => ({
  consultarSessao: vi.fn(),
  entrar: vi.fn(),
  sair: vi.fn(),
  cadastrarUsuario: vi.fn(),
}))

vi.mock('./PainelChamados', () => ({
  default: function PainelChamadosSimulado({ usuario, aoSair }) {
    return (
      <div>
        <h2>Painel de chamados autenticado</h2>
        <p>{usuario.nome}</p>
        <button type="button" onClick={aoSair}>
          Sair
        </button>
      </div>
    )
  },
}))

const usuario = {
  id: 1,
  nome: 'Usuario Teste',
  email: 'teste@example.com',
  ativo: true,
  perfil: 'SOLICITANTE',
}

const senhaTeste = 'SenhaDeTeste-2026!'

beforeEach(() => {
  vi.mocked(consultarSessao).mockReset()
  vi.mocked(entrar).mockReset()
  vi.mocked(sair).mockReset()
  vi.mocked(cadastrarUsuario).mockReset()

  vi.mocked(consultarSessao).mockResolvedValue(null)
  localStorage.clear()
})

describe('Autenticação na interface', () => {
  it('mostra o login quando não existe sessão', async () => {
    render(<App />)

    expect(
      await screen.findByRole('heading', {
        name: 'Entrar',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('heading', {
        name: 'Painel de chamados autenticado',
      }),
    ).not.toBeInTheDocument()
  })

  it('recupera a sessão existente e mostra o painel', async () => {
    vi.mocked(consultarSessao).mockResolvedValue(usuario)

    render(<App />)

    expect(
      await screen.findByRole('heading', {
        name: 'Painel de chamados autenticado',
      }),
    ).toBeInTheDocument()

    expect(screen.getByText(usuario.nome)).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: 'Sair',
        exact: true,
      }),
    ).toBeEnabled()

    expect(
      screen.queryByLabelText('Senha', { exact: true }),
    ).toBeNull()
  })

  it('entra com as credenciais e sai da sessão', async () => {
    const pessoa = userEvent.setup()

    vi.mocked(entrar).mockResolvedValue(usuario)
    vi.mocked(sair).mockResolvedValue(undefined)

    render(<App />)

    await pessoa.type(
      await screen.findByLabelText('E-mail', { exact: true }),
      usuario.email,
    )

    await pessoa.type(
      screen.getByLabelText('Senha', { exact: true }),
      senhaTeste,
    )

    await pessoa.click(
      screen.getByRole('button', {
        name: 'Entrar',
        exact: true,
      }),
    )

    expect(entrar).toHaveBeenCalledWith(usuario.email, senhaTeste)

    expect(
      await screen.findByRole('heading', {
        name: 'Painel de chamados autenticado',
      }),
    ).toBeInTheDocument()

    await pessoa.click(
      screen.getByRole('button', {
        name: 'Sair',
        exact: true,
      }),
    )

    expect(
      await screen.findByRole('heading', {
        name: 'Entrar',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(sair).toHaveBeenCalledTimes(1)

    expect(
      screen.queryByRole('heading', {
        name: 'Painel de chamados autenticado',
      }),
    ).not.toBeInTheDocument()
  })

  it('mostra a rejeição do login e limpa somente a senha', async () => {
    const pessoa = userEvent.setup()

    vi.mocked(entrar).mockRejectedValue(
      new Error('E-mail ou senha inválidos.'),
    )

    render(<App />)

    await pessoa.type(
      await screen.findByLabelText('E-mail', { exact: true }),
      usuario.email,
    )

    await pessoa.type(
      screen.getByLabelText('Senha', { exact: true }),
      senhaTeste,
    )

    await pessoa.click(
      screen.getByRole('button', {
        name: 'Entrar',
        exact: true,
      }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'E-mail ou senha inválidos.',
    )

    expect(
      screen.getByLabelText('E-mail', { exact: true }),
    ).toHaveValue(usuario.email)

    expect(
      screen.getByLabelText('Senha', { exact: true }),
    ).toHaveValue('')

    expect(
      screen.getByRole('button', {
        name: 'Entrar',
        exact: true,
      }),
    ).toBeEnabled()
  })

  it('permite consultar novamente a sessão após falha de conexão', async () => {
    const pessoa = userEvent.setup()

    vi.mocked(consultarSessao)
      .mockRejectedValueOnce(new TypeError('Falha de conexão'))
      .mockResolvedValueOnce(usuario)

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível conectar ao serviço.',
    )

    await pessoa.click(
      screen.getByRole('button', {
        name: 'Verificar sessão novamente',
      }),
    )

    expect(
      await screen.findByRole('heading', {
        name: 'Painel de chamados autenticado',
      }),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(consultarSessao).toHaveBeenCalledTimes(2)
    })
  })
})

async function abrirCadastroConta(pessoa) {
  await pessoa.click(
    await screen.findByRole('button', {
      name: 'Criar conta',
      exact: true,
    }),
  )

  await screen.findByRole('heading', {
    name: 'Criar conta',
    exact: true,
  })
}

async function preencherConta(
  pessoa,
  senha = 'Teste123!',
  confirmacao = senha,
) {
  await pessoa.type(
    screen.getByLabelText('Nome', { exact: true }),
    'Nova Pessoa',
  )

  await pessoa.type(
    screen.getByLabelText('E-mail', { exact: true }),
    'nova@example.com',
  )

  await pessoa.type(
    screen.getByLabelText('Senha', { exact: true }),
    senha,
  )

  await pessoa.type(
    screen.getByLabelText('Confirmar senha', { exact: true }),
    confirmacao,
  )
}

async function enviarCadastroConta(pessoa) {
  await pessoa.click(
    screen.getByRole('button', {
      name: 'Cadastrar',
      exact: true,
    }),
  )
}

describe('Cadastro de conta na interface', () => {
  it('abre o cadastro e permite voltar ao login sem cadastrar', async () => {
    const pessoa = userEvent.setup()

    render(<App />)

    await abrirCadastroConta(pessoa)

    expect(
      screen.getAllByRole('button', {
        name: 'Voltar para entrar',
        exact: true,
      }),
    ).toHaveLength(1)

    await pessoa.click(
      screen.getByRole('button', {
        name: 'Voltar para entrar',
        exact: true,
      }),
    )

    expect(
      await screen.findByRole('heading', {
        name: 'Entrar',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(cadastrarUsuario).not.toHaveBeenCalled()
    expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument()
  })

  it('aceita oito caracteres e retorna ao login sem entrar automaticamente', async () => {
    const pessoa = userEvent.setup()

    vi.mocked(cadastrarUsuario).mockResolvedValue({
      id: 2,
      nome: 'Nova Pessoa',
      email: 'nova@example.com',
      ativo: true,
      perfil: 'SOLICITANTE',
    })

    render(<App />)

    await abrirCadastroConta(pessoa)
    await preencherConta(pessoa)
    await enviarCadastroConta(pessoa)

    expect(
      await screen.findByRole('heading', {
        name: 'Entrar',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(screen.getByRole('status')).toHaveTextContent(
      'Conta criada com sucesso! Entre com seu e-mail e senha.',
    )

    expect(cadastrarUsuario).toHaveBeenCalledTimes(1)

    expect(cadastrarUsuario).toHaveBeenCalledWith({
      nome: 'Nova Pessoa',
      email: 'nova@example.com',
      senha: 'Teste123!',
    })

    expect(entrar).not.toHaveBeenCalled()

    expect(
      screen.getByLabelText('Senha', { exact: true }),
    ).toHaveValue('')

    expect(
      screen.queryByRole('heading', {
        name: 'Painel de chamados autenticado',
      }),
    ).not.toBeInTheDocument()
  })

  it.each([
    {
      caso: 'senha com sete caracteres',
      senha: 'Teste12',
      confirmacao: 'Teste12',
      mensagem: 'A senha deve ter pelo menos 8 caracteres.',
    },
    {
      caso: 'sete emojis, contando caracteres Unicode',
      senha: '😀'.repeat(7),
      confirmacao: '😀'.repeat(7),
      mensagem: 'A senha deve ter pelo menos 8 caracteres.',
    },
    {
      caso: 'confirmação diferente da senha',
      senha: 'Teste123!',
      confirmacao: 'Outra123!',
      mensagem: 'A confirmação de senha deve ser igual à senha.',
    },
    {
      caso: 'senha acima de 72 bytes em UTF-8',
      senha: 'á'.repeat(37),
      confirmacao: 'á'.repeat(37),
      mensagem: 'A senha ultrapassa o limite permitido.',
    },
  ])('impede cadastro com $caso', async ({
    senha,
    confirmacao,
    mensagem,
  }) => {
    const pessoa = userEvent.setup()

    render(<App />)

    await abrirCadastroConta(pessoa)
    await preencherConta(pessoa, senha, confirmacao)
    await enviarCadastroConta(pessoa)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      mensagem,
    )

    expect(cadastrarUsuario).not.toHaveBeenCalled()

    expect(
      screen.getByRole('heading', {
        name: 'Criar conta',
        exact: true,
      }),
    ).toBeInTheDocument()
  })

  it('mostra e-mail duplicado, preserva nome e e-mail e limpa as senhas', async () => {
    const pessoa = userEvent.setup()

    vi.mocked(cadastrarUsuario).mockRejectedValue(
      new Error('E-mail já cadastrado.'),
    )

    render(<App />)

    await abrirCadastroConta(pessoa)
    await preencherConta(pessoa)
    await enviarCadastroConta(pessoa)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'E-mail já cadastrado.',
    )

    expect(
      screen.getByLabelText('Nome', { exact: true }),
    ).toHaveValue('Nova Pessoa')

    expect(
      screen.getByLabelText('E-mail', { exact: true }),
    ).toHaveValue('nova@example.com')

    expect(
      screen.getByLabelText('Senha', { exact: true }),
    ).toHaveValue('')

    expect(
      screen.getByLabelText('Confirmar senha', { exact: true }),
    ).toHaveValue('')

    expect(
      screen.getByRole('button', {
        name: 'Cadastrar',
        exact: true,
      }),
    ).toBeEnabled()

    expect(entrar).not.toHaveBeenCalled()
  })

  it('mostra e oculta os dois campos de senha sem enviar o formulário', async () => {
    const pessoa = userEvent.setup()

    render(<App />)

    await abrirCadastroConta(pessoa)
    await preencherConta(pessoa)

    const senha = screen.getByLabelText('Senha', {
      exact: true,
    })

    const confirmacao = screen.getByLabelText('Confirmar senha', {
      exact: true,
    })

    expect(senha).toHaveAttribute('type', 'password')
    expect(confirmacao).toHaveAttribute('type', 'password')

    await pessoa.click(
      screen.getByRole('button', {
        name: 'Mostrar senhas',
        exact: true,
      }),
    )

    expect(senha).toHaveAttribute('type', 'text')
    expect(confirmacao).toHaveAttribute('type', 'text')

    await pessoa.click(
      screen.getByRole('button', {
        name: 'Ocultar senhas',
        exact: true,
      }),
    )

    expect(senha).toHaveAttribute('type', 'password')
    expect(confirmacao).toHaveAttribute('type', 'password')
    expect(cadastrarUsuario).not.toHaveBeenCalled()
  })
})