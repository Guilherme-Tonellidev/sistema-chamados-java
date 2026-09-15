export default function FormularioChamado({
  titulo,
  descricao,
  prioridade,
  salvando,
  bloqueado,
  erro,
  sucesso,
  aoAlterarTitulo,
  aoAlterarDescricao,
  aoAlterarPrioridade,
  aoCadastrar,
}) {
  return (
    <section
      className="conteudo cadastro"
      aria-labelledby="titulo-cadastro"
    >
      <h2 id="titulo-cadastro">Novo chamado</h2>
      <p className="subtitulo">
        Informe o problema para abrir uma solicitação de suporte.
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

        {erro && (
          <div className="aviso-cadastro erro" role="alert">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="aviso-cadastro sucesso" role="status">
            <p>{sucesso}</p>
            <p>
              O filtro e a página foram mantidos. Para localizar o novo
              chamado, selecione Todos os status ou Aberto e avance até
              a última página.
            </p>
          </div>
        )}

        <div className="acoes-formulario">
          <p className="subtitulo">Todos os campos são obrigatórios.</p>
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