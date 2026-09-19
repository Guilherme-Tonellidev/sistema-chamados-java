package br.com.guilhermetonelli.chamados;

public record UsuarioResposta(
    Integer id,
    String nome,
    String email,
    boolean ativo
) {

    public static UsuarioResposta de(Usuario usuario) {
        return new UsuarioResposta(
            usuario.getId(),
            usuario.getNome(),
            usuario.getEmail(),
            usuario.isAtivo()
        );
    }
}