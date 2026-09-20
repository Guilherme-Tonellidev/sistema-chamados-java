import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './PainelChamados'

vi.mock('./services/autenticacaoApi', () => ({
  obterCsrf: vi.fn(async () => ({
    headerName: 'X-CSRF-TOKEN',
    token: 'csrf-teste',
  })),
}))

function resposta(dados, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => dados,
  }
}

function pagina(chamados) {
  return {
    chamados,
    pagina: 0,
    tamanho: 5,
    totalElementos: chamados.length,
    totalPaginas: chamados.length > 0 ? 1 : 0,
    temProxima: false,
  }
}

let fetchMock

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

describe('Prioridade dos chamados', () => {
  it.each(['Baixa', 'Alta'])(
    'envia prioridade %s e volta para Normal após cadastrar',
    async (prioridade) => {
      const usuario = userEvent.setup()

      const chamado = {
        id: 20,
        titulo: 'Teste pela interface',
        descricao: 'Validar a prioridade escolhida.',
        status: 'Aberto',
        prioridade,
      }

      fetchMock
        .mockResolvedValueOnce(resposta(pagina([])))
        .mockResolvedValueOnce(resposta(chamado, 201))
        .mockResolvedValue(resposta(pagina([chamado])))

      render(<App />)

      await screen.findByText('Nenhum chamado encontrado nesta página.')

      expect(screen.getByLabelText('Prioridade')).toHaveValue('Normal')

      await usuario.type(
        screen.getByLabelText('Título'),
        chamado.titulo,
      )
      await usuario.type(
        screen.getByLabelText('Descrição'),
        chamado.descricao,
      )
      await usuario.selectOptions(
        screen.getByLabelText('Prioridade'),
        prioridade,
      )

      await usuario.click(
        screen.getByRole('button', { name: 'Cadastrar chamado' }),
      )

      await screen.findByRole('heading', { name: chamado.titulo })

          expect(fetchMock).toHaveBeenCalledWith('/api/chamados', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': 'csrf-teste',
        },
        body: JSON.stringify({
          titulo: chamado.titulo,
          descricao: chamado.descricao,
          prioridade,
        }),
      })

      expect(screen.getByLabelText('Prioridade')).toHaveValue('Normal')

      expect(screen.getByRole('listitem')).toHaveTextContent(
        `Prioridade: ${prioridade}`,
      )
    },
  )

  it('preserva a prioridade selecionada quando o cadastro falha', async () => {
    const usuario = userEvent.setup()

    fetchMock
      .mockResolvedValueOnce(resposta(pagina([])))
      .mockResolvedValue(
        resposta({ erro: 'Não foi possível salvar o chamado.' }, 500),
      )

    render(<App />)

    await screen.findByText('Nenhum chamado encontrado nesta página.')

    await usuario.type(
      screen.getByLabelText('Título'),
      'Falha no cadastro',
    )
    await usuario.type(
      screen.getByLabelText('Descrição'),
      'Preservar os dados.',
    )
    await usuario.selectOptions(
      screen.getByLabelText('Prioridade'),
      'Alta',
    )
    await usuario.click(
      screen.getByRole('button', { name: 'Cadastrar chamado' }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível salvar o chamado.',
    )

    expect(screen.getByLabelText('Prioridade')).toHaveValue('Alta')
    expect(screen.getByLabelText('Título')).toHaveValue('Falha no cadastro')
  })
})