package br.com.guilhermetonelli.chamados;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CriarUsuarioRequest(
    String nome,
    String email,
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String senha
) {

    @Override
    public String toString() {
        return "CriarUsuarioRequest[conteudo omitido]";
    }
}