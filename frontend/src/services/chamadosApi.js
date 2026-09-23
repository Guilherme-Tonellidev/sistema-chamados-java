import { obterCsrf } from './autenticacaoApi'

const URL_BASE = '/api/chamados'

async function lerResposta(resposta, mensagemErro) {
  const resultado = await resposta.json().catch(() => null)

  if (!resposta.ok) {
    throw new Error(
      resposta.status === 401
        ? 'Sua sessão expirou. Recarregue a página para entrar novamente.'
        : resultado?.erro || mensagemErro,
    )
  }

  return resultado
}

export async function listarChamados({
  pagina = 0,
  tamanho = 5,
  status = '',
  prioridade = '',
  signal,
} = {}) {
  const parametros = new URLSearchParams({
    pagina: String(pagina),
    tamanho: String(tamanho),
  })

  if (status) {
    parametros.set('status', status)
  }

  if (prioridade) {
    parametros.set('prioridade', prioridade)
  }

  const resposta = await fetch(
    `${URL_BASE}/paginados?${parametros}`,
    {
      credentials: 'same-origin',
      signal,
    },
  )

  const resultado = await lerResposta(
    resposta,
    'Não foi possível carregar os chamados.',
  )

  if (!resultado || !Array.isArray(resultado.chamados)) {
    throw new Error(
      'A resposta recebida não contém uma lista de chamados.',
    )
  }

  return resultado
}

export async function criarChamado({
  titulo,
  descricao,
  prioridade = 'Normal',
}) {
  const dados = { titulo, descricao }

  // A API já utiliza Normal quando a prioridade não é enviada.
  if (prioridade !== 'Normal') {
    dados.prioridade = prioridade
  }

  const csrf = await obterCsrf()

  const resposta = await fetch(URL_BASE, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      [csrf.headerName]: csrf.token,
    },
    body: JSON.stringify(dados),
  })

  return lerResposta(
    resposta,
    'Não foi possível cadastrar o chamado.',
  )
}

async function enviarTransicao(id, endpoint) {
  const csrf = await obterCsrf()

  const resposta = await fetch(
    `${URL_BASE}/${id}/${endpoint}`,
    {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: {
        [csrf.headerName]: csrf.token,
      },
    },
  )

  return lerResposta(
    resposta,
    'Não foi possível alterar o status do chamado.',
  )
}

export function iniciarAtendimento(id) {
  return enviarTransicao(id, 'atendimento')
}

export function resolverChamado(id) {
  return enviarTransicao(id, 'resolucao')
}

export async function buscarChamado(id, { signal } = {}) {
  const resposta = await fetch(`${URL_BASE}/${id}`, {
    credentials: 'same-origin',
    signal,
  })

  return lerResposta(
    resposta,
    'Não foi possível carregar os detalhes do chamado.',
  )
}

export async function listarFotosChamado(id, { signal } = {}) {
  const resposta = await fetch(`${URL_BASE}/${id}/fotos`, {
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
  })

  const resultado = await lerResposta(
    resposta,
    'Não foi possível carregar as fotos.',
  )

  if (!Array.isArray(resultado)) {
    throw new Error('A resposta recebida não contém uma lista de fotos.')
  }

  return resultado
}

export async function enviarFotosChamado(id, arquivos) {
  const csrf = await obterCsrf()
  const formulario = new FormData()

  for (const arquivo of arquivos) {
    formulario.append('fotos', arquivo)
  }

  const resposta = await fetch(`${URL_BASE}/${id}/fotos`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      [csrf.headerName]: csrf.token,
    },
    body: formulario,
  })

  return lerResposta(resposta, 'Não foi possível enviar as fotos.')
}

export function urlFotoChamado(chamadoId, fotoId) {
  return `${URL_BASE}/${encodeURIComponent(chamadoId)}/fotos/${encodeURIComponent(fotoId)}`
}