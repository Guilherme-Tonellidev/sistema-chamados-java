import { randomUUID } from 'node:crypto'
import {
  test as testeBase,
  expect,
  obterCabecalhosCsrf,
  entrarPelaInterface,
  tecnicoTeste,
} from './autenticacao'

const test = testeBase.extend({
  requestTecnico: async ({ browser, baseURL }, executarTeste) => {
    const contextoTecnico = await browser.newContext({ baseURL })

    try {
      const paginaTecnico = await contextoTecnico.newPage()
      await entrarPelaInterface(paginaTecnico, tecnicoTeste)

      await executarTeste(contextoTecnico.request)
    } finally {
      await contextoTecnico.close()
    }
  },
})

const nomesStatus = {
  '': 'Todos',
  Aberto: 'Abertos',
  'Em atendimento': 'Em atendimento',
  Resolvido: 'Resolvidos',
}

function botaoStatus(page, status) {
  return page
    .getByRole('group', { name: 'Filtrar por status', exact: true })
    .getByRole('button', {
      name: nomesStatus[status],
      exact: true,
    })
}

async function aguardarLista(page) {
  await expect(
    page.getByRole('button', {
      name: 'Atualizar lista',
      exact: true,
    }),
  ).toBeEnabled()

  for (const status of Object.keys(nomesStatus)) {
    await expect(botaoStatus(page, status)).toBeEnabled()
  }

  await expect(
    page.getByLabel('Filtrar por prioridade', { exact: true }),
  ).toBeEnabled()
}

async function conferirFiltros(page, status, prioridade) {
  for (const valor of Object.keys(nomesStatus)) {
    await expect(botaoStatus(page, valor)).toHaveAttribute(
      'aria-pressed',
      String(valor === status),
    )
  }

  await expect(
    page.getByLabel('Filtrar por prioridade', { exact: true }),
  ).toHaveValue(prioridade)
}

async function criarChamado(
  request,
  titulo,
  prioridade,
  resolvido,
  requestTecnico,
) {
  // O solicitante cria o chamado e permanece como seu proprietário.
  const resposta = await request.post('/api/chamados', {
    headers: await obterCabecalhosCsrf(request),
    data: {
      titulo,
      descricao: 'Chamado temporário para testar filtros combinados.',
      prioridade,
    },
  })

  expect(resposta.status()).toBe(201)

  const chamado = await resposta.json()

  if (resolvido) {
    // As transições usam somente a sessão separada do técnico.
    const atendimento = await requestTecnico.patch(
      `/api/chamados/${chamado.id}/atendimento`,
      {
        headers: await obterCabecalhosCsrf(requestTecnico),
      },
    )

    expect(atendimento.status()).toBe(200)

    const resolucao = await requestTecnico.patch(
      `/api/chamados/${chamado.id}/resolucao`,
      {
        headers: await obterCabecalhosCsrf(requestTecnico),
      },
    )

    expect(resolucao.status()).toBe(200)
  }

  return titulo
}

async function consultar(
  page,
  acao,
  status,
  prioridade,
  primeiraPagina,
) {
  const respostaPendente = page.waitForResponse((resposta) => {
    const url = new URL(resposta.url())

    return (
      url.pathname === '/api/chamados/paginados' &&
      resposta.request().method() === 'GET'
    )
  })

  await acao()

  const resposta = await respostaPendente
  expect(resposta.status()).toBe(200)

  const url = new URL(resposta.url())

  expect(url.searchParams.get('status')).toBe(status || null)
  expect(url.searchParams.get('prioridade')).toBe(prioridade || null)

  if (primeiraPagina) {
    expect(url.searchParams.get('pagina')).toBe('0')
  }

  const dados = await resposta.json()
  const lista = page.getByRole('region', {
    name: 'Solicitações',
    exact: true,
  })

  // Aguarda os títulos e a paginação da resposta recebida.
  if (dados.chamados.length > 0) {
    const tabela = lista.getByRole('table', {
      name: 'Chamados da página atual',
      exact: true,
    })

    await expect(
      tabela.getByRole('heading', { level: 3 }),
    ).toHaveText(dados.chamados.map((chamado) => chamado.titulo))
  } else {
    await expect(
      lista.getByText('Nenhum chamado encontrado nesta página.', {
        exact: true,
      }),
    ).toBeVisible()

    await expect(lista.getByRole('table')).toHaveCount(0)
  }

  const textoPaginacao = dados.totalPaginas === 0
    ? 'Nenhuma página'
    : `Página ${dados.pagina + 1} de ${dados.totalPaginas}`

  await expect(
    lista.getByText(textoPaginacao, { exact: true }),
  ).toBeVisible()

  await aguardarLista(page)
  await conferirFiltros(page, status, prioridade)
}

