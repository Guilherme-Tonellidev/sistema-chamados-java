package br.com.guilhermetonelli.chamados;

import java.util.List;

public record PaginaChamadosResposta(
    List<Chamado> chamados,
    int pagina,
    int tamanho,
    long totalElementos,
    int totalPaginas,
    boolean temProxima
) {
}