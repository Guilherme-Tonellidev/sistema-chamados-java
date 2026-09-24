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

const usuarioAtendente = {
  id: 10,
  nome: 'Técnico de TI de teste',
  email: 'tecnico@example.com',
  ativo: true,
  perfil: 'ATENDENTE',
}

const usuarioSolicitante = {
  id: 20,
  nome: 'Solicitante de teste',
  email: 'solicitante@example.com',
  ativo: true,
  perfil: 'SOLICITANTE',
}

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
  prioridade: 'Normal',
  dataAbertura: '2026-09-21T12:00:00Z',
}

function resposta(dados, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => dados,
  }
}

let api
let fetchMock
let restauracoes = []

function simularMetodo(objeto, nome, implementacao) {
  const original = Object.getOwnPropertyDescriptor(objeto, nome)

  Object.defineProperty(objeto, nome, {
    configurable: true,
    writable: true,
    value: vi.fn(implementacao),
  })

  restauracoes.push(() => {
    if (original) {
      Object.defineProperty(objeto, nome, original)
    } else {
      Reflect.deleteProperty(objeto, nome)
    }
  })
}

function chamadasPara(caminho, metodo) {
  return fetchMock.mock.calls.filter(([endereco, opcoes = {}]) => {
    const url = new URL(endereco, 'http://localhost')

    return url.pathname === caminho &&
      (opcoes.method || 'GET') === metodo
  })
}

function ultimaConsulta() {
  const chamadas = chamadasPara('/api/chamados/paginados', 'GET')

  return new URL(chamadas.at(-1)[0], 'http://localhost')
}

function tabela() {
  return screen.getByRole('table', {
    name: 'Chamados da página atual',
  })
}

function linhaChamado(id = 3) {
  return within(tabela())
    .getByRole('button', { name: `Abrir chamado #${id}` })
    .closest('tr')
}

async function abrirCadastro(usuario) {
  await usuario.click(
    screen.getByRole('button', { name: /Criar chamado/ }),
  )

  return screen.getByRole('region', { name: 'Novo chamado' })
}

async function preencherCadastro(usuario, regiao) {
  const formulario = within(regiao)

  await usuario.type(
    formulario.getByLabelText('Título'),
    `  ${chamadoAberto.titulo}  `,
  )

  await usuario.type(
    formulario.getByLabelText('Descrição'),
    `  ${chamadoAberto.descricao}  `,
  )
}

async function cadastrar(usuario, regiao) {
  await usuario.click(
    within(regiao).getByRole('button', {
      name: 'Cadastrar chamado',
    }),
  )
}

async function aguardarDetalhes() {
  const dialogo = await screen.findByRole('dialog', {
    name: 'Chamado #3',
  })

  await within(dialogo).findByRole('heading', {
    name: chamadoAberto.titulo,
  })

  return dialogo
}

async function fecharDetalhes(usuario, dialogo) {
  await usuario.click(
    within(dialogo).getByRole('button', {
      name: 'Fechar detalhes do chamado',
    }),
  )

  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
}

function arquivoFoto(nome = 'problema.png') {
  // O conteúdo real da imagem é validado nos testes Java.
  // Aqui verificamos seleção, FormData e comportamento da interface.
  return new File(['imagem para teste da interface'], nome, {
    type: 'image/png',
  })
}