async function alterarFiltro(page, nome, valor, status, prioridade) {
  await consultar(
    page,
    () => {
      if (nome === 'Filtrar por status') {
        return botaoStatus(page, valor).click()
      }

      return page
        .getByLabel(nome, { exact: true })
        .selectOption(valor)
    },
    status,
    prioridade,
    true,
  )
}

async function conferirResultados(
  page,
  prefixo,
  titulosEsperados,
  status,
  prioridade,
) {
  const lista = page.getByRole('region', {
    name: 'Solicitações',
    exact: true,
  })

  const encontrados = []

  // Percorre todas as páginas, incluindo chamados de outras execuções.
  while (true) {
    await aguardarLista(page)

    const tabela = lista.getByRole('table', {
      name: 'Chamados da página atual',
      exact: true,
    })

    // O cabeçalho da tabela não entra na contagem.
    const linhas = tabela.locator('tbody').getByRole('row')
    const quantidade = await linhas.count()

    for (let indice = 0; indice < quantidade; indice += 1) {
      const linha = linhas.nth(indice)

      if (status) {
        await expect(
          linha.getByText(status, { exact: true }),
        ).toBeVisible()
      }

      if (prioridade) {
        await expect(
          linha.getByRole('cell', {
            name: prioridade,
            exact: true,
          }),
        ).toBeVisible()
      }

      const titulo = await linha
        .getByRole('heading', { level: 3 })
        .innerText()

      if (titulo.startsWith(prefixo)) {
        encontrados.push(titulo)
      }
    }

    const proxima = lista.getByRole('button', {
      name: 'Próxima',
      exact: true,
    })

    if (await proxima.isDisabled()) {
      break
    }

    await consultar(
      page,
      () => proxima.click(),
      status,
      prioridade,
      false,
    )
  }

  // Compara somente os chamados criados por este teste.
  expect(encontrados.sort()).toEqual([...titulosEsperados].sort())
}

test('combina status e prioridade e remove cada filtro preservando o outro', async ({
  page,
  requestTecnico,
}) => {
  // Usa os cookies da sessão autenticada no navegador.
  const request = page.request
  const prefixo = `Filtros E2E ${randomUUID()}`

  const abertoAlta = await criarChamado(
    request,
    `${prefixo} aberto alta`,
    'Alta',
    false,
  )

  const abertoBaixa = await criarChamado(
    request,
    `${prefixo} aberto baixa`,
    'Baixa',
    false,
  )

 const resolvidoAlta = await criarChamado(
  request,
  `${prefixo} resolvido alta`,
  'Alta',
  true,
  requestTecnico,
)

await criarChamado(
  request,
  `${prefixo} resolvido baixa`,
  'Baixa',
  true,
  requestTecnico,
)

  await page.goto('/')
  await aguardarLista(page)
  await conferirFiltros(page, '', '')

  await alterarFiltro(
    page,
    'Filtrar por status',
    'Aberto',
    'Aberto',
    '',
  )

  await alterarFiltro(
    page,
    'Filtrar por prioridade',
    'Alta',
    'Aberto',
    'Alta',
  )

  await conferirResultados(
    page,
    prefixo,
    [abertoAlta],
    'Aberto',
    'Alta',
  )

  // Remove a prioridade e mantém o status Aberto.
  await alterarFiltro(
    page,
    'Filtrar por prioridade',
    '',
    'Aberto',
    '',
  )

  await conferirResultados(
    page,
    prefixo,
    [abertoAlta, abertoBaixa],
    'Aberto',
    '',
  )

  // Reaplica Alta antes de remover o filtro de status.
  await alterarFiltro(
    page,
    'Filtrar por prioridade',
    'Alta',
    'Aberto',
    'Alta',
  )

  await alterarFiltro(
    page,
    'Filtrar por status',
    '',
    '',
    'Alta',
  )

  await conferirResultados(
    page,
    prefixo,
    [abertoAlta, resolvidoAlta],
    '',
    'Alta',
  )
})