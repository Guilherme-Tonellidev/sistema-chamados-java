import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

const CHAVE_TEMA = 'sistema-chamados-tema'

function conferirTema(tema) {
  expect(document.documentElement).toHaveAttribute('data-tema', tema)

  const nomeBotao =
    tema === 'escuro' ? 'Ativar tema claro' : 'Ativar tema escuro'

  expect(
    screen.getByRole('button', { name: nomeBotao }),
  ).toBeEnabled()
}

async function abrirAplicacao() {
  const resultado = render(<App />)

  await screen.findByText('Nenhum chamado encontrado nesta página.')

  return resultado
}

beforeEach(() => {
  localStorage.removeItem(CHAVE_TEMA)
  document.documentElement.removeAttribute('data-tema')

  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        chamados: [],
        pagina: 0,
        tamanho: 5,
        totalElementos: 0,
        totalPaginas: 0,
        temProxima: false,
      }),
    }),
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.removeItem(CHAVE_TEMA)
  document.documentElement.removeAttribute('data-tema')
})

describe('Tema da interface', () => {
  it('inicia com tema claro quando não há preferência salva', async () => {
    await abrirAplicacao()

    conferirTema('claro')
    expect(localStorage.getItem(CHAVE_TEMA)).toBe('claro')
  })

  it.each(['claro', 'escuro'])(
    'recupera a preferência salva de tema %s',
    async (tema) => {
      localStorage.setItem(CHAVE_TEMA, tema)

      await abrirAplicacao()

      conferirTema(tema)
      expect(localStorage.getItem(CHAVE_TEMA)).toBe(tema)
    },
  )

  it('usa tema claro quando a preferência salva é inválida', async () => {
    localStorage.setItem(CHAVE_TEMA, 'tema-invalido')

    await abrirAplicacao()

    conferirTema('claro')
    expect(localStorage.getItem(CHAVE_TEMA)).toBe('claro')
  })

  it('alterna entre claro e escuro e salva cada escolha', async () => {
    const usuario = userEvent.setup()

    await abrirAplicacao()

    await usuario.click(
      screen.getByRole('button', { name: 'Ativar tema escuro' }),
    )

    conferirTema('escuro')
    expect(localStorage.getItem(CHAVE_TEMA)).toBe('escuro')

    await usuario.click(
      screen.getByRole('button', { name: 'Ativar tema claro' }),
    )

    conferirTema('claro')
    expect(localStorage.getItem(CHAVE_TEMA)).toBe('claro')
  })

  it('recupera a escolha após desmontar e montar a aplicação novamente', async () => {
    const usuario = userEvent.setup()
    const primeiraMontagem = await abrirAplicacao()

    await usuario.click(
      screen.getByRole('button', { name: 'Ativar tema escuro' }),
    )

    expect(localStorage.getItem(CHAVE_TEMA)).toBe('escuro')

    primeiraMontagem.unmount()
    document.documentElement.removeAttribute('data-tema')

    await abrirAplicacao()

    conferirTema('escuro')
    expect(localStorage.getItem(CHAVE_TEMA)).toBe('escuro')
  })

  it('usa tema claro e permite alternar quando a leitura do armazenamento falha', async () => {
    const usuario = userEvent.setup()

    const leitura = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('Leitura do armazenamento bloqueada')
      })

    await abrirAplicacao()

    expect(leitura).toHaveBeenCalledWith(CHAVE_TEMA)
    conferirTema('claro')

    await usuario.click(
      screen.getByRole('button', { name: 'Ativar tema escuro' }),
    )

    conferirTema('escuro')
  })

  it('permite alternar nos dois sentidos quando a gravação do armazenamento falha', async () => {
    const usuario = userEvent.setup()

    const gravacao = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('Gravação do armazenamento bloqueada')
      })

    await abrirAplicacao()

    conferirTema('claro')
    expect(gravacao).toHaveBeenCalledWith(CHAVE_TEMA, 'claro')

    await usuario.click(
      screen.getByRole('button', { name: 'Ativar tema escuro' }),
    )

    conferirTema('escuro')
    expect(gravacao).toHaveBeenCalledWith(CHAVE_TEMA, 'escuro')

    await usuario.click(
      screen.getByRole('button', { name: 'Ativar tema claro' }),
    )

    conferirTema('claro')
    expect(gravacao).toHaveBeenLastCalledWith(CHAVE_TEMA, 'claro')
    expect(localStorage.getItem(CHAVE_TEMA)).toBeNull()
  })
})