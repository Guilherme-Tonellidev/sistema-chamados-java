import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { consultarSessao, entrar, sair } from './services/autenticacaoApi'

vi.mock('./services/autenticacaoApi', () => ({
  consultarSessao: vi.fn(),
  entrar: vi.fn(),
  sair: vi.fn(),
}))

vi.mock('./PainelChamados', () => ({
  default: function PainelSimulado() {
    return <h2>Painel de chamados autenticado</h2>
  },
}))

const usuario = {
  id: 1,
  nome: 'Usuario Teste',
  email: 'teste@example.com',
  ativo: true,
}

const senhaTeste = 'SenhaDeTeste-2026!'

beforeEach(() => {
  vi.mocked(consultarSessao).mockReset()
  vi.mocked(entrar).mockReset()
  vi.mocked(sair).mockReset()

  vi.mocked(consultarSessao).mockResolvedValue(null)
  localStorage.clear()
})

describe('Autenticação na interface', () => {
  it('mostra o login quando não existe sessão', async () => {
    render(<App />)

    expect(
      await screen.findByRole('heading', { name: 'Entrar', exact: true }),
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
      screen.getByRole('button', { name: 'Sair', exact: true }),
    ).toBeEnabled()

    expect(screen.queryByLabelText('Senha', { exact: true })).toBeNull()
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
      screen.getByRole('button', { name: 'Entrar', exact: true }),
    )

    expect(entrar).toHaveBeenCalledWith(usuario.email, senhaTeste)

    expect(
      await screen.findByRole('heading', {
        name: 'Painel de chamados autenticado',
      }),
    ).toBeInTheDocument()

    await pessoa.click(
      screen.getByRole('button', { name: 'Sair', exact: true }),
    )

    expect(
      await screen.findByRole('heading', { name: 'Entrar', exact: true }),
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
      screen.getByRole('button', { name: 'Entrar', exact: true }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'E-mail ou senha inválidos.',
    )

    expect(screen.getByLabelText('E-mail', { exact: true })).toHaveValue(
      usuario.email,
    )
    expect(screen.getByLabelText('Senha', { exact: true })).toHaveValue('')
    expect(
      screen.getByRole('button', { name: 'Entrar', exact: true }),
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