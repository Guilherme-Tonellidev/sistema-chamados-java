import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './PainelChamados'

const chamadoAlta = {
  id: 1,
  titulo: 'Servidor indisponível',
  descricao: 'Não é possível acessar o servidor.',
  status: 'Aberto',
  prioridade: 'Alta',
}

const chamadoBaixa = {
  id: 2,
  titulo: 'Ajustar monitor',
  descricao: 'Ajustar a posição do monitor.',
  status: 'Aberto',
  prioridade: 'Baixa',
}

const nomesStatus = {
  '': 'Todos',
  Aberto: 'Abertos',
  'Em atendimento': 'Em atendimento',
  Resolvido: 'Resolvidos',
}

function resposta(dados) {
  return {
    ok: true,
    status: 200,
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

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function botaoStatus(valor) {
  const grupo = screen.getByRole('group', {
    name: 'Filtrar por status',
  })

  return within(grupo).getByRole('button', {
    name: nomesStatus[valor],
    exact: true,
  })
}

function conferirFiltros(status, prioridade) {
  expect(botaoStatus(status)).toHaveAttribute('aria-pressed', 'true')

  for (const valor of Object.keys(nomesStatus)) {
    if (valor !== status) {
      expect(botaoStatus(valor)).toHaveAttribute('aria-pressed', 'false')
    }
  }

  expect(
    screen.getByLabelText('Filtrar por prioridade'),
  ).toHaveValue(prioridade)
}

async function alterarFiltro(usuario, nome, valor) {
  if (nome === 'status') {
    await usuario.click(botaoStatus(valor))
  } else {
    await usuario.selectOptions(
      screen.getByLabelText('Filtrar por prioridade'),
      valor,
    )
  }
}

function ultimaUrl() {
  const ultimaChamada = fetchMock.mock.calls.at(-1)

  return new URL(ultimaChamada[0], 'http://localhost')
}

async function aguardarConsulta(quantidadeEsperada) {
  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledTimes(quantidadeEsperada)

    for (const valor of Object.keys(nomesStatus)) {
      expect(botaoStatus(valor)).toBeEnabled()
    }

    expect(
      screen.getByLabelText('Filtrar por prioridade'),
    ).toBeEnabled()
  })
}

function tabela() {
  return screen.getByRole('table', {
    name: 'Chamados da página atual',
  })
}

