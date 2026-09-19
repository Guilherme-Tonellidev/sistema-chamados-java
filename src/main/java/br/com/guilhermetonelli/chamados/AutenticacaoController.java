package br.com.guilhermetonelli.chamados;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/auth")
public class AutenticacaoController {

    private final UsuarioRepository repository;

    public AutenticacaoController(UsuarioRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/csrf")
    public CsrfResposta obterCsrf(CsrfToken csrfToken) {
        return new CsrfResposta(
            csrfToken.getHeaderName(),
            csrfToken.getToken()
        );
    }

    @GetMapping("/me")
    public UsuarioResposta consultarUsuario(Authentication authentication) {
        Usuario usuario = repository.findByEmail(authentication.getName())
            .filter(Usuario::isAtivo)
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.UNAUTHORIZED)
            );

        return UsuarioResposta.de(usuario);
    }

    public record CsrfResposta(String headerName, String token) {
    }
}