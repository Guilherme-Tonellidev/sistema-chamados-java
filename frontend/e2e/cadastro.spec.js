import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import {
  test,
  expect,
  entrarPelaInterface,
  obterCabecalhosCsrf,
  tecnicoTeste,
} from './autenticacao'

async function aguardarLista(page) {
  await expect(
    page.getByRole('button', {
      name: 'Atualizar lista',
      exact: true,
    }),
  ).toBeEnabled()
}

function aguardarResposta(page, caminho, metodo) {
  return page.waitForResponse((resposta) => {
    const url = new URL(resposta.url())

    return (
      url.pathname === caminho &&
      resposta.request().method() === metodo
    )
  })
}

async function localizarChamado(page, titulo) {
  await aguardarLista(page)

  const tabela = page.getByRole('table', {
    name: 'Chamados da página atual',
  })

  const botaoTitulo = tabela.getByRole('button', {
    name: titulo,
    exact: true,
  })

  const proxima = page.getByRole('button', {
    name: 'Próxima',
    exact: true,
  })

  while (!(await botaoTitulo.isVisible())) {
    await expect(proxima).toBeEnabled()

    const respostaPendente = aguardarResposta(
      page,
      '/api/chamados/paginados',
      'GET',
    )

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

  await expect(botaoTitulo).toBeVisible()

  return tabela.getByRole('row').filter({
    has: page.getByRole('button', {
      name: titulo,
      exact: true,
    }),
  })
}

async function criarFotoTeste(page) {
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 48

    const contexto = canvas.getContext('2d')

    if (!contexto) {
      throw new Error('Não foi possível gerar a imagem do teste.')
    }

    contexto.fillStyle = '#8193ff'
    contexto.fillRect(0, 0, 64, 48)
    contexto.fillStyle = '#ffffff'
    contexto.fillRect(16, 12, 32, 24)

    return canvas.toDataURL('image/png').split(',')[1]
  })

  return {
    name: 'problema-e2e.png',
    mimeType: 'image/png',
    buffer: Buffer.from(base64, 'base64'),
  }
}

async function conferirDetalhes(page, chamado, descricao, status) {
  const dialogo = page.getByRole('dialog', {
    name: `Chamado #${chamado.id}`,
    exact: true,
  })

  await expect(dialogo).toBeVisible()

  await expect(
    dialogo.getByRole('heading', {
      name: chamado.titulo,
      exact: true,
    }),
  ).toBeVisible()

  await expect(
    dialogo.getByText(descricao, { exact: true }),
  ).toBeVisible()

  await expect(
    dialogo.getByText(status, { exact: true }),
  ).toBeVisible()

  await expect(
    dialogo.getByText('1 de 5 fotos', { exact: true }),
  ).toBeVisible()

  const imagem = dialogo.getByRole('img', {
    name: `Foto 1 do chamado #${chamado.id}`,
    exact: true,
  })

  await expect(imagem).toBeVisible()

  // Confere se o navegador realmente carregou a imagem,
  // não apenas se existe uma tag <img>.
  await expect.poll(() =>
    imagem.evaluate((elemento) =>
      elemento.complete &&
      elemento.naturalWidth === 64 &&
      elemento.naturalHeight === 48,
    ),
  ).toBe(true)

  return dialogo
}

async function fecharDetalhes(page, dialogo) {
  await dialogo.getByRole('button', {
    name: 'Fechar detalhes do chamado',
    exact: true,
  }).click()

  await expect(page.getByRole('dialog')).toHaveCount(0)
  await aguardarLista(page)
}

