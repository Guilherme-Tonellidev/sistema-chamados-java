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
let chamadoSalvo
let erroCadastro
let restauracoes = []

function simularMetodoDialogo(nome, implementacao) {
  const prototipo = HTMLDialogElement.prototype
  const original = Object.getOwnPropertyDescriptor(prototipo, nome)

  Object.defineProperty(prototipo, nome, {
    configurable: true,
    writable: true,
    value: vi.fn(implementacao),
  })

  restauracoes.push(() => {
    if (original) {
      Object.defineProperty(prototipo, nome, original)
    } else {
      Reflect.deleteProperty(prototipo, nome)
    }
  })
}

beforeEach(() => {
  chamadoSalvo = null
  erroCadastro = null

  simularMetodoDialogo('showModal', function abrirDialogo() {
    this.setAttribute('open', '')
  })

  simularMetodoDialogo('close', function fecharDialogo() {
    this.removeAttribute('open')
  })

  fetchMock = vi.fn(async (endereco, opcoes = {}) => {
    const url = new URL(endereco, 'http://localhost')
    const metodo = opcoes.method || 'GET'

    if (url.pathname === '/api/chamados/paginados' && metodo === 'GET') {
      return resposta(pagina(chamadoSalvo ? [chamadoSalvo] : []))
    }

    if (url.pathname === '/api/chamados' && metodo === 'POST') {
      if (erroCadastro) {
        return resposta({ erro: erroCadastro }, 500)
      }

      const dados = JSON.parse(opcoes.body)

      chamadoSalvo = {
        id: 20,
        status: 'Aberto',
        ...dados,
        prioridade: dados.prioridade || 'Normal',
      }

      return resposta(chamadoSalvo, 201)
    }

    if (url.pathname === '/api/chamados/20' && metodo === 'GET') {
      return resposta(chamadoSalvo)
    }

    if (url.pathname === '/api/chamados/20/fotos' && metodo === 'GET') {
      return resposta([])
    }

    throw new Error(
      `Requisição não prevista no teste: ${metodo} ${url.pathname}`,
    )
  })

  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  cleanup()

  for (const restaurar of restauracoes.reverse()) {
    restaurar()
  }

  restauracoes = []
  vi.unstubAllGlobals()
})

async function abrirCadastro(usuario) {
  await screen.findByText('Nenhum chamado encontrado nesta página.')

  await usuario.click(
    screen.getByRole('button', { name: /Criar chamado/ }),
  )

  return screen.getByRole('region', { name: 'Novo chamado' })
}

describe('Prioridade dos chamados', () => {
  it.each(['Baixa', 'Alta'])(
    'envia prioridade %s e volta para Normal após cadastrar',
    async (prioridade) => {
      const usuario = userEvent.setup()

      render(<App />)

      const regiao = await abrirCadastro(usuario)
      const formulario = within(regiao)

      expect(formulario.getByLabelText('Prioridade')).toHaveValue('Normal')

      await usuario.type(
        formulario.getByLabelText('Título'),
        'Teste pela interface',
      )
      await usuario.type(
        formulario.getByLabelText('Descrição'),
        'Validar a prioridade escolhida.',
      )
      await usuario.selectOptions(
        formulario.getByLabelText('Prioridade'),
        prioridade,
      )

      await usuario.click(
        formulario.getByRole('button', { name: 'Cadastrar chamado' }),
      )

      const dialogo = await screen.findByRole('dialog', {
        name: 'Chamado #20',
      })

      await within(dialogo).findByRole('heading', {
        name: 'Teste pela interface',
      })

      expect(within(dialogo).getByText(prioridade)).toBeInTheDocument()

      expect(fetchMock).toHaveBeenCalledWith('/api/chamados', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': 'csrf-teste',
        },
        body: JSON.stringify({
          titulo: 'Teste pela interface',
          descricao: 'Validar a prioridade escolhida.',
          prioridade,
        }),
      })

      await usuario.click(
        within(dialogo).getByRole('button', {
          name: 'Fechar detalhes do chamado',
        }),
      )

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      expect(formulario.getByLabelText('Prioridade')).toHaveValue('Normal')
      expect(formulario.getByLabelText('Título')).toHaveValue('')
      expect(formulario.getByLabelText('Descrição')).toHaveValue('')

      const tabela = await screen.findByRole('table', {
        name: 'Chamados da página atual',
      })

      const linha = within(tabela)
        .getByRole('button', { name: 'Abrir chamado #20' })
        .closest('tr')

      expect(within(linha).getByText(prioridade)).toBeInTheDocument()
    },
  )

  it('preserva a prioridade selecionada quando o cadastro falha', async () => {
    const usuario = userEvent.setup()
    erroCadastro = 'Não foi possível salvar o chamado.'

    render(<App />)

    const regiao = await abrirCadastro(usuario)
    const formulario = within(regiao)

    await usuario.type(
      formulario.getByLabelText('Título'),
      'Falha no cadastro',
    )
    await usuario.type(
      formulario.getByLabelText('Descrição'),
      'Preservar os dados.',
    )
    await usuario.selectOptions(
      formulario.getByLabelText('Prioridade'),
      'Alta',
    )
    await usuario.click(
      formulario.getByRole('button', { name: 'Cadastrar chamado' }),
    )

    expect(await formulario.findByRole('alert')).toHaveTextContent(
      'Não foi possível salvar o chamado.',
    )

    expect(formulario.getByLabelText('Prioridade')).toHaveValue('Alta')
    expect(formulario.getByLabelText('Título')).toHaveValue(
      'Falha no cadastro',
    )
    expect(formulario.getByLabelText('Descrição')).toHaveValue(
      'Preservar os dados.',
    )
    expect(
      formulario.getByRole('button', { name: 'Cadastrar chamado' }),
    ).toBeEnabled()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(chamadoSalvo).toBeNull()
  })
})