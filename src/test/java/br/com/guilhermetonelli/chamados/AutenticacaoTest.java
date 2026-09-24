package br.com.guilhermetonelli.chamados;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AutenticacaoTest {

    private static final String EMAIL = "login@example.com";
    private static final String SENHA = "SenhaDeTeste-2026!";

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UsuarioRepository repository;

    @Autowired
    private ChamadoRepository chamadoRepository;

    @BeforeEach
        void preparar() {
        chamadoRepository.deleteAll();
        chamadoRepository.flush();

        repository.deleteAll();
        repository.flush();

    Usuario usuario = new Usuario(
        "Usuario Login",
        EMAIL,
        passwordEncoder.encode(SENHA)
    );

        repository.saveAndFlush(usuario);
    }

    @Test
    void deveAutenticarComSenhaCorretaERemoverCredenciaisDoResultado() {
        Authentication resultado = autenticar(EMAIL, SENHA);

        assertTrue(resultado.isAuthenticated());
        assertEquals(EMAIL, resultado.getName());
        assertNull(resultado.getCredentials());

        UserDetails detalhes = (UserDetails) resultado.getPrincipal();
        assertNull(detalhes.getPassword());

        Usuario persistido = repository.findByEmail(EMAIL).orElseThrow();
        assertTrue(passwordEncoder.matches(SENHA, persistido.getSenhaHash()));
    }

    @Test
    void deveAutenticarNormalizandoEmail() {
        Authentication resultado = autenticar(
            "  LOGIN@EXAMPLE.COM  ",
            SENHA
        );

        assertTrue(resultado.isAuthenticated());
        assertEquals(EMAIL, resultado.getName());
    }

    @Test
    void deveRejeitarSenhaIncorreta() {
        assertThrows(
            BadCredentialsException.class,
            () -> autenticar(EMAIL, "OutraSenhaDeTeste-2026!")
        );
    }

    @Test
    void deveRejeitarUsuarioInexistenteComoCredenciaisInvalidas() {
        assertThrows(
            BadCredentialsException.class,
            () -> autenticar("ausente@example.com", SENHA)
        );
    }

    @Test
    void deveRejeitarUsuarioInativoMesmoComSenhaCorreta() {
        Usuario usuario = repository.findByEmail(EMAIL).orElseThrow();

        ReflectionTestUtils.setField(usuario, "ativo", false);
        repository.saveAndFlush(usuario);

        assertThrows(
            DisabledException.class,
            () -> autenticar(EMAIL, SENHA)
        );
    }

    private Authentication autenticar(String email, String senha) {
        return authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken.unauthenticated(
                email,
                senha
            )
        );
    }
}