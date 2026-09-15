package br.com.guilhermetonelli.chamados;

public record CriarChamadoRequest(
    String titulo,
    String descricao,
    String prioridade
) {

    public CriarChamadoRequest(String titulo, String descricao) {
        this(titulo, descricao, null);
    }
}