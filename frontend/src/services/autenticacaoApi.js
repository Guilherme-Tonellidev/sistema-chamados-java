const URL_BASE = '/api/auth'

async function lerResposta(resposta, mensagemErro) {
  const resultado = await resposta.json().catch(() => null)

  if (!resposta.ok) {
    throw new Error(resultado?.erro || mensagemErro)
  }

  return resultado
}

export async function obterCsrf() {
  const resposta = await fetch(`${URL_BASE}/csrf`, {
    credentials: 'same-origin',
    cache: 'no-store',
  })

  const dados = await lerResposta(
    resposta,
    'Não foi possível preparar a operação. Tente novamente.',
  )

  if (
    typeof dados?.headerName !== 'string' ||
    typeof dados?.token !== 'string' ||
    !dados.headerName ||
    !dados.token
  ) {
    throw new Error('O serviço retornou uma resposta de segurança inválida.')
  }

  return dados
}

export async function consultarSessao({ signal } = {}) {
  const resposta = await fetch(`${URL_BASE}/me`, {
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
  })

  if (resposta.status === 401) {
    return null
  }

  const usuario = await lerResposta(
    resposta,
    'Não foi possível consultar a sessão.',
  )

  if (
    !usuario ||
    usuario.id == null ||
    typeof usuario.nome !== 'string' ||
    typeof usuario.email !== 'string' ||
    usuario.ativo !== true
  ) {
    throw new Error('O serviço retornou uma sessão inválida.')
  }

  return usuario
}

export async function entrar(email, senha) {
  const csrf = await obterCsrf()

  const resposta = await fetch(`${URL_BASE}/login`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      [csrf.headerName]: csrf.token,
    },
    body: new URLSearchParams({
      email: email.trim(),
      senha,
    }).toString(),
  })

  if (!resposta.ok) {
    await lerResposta(resposta, 'Não foi possível entrar.')
  }

  const usuario = await consultarSessao()

  if (!usuario) {
    throw new Error('Não foi possível confirmar a sessão. Tente entrar novamente.')
  }

  return usuario
}

export async function sair() {
  // Busca um token atual, pois o login renova a proteção CSRF.
  const csrf = await obterCsrf()

  const resposta = await fetch(`${URL_BASE}/logout`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      [csrf.headerName]: csrf.token,
    },
  })

  if (!resposta.ok) {
    await lerResposta(resposta, 'Não foi possível encerrar a sessão.')
  }
}