test(
  'cadastra com foto, consulta detalhes e mantém fotos e status após recarregar',
  async ({ page }) => {
    const titulo = `Teste E2E ${randomUUID()}`
    const descricao =
      'Chamado criado pelo teste automatizado no banco temporário.'

    await page.goto('/')
    await aguardarLista(page)

    await page.getByRole('button', {
      name: '+ Criar chamado',
      exact: true,
    }).click()

    const cadastro = page.getByRole('region', {
      name: 'Novo chamado',
      exact: true,
    })

    await cadastro.getByLabel('Título', { exact: true }).fill(titulo)
    await cadastro.getByLabel('Descrição', { exact: true }).fill(descricao)

    const foto = await criarFotoTeste(page)

    // Usa o botão real de seleção para verificar o fluxo do usuário.
    const seletorPendente = page.waitForEvent('filechooser')

    await cadastro.getByRole('button', {
      name: '+ Adicionar fotos',
      exact: true,
    }).click()

    const seletor = await seletorPendente
    await seletor.setFiles(foto)

    await expect(
      cadastro.getByRole('img', {
        name: 'Prévia de problema-e2e.png',
        exact: true,
      }),
    ).toBeVisible()

    const cadastroPendente = aguardarResposta(
      page,
      '/api/chamados',
      'POST',
    )

    const fotosPendentes = page.waitForResponse((resposta) => {
      const url = new URL(resposta.url())

      return (
        /^\/api\/chamados\/\d+\/fotos$/.test(url.pathname) &&
        resposta.request().method() === 'POST'
      )
    })

    await cadastro.getByRole('button', {
      name: 'Cadastrar chamado',
      exact: true,
    }).click()

    const respostaCadastro = await cadastroPendente
    expect(respostaCadastro.status()).toBe(201)

    const chamado = await respostaCadastro.json()

    const respostaFotos = await fotosPendentes
    expect(respostaFotos.status()).toBe(201)

    expect(new URL(respostaFotos.url()).pathname).toBe(
      `/api/chamados/${chamado.id}/fotos`,
    )

    const fotosSalvas = await respostaFotos.json()
    expect(fotosSalvas).toHaveLength(1)
    expect(fotosSalvas[0].tipo).toBe('image/png')

    let dialogo = await conferirDetalhes(
      page,
      chamado,
      descricao,
      'Aberto',
    )

    // Confere a abertura da foto em uma nova aba.
    const caminhoFoto =
      `/api/chamados/${chamado.id}/fotos/${fotosSalvas[0].id}`

    const linkFoto = dialogo.getByRole('link', {
      name: 'Abrir foto 1 em outra aba',
      exact: true,
    })

    await expect(linkFoto).toHaveAttribute('href', caminhoFoto)

    const novaAbaPendente = page.waitForEvent('popup')
    await linkFoto.click()

    const novaAba = await novaAbaPendente

    try {
      await novaAba.waitForURL((url) => url.pathname === caminhoFoto)
      await novaAba.waitForLoadState('domcontentloaded')

      const respostaImagem = await page.request.get(caminhoFoto)

      expect(respostaImagem.status()).toBe(200)
      expect(respostaImagem.headers()['content-type']).toContain('image/png')

      const bytes = await respostaImagem.body()

      // Assinatura binária de um arquivo PNG.
      expect([...bytes.subarray(0, 8)]).toEqual([
        137, 80, 78, 71, 13, 10, 26, 10,
      ])
    } finally {
      await novaAba.close()
    }

    await fecharDetalhes(page, dialogo)

    await expect(
      cadastro.getByText(
        `Chamado #${chamado.id} cadastrado com sucesso! Status inicial: Aberto.`,
        { exact: true },
      ),
    ).toBeVisible()

    await expect(
      cadastro.getByLabel('Título', { exact: true }),
    ).toHaveValue('')

    await expect(
      cadastro.getByLabel('Descrição', { exact: true }),
    ).toHaveValue('')

    await expect(
      cadastro.getByRole('img', {
        name: 'Prévia de problema-e2e.png',
        exact: true,
      }),
    ).toHaveCount(0)

    let linha = await localizarChamado(page, titulo)

    await expect(
      linha.getByText('Aberto', { exact: true }),
    ).toBeVisible()

    await expect(linha.getByText('Ver descrição')).toHaveCount(0)
    await expect(linha.getByText(descricao, { exact: true })).toHaveCount(0)

    // Recarrega para verificar a leitura dos dados salvos.
    await page.reload()

    linha = await localizarChamado(page, titulo)

    await linha.getByRole('button', {
      name: `Abrir chamado #${chamado.id}`,
      exact: true,
    }).click()

    dialogo = await conferirDetalhes(page, chamado, descricao, 'Aberto')

    await expect(
      dialogo.getByRole('link', {
        name: 'Abrir foto 1 em outra aba',
        exact: true,
      }),
    ).toHaveAttribute('href', caminhoFoto)

    // Testa o fechamento pelo teclado no navegador real.
    // Testa o fechamento pelo teclado no navegador real.
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toHaveCount(0)

      await aguardarLista(page)

      // O solicitante consulta o chamado, mas não recebe ações de atendimento.
      await expect(
        page.getByRole('columnheader', {
          name: 'Ações',
          exact: true,
        }),
      ).toHaveCount(0)

      await expect(
        linha.getByRole('button', {
          name: `Iniciar atendimento: chamado #${chamado.id}`,
          exact: true,
        }),
      ).toHaveCount(0)

      // Confere o perfil retornado pela sessão real.
      const sessaoSolicitante = await page.request.get('/api/auth/me')
      expect(sessaoSolicitante.status()).toBe(200)
      expect((await sessaoSolicitante.json()).perfil).toBe('SOLICITANTE')

      // Mesmo com CSRF válido, o backend deve impedir a alteração.
      const headers = await obterCabecalhosCsrf(page.request)

      const tentativaNegada = await page.request.patch(
        `/api/chamados/${chamado.id}/atendimento`,
        { headers },
      )

      expect(tentativaNegada.status()).toBe(403)

      const consultaAposNegativa = await page.request.get(
        `/api/chamados/${chamado.id}`,
      )

      expect(consultaAposNegativa.status()).toBe(200)
      expect((await consultaAposNegativa.json()).status).toBe('Aberto')

      // Encerra a sessão do solicitante pela interface.
      await page.getByRole('button', {
        name: 'Sair',
        exact: true,
      }).click()

      await expect(
        page.getByRole('button', {
          name: 'Entrar',
          exact: true,
        }),
      ).toBeVisible()

      // O Técnico de TI assume o atendimento do chamado.
      await entrarPelaInterface(page, tecnicoTeste)

      const sessaoTecnico = await page.request.get('/api/auth/me')
      expect(sessaoTecnico.status()).toBe(200)
      expect((await sessaoTecnico.json()).perfil).toBe('ATENDENTE')

      // O técnico pode visualizar outros chamados; procura o título novamente.
      linha = await localizarChamado(page, titulo)

      await expect(
        linha.getByText('Aberto', { exact: true }),
      ).toBeVisible()

      const atendimentoPendente = aguardarResposta(
      page,
      `/api/chamados/${chamado.id}/atendimento`,
      'PATCH',
    )

    await linha.getByRole('button', {
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
      linha.getByText('Em atendimento', { exact: true }),
    ).toBeVisible()

    await expect(
      linha.getByRole('button', {
        name: `Iniciar atendimento: chamado #${chamado.id}`,
        exact: true,
      }),
    ).toHaveCount(0)

    await expect(
      linha.getByRole('button', {
        name: `Resolver chamado: chamado #${chamado.id}`,
        exact: true,
      }),
    ).toBeEnabled()

    // Confere o atendimento e a foto após outra recarga.
    await page.reload()

    linha = await localizarChamado(page, titulo)

    await expect(
      linha.getByText('Em atendimento', { exact: true }),
    ).toBeVisible()

    await linha.getByRole('button', {
      name: titulo,
      exact: true,
    }).click()

    dialogo = await conferirDetalhes(
      page,
      chamado,
      descricao,
      'Em atendimento',
    )

    await fecharDetalhes(page, dialogo)

    const resolucaoPendente = aguardarResposta(
      page,
      `/api/chamados/${chamado.id}/resolucao`,
      'PATCH',
    )

    await linha.getByRole('button', {
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
      linha.getByText('Resolvido', { exact: true }),
    ).toBeVisible()

    // Resultado final persistido.
    await page.reload()

    linha = await localizarChamado(page, titulo)

    await expect(
      linha.getByText('Resolvido', { exact: true }),
    ).toBeVisible()

    await expect(
      linha.getByRole('button', {
        name: `Iniciar atendimento: chamado #${chamado.id}`,
        exact: true,
      }),
    ).toHaveCount(0)

    await expect(
      linha.getByRole('button', {
        name: `Resolver chamado: chamado #${chamado.id}`,
        exact: true,
      }),
    ).toHaveCount(0)

    // Os botões de abrir detalhes continuam disponíveis.
    await linha.getByRole('button', {
      name: titulo,
      exact: true,
    }).click()

    dialogo = await conferirDetalhes(
      page,
      chamado,
      descricao,
      'Resolvido',
    )

    await expect(
      dialogo.getByRole('link', {
        name: 'Abrir foto 1 em outra aba',
        exact: true,
      }),
    ).toHaveAttribute('href', caminhoFoto)

    await fecharDetalhes(page, dialogo)
  },
)