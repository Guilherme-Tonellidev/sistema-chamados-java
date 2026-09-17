import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'

async function aguardarLista(page) {
  await expect(
    page.getByRole('button', { name: 'Atualizar lista', exact: true }),
  ).toBeEnabled()
}

async function localizarChamado(page, titulo) {
  await aguardarLista(page)

  const cabecalho = page.getByRole('heading', {
    name: titulo,
    exact: true,
  })

  const proxima = page.getByRole('button', {
    name: 'Próxima',
    exact: true,
  })

  while (!(await cabecalho.isVisible())) {
    await expect(proxima).toBeEnabled()

    const respostaPendente = page.waitForResponse((resposta) => {
      const url = new URL(resposta.url())

      return (
        url.pathname === '/api/chamados/paginados' &&
        resposta.request().method() === 'GET'
      )
    })

    await proxima.click()

    const resposta = await respostaPendente
    expect(resposta.ok()).toBeTruthy()

    const dados = await resposta.json()

    await expect(
      page.getByText(
        `Página ${dados.pagina + 1} de ${dados.totalPaginas}`,
        { exact: true },
      ),
    ).toBeVisible()

    await aguardarLista(page)
  }

  await expect(cabecalho).toBeVisible()

  return page.getByRole('listitem').filter({ has: cabecalho })
}

test('cadastra, inicia atendimento e resolve um chamado, mantendo os dados após recarregar', async ({
  page,
}) => {
  const titulo = `Teste E2E ${randomUUID()}`
  const descricao = 'Chamado criado pelo teste automatizado no banco temporário.'

  await page.goto('/')
  await aguardarLista(page)

  await page.getByLabel('Título', { exact: true }).fill(titulo)
  await page.getByLabel('Descrição', { exact: true }).fill(descricao)

  const cadastroPendente = page.waitForResponse((resposta) => {
    const url = new URL(resposta.url())

    return (
      url.pathname === '/api/chamados' &&
      resposta.request().method() === 'POST'
    )
  })

  await page.getByRole('button', {
    name: 'Cadastrar chamado',
    exact: true,
  }).click()

  const respostaCadastro = await cadastroPendente
  expect(respostaCadastro.status()).toBe(201)

  const chamado = await respostaCadastro.json()

  await expect(
    page.getByText(
      `Chamado #${chamado.id} cadastrado com sucesso! Status inicial: Aberto.`,
      { exact: true },
    ),
  ).toBeVisible()

  await expect(page.getByLabel('Título', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('Descrição', { exact: true })).toHaveValue('')

  const itemCadastrado = await localizarChamado(page, titulo)

  await expect(
    itemCadastrado.getByText(descricao, { exact: true }),
  ).toBeVisible()

  await expect(
    itemCadastrado.getByText('Aberto', { exact: true }),
  ).toBeVisible()

  // Confere o cadastro após uma nova leitura da API.
  await page.reload()

  const itemAberto = await localizarChamado(page, titulo)

  await expect(
    itemAberto.getByText(descricao, { exact: true }),
  ).toBeVisible()

  await expect(
    itemAberto.getByText('Aberto', { exact: true }),
  ).toBeVisible()

  const atendimentoPendente = page.waitForResponse((resposta) => {
    const url = new URL(resposta.url())

    return (
      url.pathname === `/api/chamados/${chamado.id}/atendimento` &&
      resposta.request().method() === 'PATCH'
    )
  })

  await itemAberto.getByRole('button', {
    name: `Iniciar atendimento: chamado #${chamado.id}`,
    exact: true,
  }).click()

  const respostaAtendimento = await atendimentoPendente
  expect(respostaAtendimento.status()).toBe(200)

  await expect(
    page.getByText(
      `Atendimento iniciado com sucesso! Solicitação #${chamado.id}.`,
      { exact: true },
    ),
  ).toBeVisible()

  await aguardarLista(page)

  await expect(
    itemAberto.getByText('Em atendimento', { exact: true }),
  ).toBeVisible()

  await expect(
    itemAberto.getByRole('button', {
      name: `Iniciar atendimento: chamado #${chamado.id}`,
      exact: true,
    }),
  ).toHaveCount(0)

  await expect(
    itemAberto.getByRole('button', {
      name: `Resolver chamado: chamado #${chamado.id}`,
      exact: true,
    }),
  ).toBeEnabled()

  // Confere se o atendimento continua registrado após recarregar.
  await page.reload()

  const itemEmAtendimento = await localizarChamado(page, titulo)

  await expect(
    itemEmAtendimento.getByText('Em atendimento', { exact: true }),
  ).toBeVisible()

  const resolucaoPendente = page.waitForResponse((resposta) => {
    const url = new URL(resposta.url())

    return (
      url.pathname === `/api/chamados/${chamado.id}/resolucao` &&
      resposta.request().method() === 'PATCH'
    )
  })

  await itemEmAtendimento.getByRole('button', {
    name: `Resolver chamado: chamado #${chamado.id}`,
    exact: true,
  }).click()

  const respostaResolucao = await resolucaoPendente
  expect(respostaResolucao.status()).toBe(200)

  await expect(
    page.getByText(
      `Chamado resolvido com sucesso! Solicitação #${chamado.id}.`,
      { exact: true },
    ),
  ).toBeVisible()

  await aguardarLista(page)

  await expect(
    itemEmAtendimento.getByText('Resolvido', { exact: true }),
  ).toBeVisible()

  await expect(itemEmAtendimento.getByRole('button')).toHaveCount(0)

  // Confere o resultado final após recarregar.
  await page.reload()

  const itemResolvido = await localizarChamado(page, titulo)

  await expect(
    itemResolvido.getByText(descricao, { exact: true }),
  ).toBeVisible()

  await expect(
    itemResolvido.getByText('Resolvido', { exact: true }),
  ).toBeVisible()

  await expect(itemResolvido.getByRole('button')).toHaveCount(0)
})