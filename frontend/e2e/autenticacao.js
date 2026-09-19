import { randomUUID } from 'node:crypto'
import { test as testeBase, expect } from '@playwright/test'

export async function criarUsuarioTeste(request) {
  const usuario = {
    nome: 'Usuario E2E',
    email: `e2e-${randomUUID()}@example.com`,
    senha: 'SenhaTemporaria-E2E-2026!',
  }

  const resposta = await request.post('/api/usuarios', {
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

// Os testes de chamados começam com um usuário novo e autenticado.
export const test = testeBase.extend({
  page: async ({ page, request }, executarTeste) => {
    const usuario = await criarUsuarioTeste(request)
    await entrarPelaInterface(page, usuario)
    await executarTeste(page)
  },
})

export { expect }