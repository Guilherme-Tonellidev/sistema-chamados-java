import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './PainelChamados'

vi.mock('./services/autenticacaoApi', () => ({
  obterCsrf: vi.fn(async () => ({
    headerName: 'X-CSRF-TOKEN',
    token: 'csrf-teste',
  })),
}))

const chamadoAberto = {
  id: 3,
  titulo: 'Impressora não imprime',
  descricao: 'A impressora não responde ao enviar documentos.',
  status: 'Aberto',
}

function resposta(dados, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => dados,
  }
}

function pagina(chamados, numero = 0, total = chamados.length) {
  const tamanho = 5
  const totalPaginas = Math.ceil(total / tamanho)

  return {
    chamados,
    pagina: numero,
    tamanho,
    totalElementos: total,
    totalPaginas,
    temProxima: numero + 1 < totalPaginas,
  }
}

let fetchMock

beforeEach(() => {
  fetchMock = vi.fn()
  fetchMock.mockResolvedValue(resposta(pagina([])))
  vi.stubGlobal('fetch', fetchMock)
})

describe('Interface de chamados', () => {
  it('lista os chamados e desabilita a navegação quando há uma única página', async () => {
    fetchMock.mockResolvedValue(
      resposta(pagina([chamadoAberto])),
    )

    render(<App />)

    expect(
      await screen.findByRole('heading', {
        name: chamadoAberto.titulo,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(chamadoAberto.descricao),
    ).toBeInTheDocument()

    expect(screen.getByText('Página 1 de 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()

    expect(
      screen.getByRole('button', {
        name: 'Iniciar atendimento: chamado #3',
      }),
    ).toBeEnabled()
  })

  it('mostra uma mensagem quando não há chamados', async () => {
    render(<App />)

    expect(
      await screen.findByText('Nenhum chamado encontrado nesta página.'),
    ).toBeInTheDocument()

    expect(screen.getByText('Nenhuma página')).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('permite tentar novamente após uma falha de conexão na listagem', async () => {
    const usuario = userEvent.setup()

    fetchMock
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue(resposta(pagina([chamadoAberto])))

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível conectar ao serviço. Tente novamente.',
    )

    await usuario.click(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    )

    expect(
      await screen.findByRole('heading', {
        name: chamadoAberto.titulo,
      }),
    ).toBeInTheDocument()

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('cadastra um chamado, limpa os campos e atualiza a lista', async () => {
    const usuario = userEvent.setup()

    fetchMock
      .mockResolvedValueOnce(resposta(pagina([])))
      .mockResolvedValueOnce(resposta(chamadoAberto, 201))
      .mockResolvedValue(resposta(pagina([chamadoAberto])))

    render(<App />)

    await screen.findByText('Nenhum chamado encontrado nesta página.')

    await usuario.type(
      screen.getByLabelText('Título'),
      `  ${chamadoAberto.titulo}  `,
    )
    await usuario.type(
      screen.getByLabelText('Descrição'),
      `  ${chamadoAberto.descricao}  `,
    )
    await usuario.click(
      screen.getByRole('button', { name: 'Cadastrar chamado' }),
    )

    expect(
      await screen.findByText(
        'Chamado #3 cadastrado com sucesso! Status inicial: Aberto.',
      ),
    ).toBeInTheDocument()

    expect(fetchMock).toHaveBeenCalledWith('/api/chamados', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': 'csrf-teste',
      },
      body: JSON.stringify({
        titulo: chamadoAberto.titulo,
        descricao: chamadoAberto.descricao,
      }),
    })

    expect(screen.getByLabelText('Título')).toHaveValue('')
    expect(screen.getByLabelText('Descrição')).toHaveValue('')

    expect(
      await screen.findByRole('heading', {
        name: chamadoAberto.titulo,
      }),
    ).toBeInTheDocument()
  })

  it('impede cadastro com campos contendo apenas espaços', async () => {
    const usuario = userEvent.setup()

    render(<App />)

    await screen.findByText('Nenhum chamado encontrado nesta página.')

    await usuario.type(screen.getByLabelText('Título'), '   ')
    await usuario.type(screen.getByLabelText('Descrição'), '   ')
    await usuario.click(
      screen.getByRole('button', { name: 'Cadastrar chamado' }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Preencha o título e a descrição.',
    )

    const cadastros = fetchMock.mock.calls.filter(
      ([, opcoes]) => opcoes?.method === 'POST',
    )

    expect(cadastros).toHaveLength(0)
    expect(screen.getByLabelText('Título')).toHaveValue('   ')
  })

  it('preserva os campos quando a API rejeita o cadastro', async () => {
    const usuario = userEvent.setup()

    fetchMock
      .mockResolvedValueOnce(resposta(pagina([])))
      .mockResolvedValueOnce(
        resposta(
          {
            status: 400,
            erro: 'Título inválido.',
            caminho: '/chamados',
          },
          400,
        ),
      )

    render(<App />)

    await screen.findByText('Nenhum chamado encontrado nesta página.')

    await usuario.type(
      screen.getByLabelText('Título'),
      chamadoAberto.titulo,
    )
    await usuario.type(
      screen.getByLabelText('Descrição'),
      chamadoAberto.descricao,
    )
    await usuario.click(
      screen.getByRole('button', { name: 'Cadastrar chamado' }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Título inválido.',
    )

    expect(screen.getByLabelText('Título')).toHaveValue(
      chamadoAberto.titulo,
    )
    expect(screen.getByLabelText('Descrição')).toHaveValue(
      chamadoAberto.descricao,
    )
    expect(
      screen.getByRole('button', { name: 'Cadastrar chamado' }),
    ).toBeEnabled()
  })

  it('avança a página e volta à primeira ao alterar o filtro', async () => {
    const usuario = userEvent.setup()

    const primeiros = Array.from({ length: 5 }, (_, indice) => ({
      id: indice + 1,
      titulo: `Chamado ${indice + 1}`,
      descricao: 'Solicitação de suporte.',
      status: 'Aberto',
    }))

    const resolvido = {
      id: 6,
      titulo: 'Chamado resolvido',
      descricao: 'Atendimento concluído.',
      status: 'Resolvido',
    }

    fetchMock
      .mockResolvedValueOnce(resposta(pagina(primeiros, 0, 6)))
      .mockResolvedValueOnce(resposta(pagina([resolvido], 1, 6)))
      .mockResolvedValue(resposta(pagina([resolvido])))

    render(<App />)

    await screen.findByText('Página 1 de 2')

    await usuario.click(
      screen.getByRole('button', { name: 'Próxima' }),
    )

    expect(
      await screen.findByText('Página 2 de 2'),
    ).toBeInTheDocument()

    const urlSegundaPagina = new URL(
      fetchMock.mock.calls[1][0],
      'http://localhost',
    )

    expect(urlSegundaPagina.searchParams.get('pagina')).toBe('1')
    expect(urlSegundaPagina.searchParams.get('tamanho')).toBe('5')

    await usuario.selectOptions(
      screen.getByLabelText('Filtrar por status'),
      'Resolvido',
    )

    expect(
      await screen.findByText('Página 1 de 1'),
    ).toBeInTheDocument()

    const urlFiltrada = new URL(
      fetchMock.mock.calls[2][0],
      'http://localhost',
    )

    expect(urlFiltrada.searchParams.get('pagina')).toBe('0')
    expect(urlFiltrada.searchParams.get('status')).toBe('Resolvido')
    expect(screen.getByLabelText('Filtrar por status')).toHaveValue(
      'Resolvido',
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(
      screen.getByRole('heading', { name: 'Chamado resolvido' }),
    ).toBeInTheDocument()
  })

  it('inicia atendimento e passa a oferecer a ação de resolver', async () => {
    const usuario = userEvent.setup()
    const emAtendimento = {
      ...chamadoAberto,
      status: 'Em atendimento',
    }

    fetchMock
      .mockResolvedValueOnce(resposta(pagina([chamadoAberto])))
      .mockResolvedValueOnce(resposta(emAtendimento))
      .mockResolvedValue(resposta(pagina([emAtendimento])))

    render(<App />)

    await usuario.click(
      await screen.findByRole('button', {
        name: 'Iniciar atendimento: chamado #3',
      }),
    )

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/chamados/3/atendimento',
      {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: {
          'X-CSRF-TOKEN': 'csrf-teste',
        },
      },
    )

    expect(
      await screen.findByRole('button', {
        name: 'Resolver chamado: chamado #3',
      }),
    ).toBeEnabled()

    const item = screen.getByRole('listitem')

    expect(within(item).getByText('Em atendimento')).toBeInTheDocument()
    expect(
      within(item).queryByRole('button', { name: /Iniciar atendimento/ }),
    ).not.toBeInTheDocument()

    expect(
      screen.getByText(
        'Atendimento iniciado com sucesso! Solicitação #3.',
      ),
    ).toBeInTheDocument()
  })

  it('resolve um chamado e remove os botões de alteração', async () => {
    const usuario = userEvent.setup()
    const emAtendimento = {
      ...chamadoAberto,
      status: 'Em atendimento',
    }
    const resolvido = {
      ...chamadoAberto,
      status: 'Resolvido',
    }

    fetchMock
      .mockResolvedValueOnce(resposta(pagina([emAtendimento])))
      .mockResolvedValueOnce(resposta(resolvido))
      .mockResolvedValue(resposta(pagina([resolvido])))

    render(<App />)

    await usuario.click(
      await screen.findByRole('button', {
        name: 'Resolver chamado: chamado #3',
      }),
    )

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/chamados/3/resolucao',
      {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: {
          'X-CSRF-TOKEN': 'csrf-teste',
        },
      },
    )

    await waitFor(() => {
      const item = screen.getByRole('listitem')
      expect(within(item).getByText('Resolvido')).toBeInTheDocument()
    })

    expect(
      within(screen.getByRole('listitem')).queryByRole('button'),
    ).not.toBeInTheDocument()

    expect(
      screen.getByText('Chamado resolvido com sucesso! Solicitação #3.'),
    ).toBeInTheDocument()
  })

  it('mostra o erro da API sem indicar sucesso na mudança de status', async () => {
    const usuario = userEvent.setup()

    fetchMock
      .mockResolvedValueOnce(resposta(pagina([chamadoAberto])))
      .mockResolvedValueOnce(
        resposta(
          {
            status: 409,
            erro: 'Não é possível iniciar atendimento neste status.',
            caminho: '/chamados/3/atendimento',
          },
          409,
        ),
      )

    render(<App />)

    await usuario.click(
      await screen.findByRole('button', {
        name: 'Iniciar atendimento: chamado #3',
      }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não é possível iniciar atendimento neste status.',
    )

    expect(
      screen.queryByText(
        'Atendimento iniciado com sucesso! Solicitação #3.',
      ),
    ).not.toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: 'Iniciar atendimento: chamado #3',
      }),
    ).toBeEnabled()

    expect(
      within(screen.getByRole('listitem')).getByText('Aberto'),
    ).toBeInTheDocument()
  })
})