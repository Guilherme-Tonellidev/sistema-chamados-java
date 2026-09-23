import { useEffect, useRef, useState } from 'react'
import StatusChamado from './StatusChamado'
import {
  buscarChamado,
  listarFotosChamado,
  enviarFotosChamado,
  urlFotoChamado,
} from '../services/chamadosApi'

const MAX_FOTOS = 5
const MAX_BYTES = 5 * 1024 * 1024

const formatadorData = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function formatarData(valor) {
  if (!valor) {
    return 'Não registrada'
  }

  const data = new Date(valor)

  return Number.isNaN(data.getTime())
    ? 'Indisponível'
    : formatadorData.format(data)
}

function mensagemErro(error) {
  return error instanceof TypeError
    ? 'Não foi possível conectar ao serviço. Tente novamente.'
    : error.message
}

function PreviaFoto({ arquivo }) {
  const imagemRef = useRef(null)

  useEffect(() => {
    const imagem = imagemRef.current
    const endereco = URL.createObjectURL(arquivo)

    imagem.src = endereco

    return () => {
      imagem.removeAttribute('src')
      URL.revokeObjectURL(endereco)
    }
  }, [arquivo])

  return (
    <img
      ref={imagemRef}
      alt={`Prévia de ${arquivo.name}`}
    />
  )
}

