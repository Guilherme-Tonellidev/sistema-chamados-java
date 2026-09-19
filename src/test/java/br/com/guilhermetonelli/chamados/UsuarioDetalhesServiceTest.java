package br.com.guilhermetonelli.chamados;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class UsuarioDetalhesServiceTest {

    // Valor fictício: estes testes não verificam senhas com BCrypt.
    private static final String HASH_TESTE = "hash-ficticio-para-teste";

    @Mock
    private UsuarioRepository repository;

    @InjectMocks
    private UsuarioDetalhesService service;

    @Test
    void deveNormalizarEmailECarregarDadosDoUsuario() {
        Usuario usuario = new Usuario(
            "Usuario Teste",
            "teste@example.com",
            HASH_TESTE
        );

        when(repository.findByEmail("teste@example.com"))
            .thenReturn(Optional.of(usuario));

        UserDetails detalhes = service.loadUserByUsername(
            "  TESTE@EXAMPLE.COM  "
        );

        assertEquals("teste@example.com", detalhes.getUsername());
        assertEquals(HASH_TESTE, detalhes.getPassword());
        assertTrue(detalhes.isEnabled());
        assertTrue(detalhes.getAuthorities().isEmpty());

        verify(repository).findByEmail("teste@example.com");
    }

    @Test
    void deveRejeitarUsuarioInexistente() {
        when(repository.findByEmail("ausente@example.com"))
            .thenReturn(Optional.empty());

        UsernameNotFoundException erro = assertThrows(
            UsernameNotFoundException.class,
            () -> service.loadUserByUsername("ausente@example.com")
        );

        assertEquals("Credenciais inválidas.", erro.getMessage());
    }

    @Test
    void deveRejeitarEmailAusenteSemConsultarRepositorio() {
        for (String email : new String[] { null, "", "   " }) {
            assertThrows(
                UsernameNotFoundException.class,
                () -> service.loadUserByUsername(email)
            );
        }

        verifyNoInteractions(repository);
    }

    @Test
    void deveRepresentarUsuarioInativoComoDesabilitado() {
        Usuario usuario = new Usuario(
            "Usuario Inativo",
            "inativo@example.com",
            HASH_TESTE
        );

        ReflectionTestUtils.setField(usuario, "ativo", false);

        when(repository.findByEmail("inativo@example.com"))
            .thenReturn(Optional.of(usuario));

        UserDetails detalhes = service.loadUserByUsername(
            "inativo@example.com"
        );

        assertFalse(detalhes.isEnabled());
    }
}