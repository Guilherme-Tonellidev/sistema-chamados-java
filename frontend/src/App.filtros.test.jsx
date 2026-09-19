import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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

function ultimaUrl() {
  const chamadas = fetchMock.mock.calls
  const ultimaChamada = chamadas[chamadas.length - 1]

  return new URL(ultimaChamada[0], 'http://localhost')
}

async function aguardarConsulta(quantidadeEsperada) {
  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledTimes(quantidadeEsperada)
    expect(
      screen.getByLabelText('Filtrar por status'),
    ).toBeEnabled()
    expect(
      screen.getByLabelText('Filtrar por prioridade'),
    ).toBeEnabled()
  })
}

describe('Filtros de status e prioridade', () => {
  it('envia a prioridade para a API e apresenta o resultado recebido', async () => {
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
      screen.getByRole('heading', { name: chamadoBaixa.titulo }),
    ).toBeInTheDocument()

    expect(ultimaUrl().searchParams.has('prioridade')).toBe(false)

    await usuario.selectOptions(
      screen.getByLabelText('Filtrar por prioridade'),
      'Alta',
    )

    await aguardarConsulta(2)

    const url = ultimaUrl()

    expect(url.pathname).toBe('/api/chamados/paginados')
    expect(url.searchParams.get('prioridade')).toBe('Alta')
    expect(url.searchParams.get('pagina')).toBe('0')
    expect(url.searchParams.get('tamanho')).toBe('5')
    expect(url.searchParams.has('status')).toBe(false)

    expect(
      screen.getByRole('heading', { name: chamadoAlta.titulo }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: chamadoBaixa.titulo }),
    ).not.toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(1)

    // O filtro da lista não altera a prioridade do formulário.
    expect(
      screen.getByRole('combobox', { name: 'Prioridade', exact: true }),
    ).toHaveValue('Normal')
  })

  it('envia status e prioridade juntos e apresenta uma combinação sem resultados', async () => {
    const usuario = userEvent.setup()

    fetchMock
      .mockResolvedValueOnce(
        resposta(pagina([chamadoAlta])),
      )
      .mockResolvedValueOnce(
        resposta(pagina([chamadoAlta])),
      )
      .mockResolvedValue(
        resposta(pagina([])),
      )

    render(<App />)

    await aguardarConsulta(1)

    await usuario.selectOptions(
      screen.getByLabelText('Filtrar por prioridade'),
      'Alta',
    )

    await aguardarConsulta(2)

    await usuario.selectOptions(
      screen.getByLabelText('Filtrar por status'),
      'Resolvido',
    )

    await aguardarConsulta(3)

    const url = ultimaUrl()

    expect(url.searchParams.get('status')).toBe('Resolvido')
    expect(url.searchParams.get('prioridade')).toBe('Alta')
    expect(url.searchParams.get('pagina')).toBe('0')

    expect(
      screen.getByLabelText('Filtrar por status'),
    ).toHaveValue('Resolvido')
    expect(
      screen.getByLabelText('Filtrar por prioridade'),
    ).toHaveValue('Alta')

    expect(
      screen.getByText('Nenhum chamado encontrado nesta página.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Nenhuma página')).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it.each([
    {
      nome: 'prioridade',
      rotulo: 'Filtrar por prioridade',
      valor: 'Baixa',
      statusEsperado: 'Aberto',
      prioridadeEsperada: 'Baixa',
    },
    {
      nome: 'status',
      rotulo: 'Filtrar por status',
      valor: 'Resolvido',
      statusEsperado: 'Resolvido',
      prioridadeEsperada: 'Alta',
    },
  ])(
    'volta à primeira página ao alterar $nome e preserva o outro filtro',
    async ({
      rotulo,
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
        .mockResolvedValueOnce(
          resposta(pagina(primeiros, 0, 6)),
        )
        .mockResolvedValueOnce(
          resposta(pagina(primeiros, 0, 6)),
        )
        .mockResolvedValueOnce(
          resposta(pagina(primeiros, 0, 6)),
        )
        .mockResolvedValueOnce(
          resposta(pagina([sexto], 1, 6)),
        )
        .mockResolvedValue(
          resposta(pagina([resultadoFiltrado])),
        )

      render(<App />)

      await aguardarConsulta(1)

      await usuario.selectOptions(
        screen.getByLabelText('Filtrar por status'),
        'Aberto',
      )

      await aguardarConsulta(2)

      await usuario.selectOptions(
        screen.getByLabelText('Filtrar por prioridade'),
        'Alta',
      )

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

      await usuario.selectOptions(
        screen.getByLabelText(rotulo),
        valor,
      )

      await aguardarConsulta(5)

      const url = ultimaUrl()

      expect(url.searchParams.get('pagina')).toBe('0')
      expect(url.searchParams.get('status')).toBe(statusEsperado)
      expect(url.searchParams.get('prioridade')).toBe(prioridadeEsperada)

      expect(
        screen.getByLabelText('Filtrar por status'),
      ).toHaveValue(statusEsperado)
      expect(
        screen.getByLabelText('Filtrar por prioridade'),
      ).toHaveValue(prioridadeEsperada)

      expect(screen.getByText('Página 1 de 1')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Anterior' }),
      ).toBeDisabled()
      expect(
        screen.getByRole('heading', {
          name: resultadoFiltrado.titulo,
        }),
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('heading', { name: sexto.titulo }),
      ).not.toBeInTheDocument()
    },
  )

  it.each([
    {
      nome: 'prioridade',
      rotulo: 'Filtrar por prioridade',
      parametroRemovido: 'prioridade',
      parametroMantido: 'status',
      valorMantido: 'Aberto',
      rotuloMantido: 'Filtrar por status',
    },
    {
      nome: 'status',
      rotulo: 'Filtrar por status',
      parametroRemovido: 'status',
      parametroMantido: 'prioridade',
      valorMantido: 'Alta',
      rotuloMantido: 'Filtrar por prioridade',
    },
  ])(
    'remove o filtro de $nome sem remover o outro',
    async ({
      rotulo,
      parametroRemovido,
      parametroMantido,
      valorMantido,
      rotuloMantido,
    }) => {
      const usuario = userEvent.setup()

      fetchMock.mockResolvedValue(
        resposta(pagina([chamadoAlta])),
      )

      render(<App />)

      await aguardarConsulta(1)

      await usuario.selectOptions(
        screen.getByLabelText('Filtrar por status'),
        'Aberto',
      )

      await aguardarConsulta(2)

      await usuario.selectOptions(
        screen.getByLabelText('Filtrar por prioridade'),
        'Alta',
      )

      await aguardarConsulta(3)

      expect(ultimaUrl().searchParams.get('status')).toBe('Aberto')
      expect(ultimaUrl().searchParams.get('prioridade')).toBe('Alta')

      await usuario.selectOptions(
        screen.getByLabelText(rotulo),
        '',
      )

      await aguardarConsulta(4)

      const url = ultimaUrl()

      expect(url.searchParams.has(parametroRemovido)).toBe(false)
      expect(url.searchParams.get(parametroMantido)).toBe(valorMantido)
      expect(url.searchParams.get('pagina')).toBe('0')

      expect(screen.getByLabelText(rotulo)).toHaveValue('')
      expect(
        screen.getByLabelText(rotuloMantido),
      ).toHaveValue(valorMantido)
      expect(
        screen.getByRole('heading', { name: chamadoAlta.titulo }),
      ).toBeInTheDocument()
    },
  )
})