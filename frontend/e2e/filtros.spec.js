import { randomUUID } from 'node:crypto'
import { test, expect } from './autenticacao'

async function criarChamado(request, titulo, prioridade, resolvido) {
  const resposta = await request.post('/api/chamados', {
    data: {
      titulo,
      descricao: 'Chamado temporário para testar filtros combinados.',
      prioridade,
    },
  })

  expect(resposta.status()).toBe(201)

  const chamado = await resposta.json()

  if (resolvido) {
    const atendimento = await request.patch(
      `/api/chamados/${chamado.id}/atendimento`,
    )
    expect(atendimento.status()).toBe(200)

    const resolucao = await request.patch(
      `/api/chamados/${chamado.id}/resolucao`,
    )
    expect(resolucao.status()).toBe(200)
  }

  return titulo
}

async function consultar(page, acao, status, prioridade, primeiraPagina) {
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
  const lista = page.getByRole('region', { name: 'Solicitações' })

  // Aguarda a interface apresentar a resposta desta consulta.
  await expect(
    lista.getByRole('heading', { level: 3 }),
  ).toHaveText(dados.chamados.map((chamado) => chamado.titulo))

  await expect(
    page.getByLabel('Filtrar por status', { exact: true }),
  ).toBeEnabled()

  await expect(
    page.getByLabel('Filtrar por prioridade', { exact: true }),
  ).toBeEnabled()
}

async function alterarFiltro(page, nome, valor, status, prioridade) {
  await consultar(
    page,
    () => page.getByLabel(nome, { exact: true }).selectOption(valor),
    status,
    prioridade,
    true,
  )

  await expect(
    page.getByLabel('Filtrar por status', { exact: true }),
  ).toHaveValue(status)

  await expect(
    page.getByLabel('Filtrar por prioridade', { exact: true }),
  ).toHaveValue(prioridade)
}

async function conferirResultados(
  page,
  prefixo,
  titulosEsperados,
  status,
  prioridade,
) {
  const lista = page.getByRole('region', { name: 'Solicitações' })
  const encontrados = []

  // Percorre todas as páginas para não confundir ausência com paginação.
  while (true) {
    const itens = lista.getByRole('listitem')
    const quantidade = await itens.count()

    for (let indice = 0; indice < quantidade; indice += 1) {
      const item = itens.nth(indice)

      if (status) {
        await expect(
          item.getByText(status, { exact: true }),
        ).toBeVisible()
      }

      if (prioridade) {
        await expect(
          item.locator('.prioridade-texto'),
        ).toHaveText(prioridade)
      }

      const titulo = await item.getByRole('heading', {
        level: 3,
      }).innerText()

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

  // Compara apenas os chamados desta execução, sem depender de banco vazio.
  expect(encontrados.sort()).toEqual([...titulosEsperados].sort())
}

test('combina status e prioridade e remove cada filtro preservando o outro', async ({
  page,
  request,
}) => {
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
  )

  await criarChamado(
    request,
    `${prefixo} resolvido baixa`,
    'Baixa',
    true,
  )

  await page.goto('/')

  await expect(
    page.getByLabel('Filtrar por status', { exact: true }),
  ).toBeEnabled()

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

  // Remove prioridade, mantendo somente chamados abertos.
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

  // Reaplica prioridade para testar a remoção do outro filtro.
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