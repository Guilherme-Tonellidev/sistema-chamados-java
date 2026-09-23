import { useEffect, useRef, useState } from 'react'

function PreviaFotoCadastro({ arquivo }) {
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

export default function FormularioChamado({
  titulo,
  descricao,
  prioridade,
  fotos = [],
  salvando,
  bloqueado,
  erro,
  sucesso,
  aoAlterarTitulo,
  aoAlterarDescricao,
  aoAlterarPrioridade,
  aoAlterarFotos,
  aoCadastrar,
}) {
  const entradaFotos = useRef(null)
  const [erroSelecao, setErroSelecao] = useState('')

  function selecionarFotos(event) {
    const selecionadas = Array.from(event.target.files || [])
    event.target.value = ''
    setErroSelecao('')

    if (fotos.length + selecionadas.length > 5) {
      setErroSelecao('Selecione no máximo 5 fotos.')
      return
    }

    for (const foto of selecionadas) {
      if (!['image/jpeg', 'image/png'].includes(foto.type)) {
        setErroSelecao('Selecione somente imagens JPEG ou PNG.')
        return
      }

      if (foto.size === 0 || foto.size > 5 * 1024 * 1024) {
        setErroSelecao(
          'Cada foto deve conter dados e ter no máximo 5 MB.',
        )
        return
      }
    }

    aoAlterarFotos([...fotos, ...selecionadas])
  }

  function removerFoto(indice) {
    aoAlterarFotos(
      fotos.filter((_, posicao) => posicao !== indice),
    )
    setErroSelecao('')
  }

  return (
    <section
      className="conteudo cadastro"
      aria-labelledby="titulo-cadastro"
    >
      <h2 id="titulo-cadastro">Novo chamado</h2>
      <p className="subtitulo">
        Descreva o problema e, se quiser, adicione fotos para ajudar
        no atendimento.
      </p>

      <form
        className="formulario"
        onSubmit={aoCadastrar}
        aria-busy={salvando}
      >
        <div className="campo">
          <label htmlFor="titulo">Título</label>
          <input
            id="titulo"
            name="titulo"
            type="text"
            placeholder="Ex.: Impressora não imprime"
            value={titulo}
            onChange={(event) => aoAlterarTitulo(event.target.value)}
            disabled={bloqueado}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="descricao">Descrição</label>
          <textarea
            id="descricao"
            name="descricao"
            placeholder="Descreva o problema e o que você já tentou fazer."
            value={descricao}
            onChange={(event) => aoAlterarDescricao(event.target.value)}
            disabled={bloqueado}
            rows={5}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="prioridade">Prioridade</label>
          <select
            id="prioridade"
            name="prioridade"
            value={prioridade}
            onChange={(event) => aoAlterarPrioridade(event.target.value)}
            disabled={bloqueado}
            required
          >
            <option value="Baixa">Baixa</option>
            <option value="Normal">Normal</option>
            <option value="Alta">Alta</option>
          </select>
        </div>

        <section
          className="cadastro-fotos"
          aria-labelledby="cadastro-fotos-titulo"
        >
          <h3 id="cadastro-fotos-titulo">Fotos do problema</h3>
          <p className="subtitulo" id="cadastro-fotos-ajuda">
            Opcional. Até 5 fotos JPEG ou PNG, com no máximo
            5 MB e 12 megapixels por foto.
          </p>

          <input
            ref={entradaFotos}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            hidden
            onChange={selecionarFotos}
            disabled={bloqueado}
            aria-label="Selecionar fotos para o novo chamado"
            aria-describedby="cadastro-fotos-ajuda"
          />

          <button
            type="button"
            onClick={() => entradaFotos.current.click()}
            disabled={bloqueado || fotos.length >= 5}
          >
            + Adicionar fotos
          </button>

          {fotos.length > 0 && (
            <>
              <p className="subtitulo">
                {fotos.length} de 5 fotos selecionadas.
                Elas serão enviadas ao cadastrar.
              </p>

              <ul className="detalhes-galeria">
                {fotos.map((foto, indice) => (
                  <li
                    key={`${foto.name}-${foto.lastModified}-${indice}`}
                    className="detalhes-previa"
                  >
                    <PreviaFotoCadastro arquivo={foto} />

                    <span className="detalhes-nome-arquivo">
                      {foto.name}
                    </span>

                    <button
                      type="button"
                      onClick={() => removerFoto(indice)}
                      disabled={bloqueado}
                      aria-label={`Remover seleção de ${foto.name}`}
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {erroSelecao && (
            <p className="aviso-cadastro erro" role="alert">
              {erroSelecao}
            </p>
          )}
        </section>

        {erro && (
          <div className="aviso-cadastro erro" role="alert">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="aviso-cadastro sucesso" role="status">
            <p>{sucesso}</p>
            <p>
              O filtro e a página foram mantidos. Os detalhes do
              novo chamado são abertos após o cadastro.
            </p>
          </div>
        )}

        <div className="acoes-formulario">
          <p className="subtitulo">
            Título, descrição e prioridade são obrigatórios.
            As fotos são opcionais.
          </p>

          <button
            type="submit"
            className="botao-primario"
            disabled={bloqueado}
          >
            {salvando ? 'Cadastrando…' : 'Cadastrar chamado'}
          </button>
        </div>
      </form>
    </section>
  )
}