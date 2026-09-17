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

test('cadastra um chamado e mantém sua apresentação após recarregar', async ({
  page,
}) => {
  const titulo = `Teste E2E ${randomUUID()}`
  const descricao = 'Chamado criado pelo teste automatizado no banco temporário.'

  await page.goto('/')
  await aguardarLista(page)

  await page.getByLabel('Título', { exact: true }).fill(titulo)
  await page.getByLabel('Descrição', { exact: true }).fill(descricao)

  const respostaPendente = page.waitForResponse((resposta) => {
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

  const resposta = await respostaPendente
  expect(resposta.status()).toBe(201)

  const chamado = await resposta.json()

  await expect(
    page.getByText(
      `Chamado #${chamado.id} cadastrado com sucesso! Status inicial: Aberto.`,
      { exact: true },
    ),
  ).toBeVisible()

  await expect(page.getByLabel('Título', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('Descrição', { exact: true })).toHaveValue('')

  const item = await localizarChamado(page, titulo)

  await expect(item.getByText(descricao, { exact: true })).toBeVisible()
  await expect(item.getByText('Aberto', { exact: true })).toBeVisible()

  await page.reload()

  const itemAposRecarga = await localizarChamado(page, titulo)

  await expect(
    itemAposRecarga.getByText(descricao, { exact: true }),
  ).toBeVisible()

  await expect(
    itemAposRecarga.getByText('Aberto', { exact: true }),
  ).toBeVisible()
})