describe('Filtros de status e prioridade', () => {
  it('envia a prioridade para a API sem alterar a prioridade do cadastro', async () => {
    const usuario = userEvent.setup()

    fetchMock
      .mockResolvedValueOnce(
        resposta(pagina([chamadoAlta, chamadoBaixa])),
      )
      .mockResolvedValue(
        resposta(pagina([chamadoAlta])),
      )

    render(<App />)

    await aguardarConsulta(1)

    expect(
      within(tabela()).getByRole('button', {
        name: chamadoBaixa.titulo,
      }),
    ).toBeInTheDocument()

    expect(ultimaUrl().searchParams.has('prioridade')).toBe(false)

    await usuario.click(
      screen.getByRole('button', { name: /Criar chamado/ }),
    )

    const cadastro = within(
      screen.getByRole('region', { name: 'Novo chamado' }),
    )

    expect(cadastro.getByLabelText('Prioridade')).toHaveValue('Normal')

    await alterarFiltro(usuario, 'prioridade', 'Alta')
    await aguardarConsulta(2)

    const url = ultimaUrl()

    expect(url.pathname).toBe('/api/chamados/paginados')
    expect(url.searchParams.get('prioridade')).toBe('Alta')
    expect(url.searchParams.get('pagina')).toBe('0')
    expect(url.searchParams.get('tamanho')).toBe('5')
    expect(url.searchParams.has('status')).toBe(false)

    expect(
      within(tabela()).getByRole('button', {
        name: chamadoAlta.titulo,
      }),
    ).toBeInTheDocument()

    expect(
      within(tabela()).queryByRole('button', {
        name: chamadoBaixa.titulo,
      }),
    ).not.toBeInTheDocument()

    // Uma linha de cabeçalho e uma linha de chamado.
    expect(within(tabela()).getAllByRole('row')).toHaveLength(2)

    conferirFiltros('', 'Alta')
    expect(cadastro.getByLabelText('Prioridade')).toHaveValue('Normal')
  })

  it('envia status e prioridade juntos e apresenta uma combinação sem resultados', async () => {
    const usuario = userEvent.setup()

    fetchMock
      .mockResolvedValueOnce(resposta(pagina([chamadoAlta])))
      .mockResolvedValueOnce(resposta(pagina([chamadoAlta])))
      .mockResolvedValue(resposta(pagina([])))

    render(<App />)

    await aguardarConsulta(1)

    await alterarFiltro(usuario, 'prioridade', 'Alta')
    await aguardarConsulta(2)

    await alterarFiltro(usuario, 'status', 'Resolvido')
    await aguardarConsulta(3)

    const url = ultimaUrl()

    expect(url.searchParams.get('status')).toBe('Resolvido')
    expect(url.searchParams.get('prioridade')).toBe('Alta')
    expect(url.searchParams.get('pagina')).toBe('0')

    conferirFiltros('Resolvido', 'Alta')

    expect(
      screen.getByText('Nenhum chamado encontrado nesta página.'),
    ).toBeInTheDocument()

    expect(screen.getByText('Nenhuma página')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
  })

  it.each([
    {
      nome: 'prioridade',
      valor: 'Baixa',
      statusEsperado: 'Aberto',
      prioridadeEsperada: 'Baixa',
    },
    {
      nome: 'status',
      valor: 'Resolvido',
      statusEsperado: 'Resolvido',
      prioridadeEsperada: 'Alta',
    },
  ])(
    'volta à primeira página ao alterar $nome e preserva o outro filtro',
    async ({
      nome,
      valor,
      statusEsperado,
      prioridadeEsperada,
    }) => {
      const usuario = userEvent.setup()

      const primeiros = Array.from({ length: 5 }, (_, indice) => ({
        ...chamadoAlta,
        id: indice + 1,
        titulo: `Solicitação ${indice + 1}`,
      }))

      const sexto = {
        ...chamadoAlta,
        id: 6,
        titulo: 'Solicitação 6',
      }

      const resultadoFiltrado = {
        ...chamadoAlta,
        id: 7,
        titulo: 'Resultado após alterar o filtro',
        status: statusEsperado,
        prioridade: prioridadeEsperada,
      }

      fetchMock
        .mockResolvedValueOnce(resposta(pagina(primeiros, 0, 6)))
        .mockResolvedValueOnce(resposta(pagina(primeiros, 0, 6)))
        .mockResolvedValueOnce(resposta(pagina(primeiros, 0, 6)))
        .mockResolvedValueOnce(resposta(pagina([sexto], 1, 6)))
        .mockResolvedValue(resposta(pagina([resultadoFiltrado])))

      render(<App />)

      await aguardarConsulta(1)

      await alterarFiltro(usuario, 'status', 'Aberto')
      await aguardarConsulta(2)

      await alterarFiltro(usuario, 'prioridade', 'Alta')
      await aguardarConsulta(3)

      await usuario.click(
        screen.getByRole('button', { name: 'Próxima' }),
      )
      await aguardarConsulta(4)

      expect(screen.getByText('Página 2 de 2')).toBeInTheDocument()

      const urlSegundaPagina = ultimaUrl()

      expect(urlSegundaPagina.searchParams.get('pagina')).toBe('1')
      expect(urlSegundaPagina.searchParams.get('status')).toBe('Aberto')
      expect(urlSegundaPagina.searchParams.get('prioridade')).toBe('Alta')

      await alterarFiltro(usuario, nome, valor)
      await aguardarConsulta(5)

      const url = ultimaUrl()

      expect(url.searchParams.get('pagina')).toBe('0')
      expect(url.searchParams.get('status')).toBe(statusEsperado)
      expect(url.searchParams.get('prioridade')).toBe(prioridadeEsperada)

      conferirFiltros(statusEsperado, prioridadeEsperada)

      expect(screen.getByText('Página 1 de 1')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Anterior' }),
      ).toBeDisabled()

      expect(
        within(tabela()).getByRole('button', {
          name: resultadoFiltrado.titulo,
        }),
      ).toBeInTheDocument()

      expect(
        within(tabela()).queryByRole('button', {
          name: sexto.titulo,
        }),
      ).not.toBeInTheDocument()

      expect(within(tabela()).getAllByRole('row')).toHaveLength(2)
    },
  )

  it.each([
    {
      nome: 'prioridade',
      parametroRemovido: 'prioridade',
      parametroMantido: 'status',
      valorMantido: 'Aberto',
      statusEsperado: 'Aberto',
      prioridadeEsperada: '',
    },
    {
      nome: 'status',
      parametroRemovido: 'status',
      parametroMantido: 'prioridade',
      valorMantido: 'Alta',
      statusEsperado: '',
      prioridadeEsperada: 'Alta',
    },
  ])(
    'remove o filtro de $nome sem remover o outro',
    async ({
      nome,
      parametroRemovido,
      parametroMantido,
      valorMantido,
      statusEsperado,
      prioridadeEsperada,
    }) => {
      const usuario = userEvent.setup()

      fetchMock.mockResolvedValue(resposta(pagina([chamadoAlta])))

      render(<App />)

      await aguardarConsulta(1)

      await alterarFiltro(usuario, 'status', 'Aberto')
      await aguardarConsulta(2)

      await alterarFiltro(usuario, 'prioridade', 'Alta')
      await aguardarConsulta(3)

      expect(ultimaUrl().searchParams.get('status')).toBe('Aberto')
      expect(ultimaUrl().searchParams.get('prioridade')).toBe('Alta')

      await alterarFiltro(usuario, nome, '')
      await aguardarConsulta(4)

      const url = ultimaUrl()

      expect(url.searchParams.has(parametroRemovido)).toBe(false)
      expect(url.searchParams.get(parametroMantido)).toBe(valorMantido)
      expect(url.searchParams.get('pagina')).toBe('0')

      conferirFiltros(statusEsperado, prioridadeEsperada)

      expect(
        within(tabela()).getByRole('button', {
          name: chamadoAlta.titulo,
        }),
      ).toBeInTheDocument()
    },
  )
})