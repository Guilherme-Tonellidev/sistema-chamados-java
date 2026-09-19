import { test, expect } from '@playwright/test'
import { criarUsuarioTeste } from './autenticacao'

test('rejeita senha incorreta, mantém a sessão após recarregar e encerra no logout', async ({
  page,
  request,
}) => {
  const usuario = await criarUsuarioTeste(request)

  await page.goto('/')

  await page.getByLabel('E-mail', { exact: true }).fill(usuario.email)
  await page.getByLabel('Senha', { exact: true }).fill(
    'SenhaIncorreta-E2E-2026!',
  )

  await page.getByRole('button', {
    name: 'Entrar',
    exact: true,
  }).click()

  await expect(page.getByRole('alert')).toHaveText(
    'E-mail ou senha inválidos.',
  )
  await expect(
    page.getByLabel('E-mail', { exact: true }),
  ).toHaveValue(usuario.email)
  await expect(
    page.getByLabel('Senha', { exact: true }),
  ).toHaveValue('')
  await expect(
    page.getByRole('button', { name: 'Sair', exact: true }),
  ).toHaveCount(0)

  // Entra com a senha correta.
  await page.getByLabel('Senha', { exact: true }).fill(usuario.senha)

  await page.getByRole('button', {
    name: 'Entrar',
    exact: true,
  }).click()

  await expect(
    page.getByRole('button', { name: 'Atualizar lista', exact: true }),
  ).toBeEnabled()

  await expect(page.getByText(usuario.nome, { exact: true })).toBeVisible()

  // Confere a sessão por uma nova consulta da interface.
  await page.reload()

  await expect(
    page.getByRole('button', { name: 'Atualizar lista', exact: true }),
  ).toBeEnabled()

  await expect(
    page.getByRole('button', { name: 'Sair', exact: true }),
  ).toBeVisible()

  // Encerra a sessão.
  await page.getByRole('button', {
    name: 'Sair',
    exact: true,
  }).click()

  await expect(
    page.getByRole('heading', { name: 'Entrar', exact: true }),
  ).toBeVisible()

  // Confere o encerramento também no servidor, usando os cookies do navegador.
  const sessao = await page.request.get('/api/auth/me')
  expect(sessao.status()).toBe(401)

  await page.reload()

  await expect(
    page.getByRole('heading', { name: 'Entrar', exact: true }),
  ).toBeVisible()

  await expect(
    page.getByRole('button', { name: 'Atualizar lista', exact: true }),
  ).toHaveCount(0)
})