export default function DetalhesChamado({
  chamadoId,
  aoFechar,
  avisoInicial = '',
}) {
  const dialogo = useRef(null)
  const entradaFotos = useRef(null)
  const envioEmAndamento = useRef(false)

  const [chamado, setChamado] = useState(null)
  const [fotos, setFotos] = useState([])
  const [arquivos, setArquivos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [erroFotos, setErroFotos] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [tentativa, setTentativa] = useState(0)
  const [precisaConferir, setPrecisaConferir] = useState(false)
  const [conferindo, setConferindo] = useState(false)

  const ocupado = enviando || conferindo

  useEffect(() => {
    const elemento = dialogo.current
    elemento.showModal()

    return () => {
      if (elemento.open) {
        elemento.close()
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function carregar() {
      setCarregando(true)
      setErro('')

      try {
        const [dadosChamado, fotosChamado] = await Promise.all([
          buscarChamado(chamadoId, { signal: controller.signal }),
          listarFotosChamado(chamadoId, { signal: controller.signal }),
        ])

        if (!controller.signal.aborted) {
          setChamado(dadosChamado)
          setFotos(fotosChamado)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setErro(mensagemErro(error))
        }
      } finally {
        if (!controller.signal.aborted) {
          setCarregando(false)
        }
      }
    }

    carregar()

    return () => controller.abort()
  }, [chamadoId, tentativa])

  function fechar() {
    if (!envioEmAndamento.current && !conferindo) {
      aoFechar()
    }
  }

  function selecionarFotos(event) {
    const selecionados = Array.from(event.target.files || [])
    event.target.value = ''

    setErroFotos('')
    setSucesso('')

    if (fotos.length + arquivos.length + selecionados.length > MAX_FOTOS) {
      setErroFotos('Cada chamado pode ter no máximo 5 fotos.')
      return
    }

    for (const arquivo of selecionados) {
      if (!['image/jpeg', 'image/png'].includes(arquivo.type)) {
        setErroFotos('Selecione somente imagens JPEG ou PNG.')
        return
      }

      if (arquivo.size === 0 || arquivo.size > MAX_BYTES) {
        setErroFotos('Cada foto deve conter dados e ter no máximo 5 MB.')
        return
      }
    }

    setArquivos((atuais) => [...atuais, ...selecionados])
  }

  function removerSelecionada(indice) {
    setArquivos((atuais) =>
      atuais.filter((_, posicao) => posicao !== indice),
    )
    setErroFotos('')
  }

  async function conferirFotos() {
    if (conferindo || envioEmAndamento.current) {
      return
    }

    setConferindo(true)

    try {
      const lista = await listarFotosChamado(chamadoId)
      setFotos(lista)
      setArquivos([])
      setPrecisaConferir(false)
      setErroFotos('')
      setSucesso(
        'Fotos atualizadas. Confira a galeria antes de selecionar novos arquivos.',
      )
    } catch (error) {
      setErroFotos(mensagemErro(error))
    } finally {
      setConferindo(false)
    }
  }

  async function enviar() {
    if (
      envioEmAndamento.current ||
      precisaConferir ||
      arquivos.length === 0
    ) {
      return
    }

    envioEmAndamento.current = true
    setEnviando(true)
    setErroFotos('')
    setSucesso('')

    try {
      await enviarFotosChamado(chamadoId, arquivos)

      // O envio já terminou. Não mantém arquivos selecionados
      // para evitar um segundo envio acidental.
      setArquivos([])

      const lista = await listarFotosChamado(chamadoId)
      setFotos(lista)
      setSucesso('Fotos adicionadas com sucesso.')
    } catch (error) {
      setPrecisaConferir(true)
      setErroFotos(
        `${mensagemErro(error)} Atualize as fotos antes de tentar outro envio.`,
      )
    } finally {
      envioEmAndamento.current = false
      setEnviando(false)
    }
  }

  return (
    <dialog
      ref={dialogo}
      className="detalhes-dialogo"
      aria-labelledby="detalhes-titulo"
      onCancel={(event) => {
        event.preventDefault()
        fechar()
      }}
    >
      <header className="detalhes-cabecalho">
        <div>
          <p className="detalhes-marca">EloDesk</p>
          <h2 id="detalhes-titulo">Chamado #{chamadoId}</h2>
        </div>

        <button
          type="button"
          className="detalhes-fechar"
          onClick={fechar}
          disabled={ocupado}
          aria-label="Fechar detalhes do chamado"
          autoFocus
        >
          ✕
        </button>
      </header>

      <div className="detalhes-corpo" aria-busy={carregando}>
        {avisoInicial && (
          <p className="erro" role="alert">
        {avisoInicial}
       </p>
      )}
        {carregando ? (
          <p className="mensagem" role="status">
            Carregando detalhes…
          </p>
        ) : erro ? (
          <div className="erro" role="alert">
            <p>{erro}</p>
            <button
              type="button"
              onClick={() => setTentativa((atual) => atual + 1)}
            >
              Tentar novamente
            </button>
          </div>
        ) : chamado ? (
          <>
            <section className="detalhes-bloco">
              <div className="detalhes-resumo">
                <h3>{chamado.titulo}</h3>
                <StatusChamado chamado={chamado} />
              </div>

              <dl className="detalhes-dados">
                <div>
                  <dt>Prioridade</dt>
                  <dd>{chamado.prioridade || 'Não informada'}</dd>
                </div>

                <div>
                  <dt>Abertura</dt>
                  <dd>{formatarData(chamado.dataAbertura)}</dd>
                </div>

                <div>
                  <dt>Início do atendimento</dt>
                  <dd>{formatarData(chamado.dataInicioAtendimento)}</dd>
                </div>

                <div>
                  <dt>Resolução</dt>
                  <dd>{formatarData(chamado.dataResolucao)}</dd>
                </div>
              </dl>

              <h4>Descrição do problema</h4>
              <p className="detalhes-descricao">{chamado.descricao}</p>
            </section>

            <section
              className="detalhes-bloco"
              aria-labelledby="detalhes-fotos-titulo"
            >
              <div className="detalhes-fotos-topo">
                <h3 id="detalhes-fotos-titulo">Fotos do chamado</h3>
                <span>{fotos.length} de 5 fotos</span>
              </div>

              <p className="subtitulo">
                Clique em uma foto para abri-la em outra aba.
              </p>

              {fotos.length === 0 ? (
                <p className="detalhes-vazio">
                  Nenhuma foto adicionada.
                </p>
              ) : (
                <ul className="detalhes-galeria">
                  {fotos.map((foto, indice) => (
                    <li key={foto.id}>
                      <a
                        href={urlFotoChamado(chamadoId, foto.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Abrir foto ${indice + 1} em outra aba`}
                      >
                        <img
                          src={urlFotoChamado(chamadoId, foto.id)}
                          alt={`Foto ${indice + 1} do chamado #${chamadoId}`}
                          loading="lazy"
                        />
                        <span>Foto {indice + 1} ↗</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}

              <div className="detalhes-upload" aria-busy={ocupado}>
                <p className="subtitulo">
                  JPEG ou PNG. Até 5 MB e 12 megapixels por foto.
                </p>

                <input
                  ref={entradaFotos}
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  hidden
                  onChange={selecionarFotos}
                  disabled={ocupado || precisaConferir}
                  aria-label="Selecionar fotos do chamado"
                />

                <button
                  type="button"
                  onClick={() => entradaFotos.current.click()}
                  disabled={
                    ocupado ||
                    precisaConferir ||
                    fotos.length + arquivos.length >= MAX_FOTOS
                  }
                >
                  + Selecionar fotos
                </button>

                {arquivos.length > 0 && (
                  <>
                    <h4>Fotos selecionadas — ainda não enviadas</h4>

                    <ul className="detalhes-galeria">
                      {arquivos.map((arquivo, indice) => (
                        <li
                          key={`${arquivo.name}-${arquivo.lastModified}-${indice}`}
                          className="detalhes-previa"
                        >
                          <PreviaFoto arquivo={arquivo} />
                          <span className="detalhes-nome-arquivo">
                            {arquivo.name}
                          </span>

                          <button
                            type="button"
                            onClick={() => removerSelecionada(indice)}
                            disabled={ocupado || precisaConferir}
                            aria-label={`Remover seleção de ${arquivo.name}`}
                          >
                            Remover
                          </button>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      className="botao-primario"
                      onClick={enviar}
                      disabled={ocupado || precisaConferir}
                    >
                      {enviando ? 'Enviando…' : 'Enviar fotos'}
                    </button>
                  </>
                )}

                {erroFotos && (
                  <p className="erro" role="alert">
                    {erroFotos}
                  </p>
                )}

                {precisaConferir && (
                  <button
                    type="button"
                    onClick={conferirFotos}
                    disabled={ocupado}
                  >
                    {conferindo ? 'Atualizando…' : 'Atualizar fotos'}
                  </button>
                )}

                {sucesso && (
                  <p className="aviso-cadastro sucesso" role="status">
                    {sucesso}
                  </p>
                )}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </dialog>
  )
}