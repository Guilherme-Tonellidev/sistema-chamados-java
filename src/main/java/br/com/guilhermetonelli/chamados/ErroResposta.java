package br.com.guilhermetonelli.chamados;

public record ErroResposta(
    int status,
    String erro,
    String caminho
) {
}