beforeEach(() => {
  api = {
    chamados: [],
    fotos: {},
    falhasListagem: 0,
    erroCadastro: null,
    erroStatus: null,
    erroFotos: null,
  }

  simularMetodo(
    HTMLDialogElement.prototype,
    'showModal',
    function abrirDialogo() {
      this.setAttribute('open', '')
    },
  )

  simularMetodo(
    HTMLDialogElement.prototype,
    'close',
    function fecharDialogo() {
      this.removeAttribute('open')
    },
  )

  let numeroPrevia = 0

  simularMetodo(
    URL,
    'createObjectURL',
    () => `blob:foto-teste-${++numeroPrevia}`,
  )

  simularMetodo(URL, 'revokeObjectURL', () => {})

  fetchMock = vi.fn(async (endereco, opcoes = {}) => {
    const url = new URL(endereco, 'http://localhost')
    const caminho = url.pathname
    const metodo = opcoes.method || 'GET'

    if (caminho === '/api/chamados/paginados' && metodo === 'GET') {
      if (api.falhasListagem > 0) {
        api.falhasListagem -= 1
        throw new TypeError('Failed to fetch')
      }

      const numero = Number(url.searchParams.get('pagina') || 0)
      const tamanho = Number(url.searchParams.get('tamanho') || 5)
      const status = url.searchParams.get('status')
      const prioridade = url.searchParams.get('prioridade')

      const filtrados = api.chamados.filter((chamado) =>
        (!status || chamado.status === status) &&
        (!prioridade || chamado.prioridade === prioridade),
      )

      const totalPaginas = Math.ceil(filtrados.length / tamanho)

      return resposta({
        chamados: filtrados.slice(
          numero * tamanho,
          (numero + 1) * tamanho,
        ),
        pagina: numero,
        tamanho,
        totalElementos: filtrados.length,
        totalPaginas,
        temProxima: numero + 1 < totalPaginas,
      })
    }

    if (caminho === '/api/chamados' && metodo === 'POST') {
      if (api.erroCadastro) {
        return resposta({ erro: api.erroCadastro }, 400)
      }

      const dados = JSON.parse(opcoes.body)
      const criado = {
        ...chamadoAberto,
        ...dados,
        prioridade: dados.prioridade || 'Normal',
      }

      api.chamados.push(criado)

      return resposta(criado, 201)
    }

    const rotaFotos = caminho.match(/^\/api\/chamados\/(\d+)\/fotos$/)

    if (rotaFotos) {
      const id = Number(rotaFotos[1])

      if (metodo === 'GET') {
        return resposta([...(api.fotos[id] || [])])
      }

      if (metodo === 'POST') {
        if (api.erroFotos) {
          return resposta({ erro: api.erroFotos }, 500)
        }

        const existentes = api.fotos[id] || []
        const arquivos = opcoes.body.getAll('fotos')
        const adicionadas = arquivos.map((arquivo, indice) => ({
          id: `foto-${existentes.length + indice + 1}`,
          nome: arquivo.name,
          tipo: arquivo.type,
          tamanho: arquivo.size,
        }))

        api.fotos[id] = [...existentes, ...adicionadas]

        return resposta(adicionadas, 201)
      }
    }

    const rotaStatus = caminho.match(
      /^\/api\/chamados\/(\d+)\/(atendimento|resolucao)$/,
    )

    if (rotaStatus && metodo === 'PATCH') {
      if (api.erroStatus) {
        return resposta({ erro: api.erroStatus }, 409)
      }

      const id = Number(rotaStatus[1])
      const status = rotaStatus[2] === 'atendimento'
        ? 'Em atendimento'
        : 'Resolvido'

      api.chamados = api.chamados.map((chamado) =>
        chamado.id === id ? { ...chamado, status } : chamado,
      )

      return resposta(api.chamados.find((chamado) => chamado.id === id))
    }

    const rotaDetalhes = caminho.match(/^\/api\/chamados\/(\d+)$/)

    if (rotaDetalhes && metodo === 'GET') {
      const id = Number(rotaDetalhes[1])
      const chamado = api.chamados.find((item) => item.id === id)

      return chamado
        ? resposta(chamado)
        : resposta({ erro: 'Chamado não encontrado.' }, 404)
    }

    throw new Error(`Requisição não prevista no teste: ${metodo} ${caminho}`)
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

describe('Interface de chamados', () => {
  it('lista os chamados na tabela e mantém a descrição nos detalhes', async () => {
    api.chamados = [{ ...chamadoAberto }]

    render(<App usuario={usuarioAtendente} />)

    await screen.findByRole('button', { name: 'Abrir chamado #3' })

    const linha = within(linhaChamado())

    expect(
      linha.getByRole('button', { name: chamadoAberto.titulo }),
    ).toBeInTheDocument()

    expect(
      screen.queryByText(chamadoAberto.descricao),
    ).not.toBeInTheDocument()

    expect(screen.queryByText('Ver descrição')).not.toBeInTheDocument()
    expect(screen.getByText('Página 1 de 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()

    expect(
      linha.getByRole('button', {
        name: 'Iniciar atendimento: chamado #3',
      }),
    ).toBeEnabled()
  })

  it('mostra uma mensagem quando não há chamados', async () => {
    render(<App usuario={usuarioAtendente} />)

    expect(
      await screen.findByText('Nenhum chamado encontrado nesta página.'),
    ).toBeInTheDocument()

    expect(screen.getByText('Nenhuma página')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('permite tentar novamente após uma falha de conexão', async () => {
    const usuario = userEvent.setup()
    api.chamados = [{ ...chamadoAberto }]
    api.falhasListagem = 1

    render(<App usuario={usuarioAtendente} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível conectar ao serviço. Tente novamente.',
    )

    await usuario.click(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    )

    expect(
      await screen.findByRole('button', { name: 'Abrir chamado #3' }),
    ).toBeInTheDocument()

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('cadastra, abre os detalhes e limpa os campos', async () => {
    const usuario = userEvent.setup()

    render(<App usuario={usuarioAtendente} />)
    await screen.findByText('Nenhum chamado encontrado nesta página.')

    expect(screen.queryByLabelText('Título')).not.toBeInTheDocument()

    const regiao = await abrirCadastro(usuario)
    await preencherCadastro(usuario, regiao)
    await cadastrar(usuario, regiao)

    const dialogo = await aguardarDetalhes()

    expect(
      within(dialogo).getByText(chamadoAberto.descricao),
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

    expect(chamadasPara('/api/chamados/3/fotos', 'POST')).toHaveLength(0)

    await fecharDetalhes(usuario, dialogo)

    expect(within(regiao).getByLabelText('Título')).toHaveValue('')
    expect(within(regiao).getByLabelText('Descrição')).toHaveValue('')
    expect(within(regiao).getByLabelText('Prioridade')).toHaveValue('Normal')

    expect(
      screen.getByText(
        'Chamado #3 cadastrado com sucesso! Status inicial: Aberto.',
      ),
    ).toBeInTheDocument()

    expect(
      await screen.findByRole('button', { name: 'Abrir chamado #3' }),
    ).toBeInTheDocument()
  })

  it('impede cadastro com campos contendo apenas espaços', async () => {
    const usuario = userEvent.setup()

    render(<App usuario={usuarioAtendente} />)
    await screen.findByText('Nenhum chamado encontrado nesta página.')

    const regiao = await abrirCadastro(usuario)
    const formulario = within(regiao)

    await usuario.type(formulario.getByLabelText('Título'), '   ')
    await usuario.type(formulario.getByLabelText('Descrição'), '   ')
    await cadastrar(usuario, regiao)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Preencha o título e a descrição.',
    )

    expect(chamadasPara('/api/chamados', 'POST')).toHaveLength(0)
    expect(formulario.getByLabelText('Título')).toHaveValue('   ')
  })

  it('preserva os campos quando a API rejeita o cadastro', async () => {
    const usuario = userEvent.setup()
    api.erroCadastro = 'Título inválido.'

    render(<App usuario={usuarioAtendente} />)
    await screen.findByText('Nenhum chamado encontrado nesta página.')

    const regiao = await abrirCadastro(usuario)
    await preencherCadastro(usuario, regiao)
    await cadastrar(usuario, regiao)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Título inválido.',
    )

    expect(within(regiao).getByLabelText('Título')).toHaveValue(
      `  ${chamadoAberto.titulo}  `,
    )
    expect(within(regiao).getByLabelText('Descrição')).toHaveValue(
      `  ${chamadoAberto.descricao}  `,
    )
    expect(
      within(regiao).getByRole('button', { name: 'Cadastrar chamado' }),
    ).toBeEnabled()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(api.chamados).toHaveLength(0)
  })

  it('avança a página e volta à primeira ao clicar no filtro de status', async () => {
    const usuario = userEvent.setup()

    api.chamados = [
      ...Array.from({ length: 5 }, (_, indice) => ({
        ...chamadoAberto,
        id: indice + 1,
        titulo: `Chamado ${indice + 1}`,
      })),
      {
        ...chamadoAberto,
        id: 6,
        titulo: 'Chamado resolvido',
        status: 'Resolvido',
      },
    ]

    render(<App usuario={usuarioAtendente} />)

    await screen.findByText('Página 1 de 2')
    await usuario.click(screen.getByRole('button', { name: 'Próxima' }))

    await screen.findByText('Página 2 de 2')

    expect(ultimaConsulta().searchParams.get('pagina')).toBe('1')
    expect(ultimaConsulta().searchParams.get('tamanho')).toBe('5')

    await usuario.click(
      screen.getByRole('button', { name: 'Resolvidos', exact: true }),
    )

    await screen.findByText('Página 1 de 1')

    expect(ultimaConsulta().searchParams.get('pagina')).toBe('0')
    expect(ultimaConsulta().searchParams.get('status')).toBe('Resolvido')

    expect(
      screen.getByRole('button', { name: 'Resolvidos', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true')

    // Uma linha de cabeçalho e uma linha de chamado.
    expect(within(tabela()).getAllByRole('row')).toHaveLength(2)
    expect(
      within(tabela()).getByRole('button', { name: 'Chamado resolvido' }),
    ).toBeInTheDocument()
  })

  it('inicia atendimento e passa a oferecer a ação de resolver', async () => {
    const usuario = userEvent.setup()
    api.chamados = [{ ...chamadoAberto }]

    render(<App usuario={usuarioAtendente} />)

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

    const linha = within(linhaChamado())

    expect(linha.getByText('Em atendimento')).toBeInTheDocument()
    expect(
      linha.queryByRole('button', { name: /Iniciar atendimento/ }),
    ).not.toBeInTheDocument()

    expect(
      screen.getByText(
        'Atendimento iniciado com sucesso! Solicitação #3.',
      ),
    ).toBeInTheDocument()
  })

  it('resolve um chamado mantendo os botões de abrir detalhes', async () => {
    const usuario = userEvent.setup()
    api.chamados = [{
      ...chamadoAberto,
      status: 'Em atendimento',
    }]

    render(<App usuario={usuarioAtendente} />)

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
      expect(
        within(linhaChamado()).getByText('Resolvido'),
      ).toBeInTheDocument()
    })

    const linha = within(linhaChamado())

    expect(
      linha.queryByRole('button', { name: /Resolver chamado:/ }),
    ).not.toBeInTheDocument()
    expect(
      linha.queryByRole('button', { name: /Iniciar atendimento:/ }),
    ).not.toBeInTheDocument()

    expect(
      linha.getByRole('button', { name: 'Abrir chamado #3' }),
    ).toBeEnabled()

    expect(linha.getByText('Concluído')).toBeInTheDocument()
    expect(
      screen.getByText('Chamado resolvido com sucesso! Solicitação #3.'),
    ).toBeInTheDocument()
  })

  it('mostra o erro sem indicar sucesso na mudança de status', async () => {
    const usuario = userEvent.setup()
    api.chamados = [{ ...chamadoAberto }]
    api.erroStatus = 'Não é possível iniciar atendimento neste status.'

    render(<App usuario={usuarioAtendente} />)

    await usuario.click(
      await screen.findByRole('button', {
        name: 'Iniciar atendimento: chamado #3',
      }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      api.erroStatus,
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
      within(linhaChamado()).getByText('Aberto'),
    ).toBeInTheDocument()
  })

  it('abre os detalhes pelo número e pelo título, exibindo as fotos salvas', async () => {
    const usuario = userEvent.setup()
    api.chamados = [{ ...chamadoAberto }]
    api.fotos[3] = [{
      id: 'foto-salva',
      nome: 'problema.png',
      tipo: 'image/png',
      tamanho: 100,
    }]

    render(<App usuario={usuarioAtendente} />)

    await usuario.click(
      await screen.findByRole('button', { name: 'Abrir chamado #3' }),
    )

    let dialogo = await aguardarDetalhes()

    expect(
      within(dialogo).getByText(chamadoAberto.descricao),
    ).toBeInTheDocument()

    expect(
      within(dialogo).getByRole('link', {
        name: 'Abrir foto 1 em outra aba',
      }),
    ).toHaveAttribute(
      'href',
      '/api/chamados/3/fotos/foto-salva',
    )

    await fecharDetalhes(usuario, dialogo)

    await usuario.click(
      within(tabela()).getByRole('button', {
        name: chamadoAberto.titulo,
      }),
    )

    dialogo = await aguardarDetalhes()

    expect(
      within(dialogo).getByRole('img', {
        name: 'Foto 1 do chamado #3',
      }),
    ).toBeInTheDocument()

    expect(chamadasPara('/api/chamados/3', 'GET')).toHaveLength(2)
    expect(chamadasPara('/api/chamados/3/fotos', 'GET')).toHaveLength(2)
  })

  it('envia as fotos selecionadas no cadastro com CSRF e exibe a galeria', async () => {
    const usuario = userEvent.setup()

    render(<App usuario={usuarioAtendente} />)
    await screen.findByText('Nenhum chamado encontrado nesta página.')

    const regiao = await abrirCadastro(usuario)
    await preencherCadastro(usuario, regiao)

    await usuario.upload(
      within(regiao).getByLabelText(
        'Selecionar fotos para o novo chamado',
      ),
      arquivoFoto(),
    )

    expect(
      await within(regiao).findByRole('img', {
        name: 'Prévia de problema.png',
      }),
    ).toBeInTheDocument()

    await cadastrar(usuario, regiao)

    const dialogo = await aguardarDetalhes()
    const uploads = chamadasPara('/api/chamados/3/fotos', 'POST')

    expect(uploads).toHaveLength(1)

    const opcoes = uploads[0][1]

    expect(opcoes.credentials).toBe('same-origin')
    expect(opcoes.headers).toEqual({
      'X-CSRF-TOKEN': 'csrf-teste',
    })
    expect(opcoes.body).toBeInstanceOf(FormData)

    const enviados = opcoes.body.getAll('fotos')

    expect(enviados).toHaveLength(1)
    expect(enviados[0].name).toBe('problema.png')
    expect(enviados[0].type).toBe('image/png')
    expect(enviados[0].size).toBeGreaterThan(0)

    expect(
      within(dialogo).getByRole('img', {
        name: 'Foto 1 do chamado #3',
      }),
    ).toHaveAttribute('src', '/api/chamados/3/fotos/foto-1')

    expect(chamadasPara('/api/chamados', 'POST')).toHaveLength(1)

    await fecharDetalhes(usuario, dialogo)

    expect(
      within(regiao).queryByRole('img', {
        name: 'Prévia de problema.png',
      }),
    ).not.toBeInTheDocument()
  })

  it('não envia uma foto removida antes do cadastro', async () => {
    const usuario = userEvent.setup()

    render(<App usuario={usuarioAtendente} />)
    await screen.findByText('Nenhum chamado encontrado nesta página.')

    const regiao = await abrirCadastro(usuario)
    await preencherCadastro(usuario, regiao)

    await usuario.upload(
      within(regiao).getByLabelText(
        'Selecionar fotos para o novo chamado',
      ),
      arquivoFoto(),
    )

    await usuario.click(
      within(regiao).getByRole('button', {
        name: 'Remover seleção de problema.png',
      }),
    )

    expect(
      within(regiao).queryByRole('img', {
        name: 'Prévia de problema.png',
      }),
    ).not.toBeInTheDocument()

    await cadastrar(usuario, regiao)
    const dialogo = await aguardarDetalhes()

    expect(chamadasPara('/api/chamados/3/fotos', 'POST')).toHaveLength(0)
    expect(
      within(dialogo).getByText('Nenhuma foto adicionada.'),
    ).toBeInTheDocument()
  })

  it('preserva o chamado se as fotos falham e permite enviá-las pelos detalhes', async () => {
    const usuario = userEvent.setup()
    api.erroFotos = 'Não foi possível salvar as fotos.'

    render(<App usuario={usuarioAtendente} />)
    await screen.findByText('Nenhum chamado encontrado nesta página.')

    const regiao = await abrirCadastro(usuario)
    await preencherCadastro(usuario, regiao)

    await usuario.upload(
      within(regiao).getByLabelText(
        'Selecionar fotos para o novo chamado',
      ),
      arquivoFoto(),
    )

    await cadastrar(usuario, regiao)
    const dialogo = await aguardarDetalhes()

    expect(within(dialogo).getByRole('alert')).toHaveTextContent(
      'O chamado foi criado, mas não foi possível confirmar o envio das fotos.',
    )
    expect(
      within(dialogo).getByText('Nenhuma foto adicionada.'),
    ).toBeInTheDocument()

    expect(api.chamados).toHaveLength(1)
    expect(chamadasPara('/api/chamados', 'POST')).toHaveLength(1)

    // O serviço volta a responder. O usuário envia a foto
    // no chamado existente, sem repetir seu cadastro.
    api.erroFotos = null

    await usuario.upload(
      within(dialogo).getByLabelText('Selecionar fotos do chamado'),
      arquivoFoto(),
    )

    await usuario.click(
      within(dialogo).getByRole('button', { name: 'Enviar fotos' }),
    )

    expect(
      await within(dialogo).findByText('Fotos adicionadas com sucesso.'),
    ).toBeInTheDocument()

    expect(
      within(dialogo).getByRole('img', {
        name: 'Foto 1 do chamado #3',
      }),
    ).toBeInTheDocument()

    expect(api.chamados).toHaveLength(1)
    expect(chamadasPara('/api/chamados', 'POST')).toHaveLength(1)
    expect(chamadasPara('/api/chamados/3/fotos', 'POST')).toHaveLength(2)
  })
})
describe('Permissões na interface de chamados', () => {
  it.each([
    {
      cenario: 'solicitante',
      conta: usuarioSolicitante,
    },
    {
      cenario: 'usuário sem perfil',
      conta: {
        id: 30,
        nome: 'Usuário sem perfil',
        email: 'sem-perfil@example.com',
        ativo: true,
      },
    },
    {
      cenario: 'usuário com perfil desconhecido',
      conta: {
        ...usuarioSolicitante,
        perfil: 'ADMINISTRADOR',
      },
    },
    {
      cenario: 'usuário não informado',
      conta: undefined,
    },
  ])(
    'oculta ações de atendimento para $cenario e mantém os detalhes acessíveis',
    async ({ conta }) => {
      const usuario = userEvent.setup()

      api.chamados = [
        { ...chamadoAberto },
        {
          ...chamadoAberto,
          id: 4,
          titulo: 'Chamado em atendimento',
          status: 'Em atendimento',
        },
      ]

      render(<App usuario={conta} />)

      await screen.findByRole('button', {
        name: 'Abrir chamado #3',
      })

      expect(
        within(tabela()).queryByRole('columnheader', {
          name: 'Ações',
          exact: true,
        }),
      ).not.toBeInTheDocument()

      expect(
        screen.queryByRole('button', {
          name: /Iniciar atendimento:/,
        }),
      ).not.toBeInTheDocument()

      expect(
        screen.queryByRole('button', {
          name: /Resolver chamado:/,
        }),
      ).not.toBeInTheDocument()

      expect(
        within(linhaChamado(3)).getByText('Aberto', {
          exact: true,
        }),
      ).toBeInTheDocument()

      expect(
        within(linhaChamado(4)).getByText('Em atendimento', {
          exact: true,
        }),
      ).toBeInTheDocument()

      // A consulta dos detalhes continua disponível pelo número.
      await usuario.click(
        within(tabela()).getByRole('button', {
          name: 'Abrir chamado #3',
        }),
      )

      let dialogo = await aguardarDetalhes()

      expect(
        within(dialogo).getByText(chamadoAberto.descricao),
      ).toBeInTheDocument()

      await fecharDetalhes(usuario, dialogo)

      // Também continua disponível pelo título.
      await usuario.click(
        within(tabela()).getByRole('button', {
          name: chamadoAberto.titulo,
          exact: true,
        }),
      )

      dialogo = await aguardarDetalhes()

      expect(
        within(dialogo).getByText(chamadoAberto.descricao),
      ).toBeInTheDocument()

      const alteracoes = fetchMock.mock.calls.filter(
        ([, opcoes]) => opcoes?.method === 'PATCH',
      )

      expect(alteracoes).toHaveLength(0)
    },
  )
})