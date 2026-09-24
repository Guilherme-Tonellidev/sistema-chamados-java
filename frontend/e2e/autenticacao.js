import { randomUUID } from 'node:crypto'
import { test as testeBase, expect } from '@playwright/test'

export const tecnicoTeste = {
  email: 'tecnico@example.com',
  senha: 'TecnicoTeste2026!',
}

export async function obterCabecalhosCsrf(request) {
  const resposta = await request.get('/api/auth/csrf')

  expect(resposta.status()).toBe(200)

  const dados = await resposta.json()

  expect(typeof dados.headerName).toBe('string')
  expect(typeof dados.token).toBe('string')
  expect(dados.headerName.length).toBeGreaterThan(0)
  expect(dados.token.length).toBeGreaterThan(0)

  return {
    [dados.headerName]: dados.token,
  }
}

export async function criarUsuarioTeste(request) {
  const usuario = {
    nome: 'Usuario E2E',
    email: `e2e-${randomUUID()}@example.com`,
    senha: 'SenhaTemporaria-E2E-2026!',
  }

  const headers = await obterCabecalhosCsrf(request)

  const resposta = await request.post('/api/usuarios', {
    headers,
    data: usuario,
  })

  expect(resposta.status()).toBe(201)

  return usuario
}

export async function entrarPelaInterface(page, usuario) {
  await page.goto('/')

  await page.getByLabel('E-mail', { exact: true }).fill(usuario.email)
  await page.getByLabel('Senha', { exact: true }).fill(usuario.senha)

  await page.getByRole('button', {
    name: 'Entrar',
    exact: true,
  }).click()

  await expect(
    page.getByRole('button', { name: 'Sair', exact: true }),
  ).toBeVisible()

  await expect(
    page.getByRole('button', { name: 'Atualizar lista', exact: true }),
  ).toBeEnabled()
}

// Prepara um usuário novo e faz login antes dos testes de chamados.
export const test = testeBase.extend({
  page: async ({ page, request }, executarTeste) => {
    const usuario = await criarUsuarioTeste(request)
    await entrarPelaInterface(page, usuario)
    await executarTeste(page)
  },
})

export { expect }