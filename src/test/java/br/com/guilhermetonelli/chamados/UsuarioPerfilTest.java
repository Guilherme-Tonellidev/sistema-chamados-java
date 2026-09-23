package br.com.guilhermetonelli.chamados;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UsuarioPerfilTest {

    // Estes testes verificam persistência, não autenticação.
    private static final String HASH_TESTE = "hash-ficticio-para-teste";

    @Autowired
    private UsuarioRepository repository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void preparar() {
        repository.deleteAll();
        repository.flush();
        entityManager.clear();
    }

    @Test
    void devePersistirNovoUsuarioComoSolicitante() {
        Usuario usuario = new Usuario(
            "Usuario Teste",
            "perfil@example.com",
            HASH_TESTE
        );

        assertEquals(PerfilUsuario.SOLICITANTE, usuario.getPerfil());

        Integer id = repository.saveAndFlush(usuario).getId();
        entityManager.clear();

        Usuario salvo = repository.findById(id).orElseThrow();

        assertEquals(PerfilUsuario.SOLICITANTE, salvo.getPerfil());
    }

    @Test
    void deveAplicarPerfilPadraoNoBancoQuandoOmitido() {
        jdbcTemplate.update(
            """
            INSERT INTO usuarios (nome, email, senha_hash, ativo)
            VALUES (?, ?, ?, ?)
            """,
            "Usuario SQL",
            "padrao@example.com",
            HASH_TESTE,
            true
        );

        Usuario salvo = repository.findByEmail("padrao@example.com")
            .orElseThrow();

        assertEquals(PerfilUsuario.SOLICITANTE, salvo.getPerfil());
    }

    @Test
    void deveLerPerfilAtendenteArmazenadoNoBanco() {
        Usuario usuario = repository.saveAndFlush(new Usuario(
            "Atendente Teste",
            "atendente@example.com",
            HASH_TESTE
        ));

        // Simula uma atribuição administrativa apenas no banco de testes.
        jdbcTemplate.update(
            "UPDATE usuarios SET perfil = ? WHERE id = ?",
            "ATENDENTE",
            usuario.getId()
        );

        entityManager.clear();

        Usuario salvo = repository.findById(usuario.getId()).orElseThrow();

        assertEquals(PerfilUsuario.ATENDENTE, salvo.getPerfil());
    }

    @Test
    void deveRejeitarPerfilDesconhecidoNoBanco() {
        Usuario usuario = repository.saveAndFlush(new Usuario(
            "Usuario Teste",
            "invalido@example.com",
            HASH_TESTE
        ));

        assertThrows(
            DataIntegrityViolationException.class,
            () -> jdbcTemplate.update(
                "UPDATE usuarios SET perfil = ? WHERE id = ?",
                "ADMINISTRADOR",
                usuario.getId()
            )
        );
    }
}