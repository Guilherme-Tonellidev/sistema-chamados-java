package br.com.guilhermetonelli.chamados;

public record CriarChamadoRequest(
    String titulo,
    String descricao
) {
}