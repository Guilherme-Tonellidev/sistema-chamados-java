const URL_BASE = '/api/chamados'

async function lerResposta(resposta, mensagemErro) {
  const resultado = await resposta.json().catch(() => null)

  if (!resposta.ok) {
    throw new Error(resultado?.erro || mensagemErro)
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
    { signal },
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

  const resposta = await fetch(URL_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  })

  return lerResposta(
    resposta,
    'Não foi possível cadastrar o chamado.',
  )
}

async function enviarTransicao(id, endpoint) {
  const resposta = await fetch(
    `${URL_BASE}/${id}/${endpoint}`,
    { method: 'PATCH' },
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